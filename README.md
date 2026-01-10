# LearnAI: Your Personal AI-Powered Study Assistant

LearnAI is a full-stack web application designed to revolutionize the way you study PDF documents. By leveraging the power of Google's Gemini API, LearnAI transforms your static documents into interactive learning experiences. Upload your PDFs and unlock a suite of AI tools to help you master the material faster and more effectively.

## Features

- **Secure User Authentication**: Sign up and log in securely with your email and password or instantly with your Google account.
- **PDF Document Management**: Easily upload and manage your study documents.
- **AI-Powered Study Tools**:
  - **AI Chat**: Have a conversation with your document. Ask questions, clarify concepts, and get instant explanations.
  - **AI Summary**: Generate concise and detailed summaries of your documents to quickly grasp the key points.
  - **AI Flashcards**: Automatically create flashcards for important terms and concepts to reinforce your learning.
  - **AI Quiz**: Test your knowledge with multiple-choice quizzes generated directly from the document content.
  - **AI Audio Lessons**: Listen to your study material on the go with AI-generated audio lessons, available in both English and Hinglish.
  - **Personal Notes**: Jot down your own thoughts, insights, and questions alongside the document.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB
- **AI**: Google Gemini API
- **Authentication**: JSON Web Tokens (JWT), Google OAuth

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Make sure your MongoDB server is running)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd learnai
    ```

2.  **Set up the Backend:**
    - Navigate to the backend directory:
      ```bash
      cd backend
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file in the `backend` directory and add the following environment variables. Replace the placeholder values with your actual credentials.
      ```env
      MONGO_URI=<Your_MongoDB_Connection_String>
      JWT_SECRET=<Your_JWT_Secret>
      GOOGLE_CLIENT_ID=<Your_Google_OAuth_Client_ID>
      GOOGLE_CLIENT_SECRET=<Your_Google_OAuth_Client_Secret>
      ```
    - Start the backend development server:
      ```bash
      npm run dev
      ```
    The backend server will be running on `http://localhost:3000`.

3.  **Set up the Frontend:**
    - Open a new terminal and navigate to the root project directory.
    - Install dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file in the root directory and add your Google Gemini API key:
      ```env
      VITE_API_KEY=<Your_Google_Gemini_API_Key>
      ```
    - Start the frontend development server:
      ```bash
      npm run dev
      ```
    The frontend will be running on `http://localhost:5173`.

4.  **Open the application:**
    Open your web browser and navigate to `http://localhost:5173` to start using LearnAI.