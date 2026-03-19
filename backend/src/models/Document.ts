import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  fileSize: number;
  uploadDate: Date;
  text: string;
  dataUrl: string;
  
  // Cached generated content
  summary?: string;
  notes?: string;
  importantPoints?: string;
  explanation?: string;
  flashcards?: Array<{
    front: string;
    back: string;
  }>;
  quiz?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
    generatedAt: Date;
  };
  audioLesson?: {
    text: string;
    generatedAt: Date;
  };
  audioCache?: Array<{
    key: string;
    url: string;
    scriptText?: string;
  }>;
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

const DocumentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  text: { type: String, required: true },
  dataUrl: { type: String, required: true },
  
  // Cached generated content
  summary: { type: String },
  notes: { type: String },
  importantPoints: { type: String },
  explanation: { type: String },
  flashcards: [{
    front: String,
    back: String
  }],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number
    }],
    generatedAt: Date
  },
  audioLesson: {
    text: String,
    generatedAt: Date
  },
  audioCache: [{
    key: { type: String, required: true },
    url: { type: String, default: '' },
    scriptText: { type: String, default: '' }
  }],
  chatHistory: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);
