import { GoogleGenAI } from '@google/genai';

interface APIKeyStatus {
  key: string;
  index: number;
  lastUsed: Date | null;
  consecutiveErrors: number;
  isDisabled: boolean;
  totalRequests: number;
  totalErrors: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GeminiManager {
  private apiKeys: string[];
  private clients: GoogleGenAI[];
  private keyStatuses: APIKeyStatus[];
  private currentKeyIndex: number = 0;

  constructor() {
    this.apiKeys = this.loadAPIKeys();
    this.clients = this.apiKeys.map(key => new GoogleGenAI({ apiKey: key }));
    this.keyStatuses = this.apiKeys.map((key, index) => ({
      key: key.substring(0, 10) + '...',  // Only store partial key for logging
      index,
      lastUsed: null,
      consecutiveErrors: 0,
      isDisabled: false,
      totalRequests: 0,
      totalErrors: 0
    }));
  }

  private loadAPIKeys(): string[] {
    const keys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5
    ]
    .filter((key): key is string => {
      return typeof key === 'string' &&
             key.trim() !== '' &&
             key !== 'YOUR_SECOND_API_KEY_HERE' &&
             key !== 'YOUR_THIRD_API_KEY_HERE' &&
             key !== 'YOUR_FOURTH_API_KEY_HERE' &&
             key !== 'YOUR_FIFTH_API_KEY_HERE';
    });

    if (keys.length === 0) {
      throw new Error('No valid Gemini API keys configured');
    }

    console.log(`Initialized GeminiManager with ${keys.length} API keys`);
    return keys;
  }

  private getNextKeyIndex(): number {
    const availableKeys = this.keyStatuses.filter(status => !status.isDisabled);

    if (availableKeys.length === 0) {
      // Re-enable all keys if all are disabled
      this.keyStatuses.forEach(status => {
        status.isDisabled = false;
        status.consecutiveErrors = 0;
      });
    }

    // Round-robin: find next available key
    let attempts = 0;
    while (attempts < this.keyStatuses.length) {
      const keyStatus = this.keyStatuses[this.currentKeyIndex];
      if (!keyStatus.isDisabled) {
        return this.currentKeyIndex;
      }
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keyStatuses.length;
      attempts++;
    }

    return 0; // Fallback to first key
  }

  private handleKeyError(keyIndex: number, error: any, isServerBusy: boolean): void {
    const status = this.keyStatuses[keyIndex];
    status.totalErrors++;

    // Don't count server-busy (503) errors towards key disabling —
    // the key itself is fine, the model is just overloaded.
    if (!isServerBusy) {
      status.consecutiveErrors++;
      if (status.consecutiveErrors >= 3) {
        status.isDisabled = true;
        console.log(`API Key ${status.key} temporarily disabled due to repeated failures`);
      }
    }

    console.log(`API Key ${status.key} failed (${status.consecutiveErrors} consecutive errors): ${error.message}`);
  }

  private handleKeySuccess(keyIndex: number): void {
    const status = this.keyStatuses[keyIndex];
    status.consecutiveErrors = 0;
    status.lastUsed = new Date();
    status.totalRequests++;
  }

  private isServerBusyError(error: any): boolean {
    const message = error?.message || '';
    return message.includes('503') ||
           message.includes('UNAVAILABLE') ||
           message.includes('high demand') ||
           message.includes('Service Unavailable');
  }

  async callWithFallback<T>(operation: (client: GoogleGenAI) => Promise<T>): Promise<T> {
    let lastError: any = null;
    const maxAttempts = this.apiKeys.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const keyIndex = this.getNextKeyIndex();
      const client = this.clients[keyIndex];
      const status = this.keyStatuses[keyIndex];

      try {
        console.log(`Attempting API call with key ${status.key} (attempt ${attempt + 1}/${maxAttempts})`);

        const result = await operation(client);
        this.handleKeySuccess(keyIndex);

        // Move to next key for round-robin distribution
        this.currentKeyIndex = (keyIndex + 1) % this.keyStatuses.length;

        return result;
      } catch (error: any) {
        lastError = error;
        const isServerBusy = this.isServerBusyError(error);
        this.handleKeyError(keyIndex, error, isServerBusy);

        // Move to next key
        this.currentKeyIndex = (keyIndex + 1) % this.keyStatuses.length;

        // Don't retry if it's a non-retryable error
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retrying if server is busy or we get a network error,
        // so we don't hammer Google's API and get rate-limited further.
        if (isServerBusy && attempt < maxAttempts - 1) {
          const delay = 2000 + attempt * 1000; // 2s, 3s, 4s ...
          console.log(`Model busy (503), waiting ${delay}ms before next key...`);
          await sleep(delay);
        } else if (attempt < maxAttempts - 1) {
          // Small delay between all retries to avoid connection storms
          await sleep(500);
        }
      }
    }

    // All keys failed
    console.error('All API keys failed. Last error:', lastError);

    const errorMessage = lastError?.message || '';

    if (this.isServerBusyError(lastError)) {
      const busyError = new Error('The AI model is currently experiencing high demand. Please wait a moment and try again.');
      (busyError as any).statusCode = 503;
      throw busyError;
    }

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      const quotaError = new Error('All API keys have reached their daily quota limit. Please try again later or upgrade to a paid plan.');
      (quotaError as any).statusCode = 429;
      throw quotaError;
    }

    throw lastError || new Error('All Gemini API keys exhausted');
  }

  private isNonRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';

    // Don't retry on authentication errors (invalid API key format)
    if (message.includes('invalid api key') || message.includes('authentication')) {
      return true;
    }

    // Don't retry on malformed requests
    if (message.includes('invalid request') || message.includes('bad request')) {
      return true;
    }

    return false;
  }

  getKeyStatistics() {
    return {
      totalKeys: this.apiKeys.length,
      activeKeys: this.keyStatuses.filter(s => !s.isDisabled).length,
      currentKey: this.keyStatuses[this.currentKeyIndex]?.key,
      keyDetails: this.keyStatuses.map(status => ({
        key: status.key,
        isActive: !status.isDisabled,
        lastUsed: status.lastUsed,
        totalRequests: status.totalRequests,
        totalErrors: status.totalErrors,
        consecutiveErrors: status.consecutiveErrors
      }))
    };
  }
}

export const geminiManager = new GeminiManager();
