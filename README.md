# LearnAI: Your Personal AI-Powered Study Assistant

LearnAI is a full-stack web application that transforms static PDF documents into interactive and personalized learning experiences.

Instead of simply reading a PDF, users can upload their study material and use LearnAI to understand, revise, and test themselves using features such as document-based chat, summaries, flashcards, quizzes, audio lessons, and personal notes.

The goal of LearnAI is to reduce the time spent manually creating study material and provide students with a single platform for active learning.

---

## 🚀 Features

### 🔐 Secure Authentication

LearnAI provides a secure authentication system that allows users to create and access their accounts.

Users can:

* Register using their email and password
* Log in using their credentials
* Sign in using their Google account
* Maintain authenticated sessions
* Access their personal documents and study material securely

Authentication is implemented using **JWT-based authentication** along with Google OAuth.

---

### 📄 PDF Document Management

Users can upload their study documents and manage them from a centralized dashboard.

The document management system allows users to:

* Upload PDF documents
* View uploaded documents
* Select a document for studying
* Manage multiple study materials
* Access learning tools associated with a document

Each user's documents are associated with their account so that study material remains separated between users.

---

# 🧠 AI-Powered Study Tools

LearnAI converts the content of uploaded documents into different learning formats.

Instead of reading the same document repeatedly, students can interact with the material using several learning modes.

---

## 💬 AI Chat

The AI Chat feature allows users to have a conversation about the uploaded document.

Users can ask questions such as:

* "Explain this topic in simple words."
* "What is the main idea of this chapter?"
* "Explain the difference between TCP and UDP."
* "Give me an example of this concept."
* "What are the important points from this section?"

The system uses the document's content as the context for generating relevant explanations.

This makes the application behave like a personal study assistant rather than a simple PDF reader.

---

## 📝 AI Summary

The summary feature converts lengthy documents into concise study material.

Users can quickly obtain:

* Important concepts
* Key points
* Main ideas
* Important definitions
* Simplified explanations

This is particularly useful when reviewing large PDFs before examinations.

For example:

```text
Original Document
       ↓
Document Content
       ↓
Important Concepts
       ↓
Concise Summary
```

---

## 🗂️ AI Flashcards

LearnAI can automatically generate flashcards from document content.

Flashcards contain important:

* Terms
* Definitions
* Concepts
* Facts
* Questions and answers

Example:

```text
Question:
What is polymorphism?

Answer:
Polymorphism is the ability of an object or
function to take multiple forms.
```

Flashcards help users use **active recall**, which is more effective for revision than repeatedly reading the same material.

---

## 🧪 AI Quiz

The quiz feature generates multiple-choice questions based on the uploaded document.

A typical quiz contains:

* Questions
* Multiple options
* Correct answers
* Knowledge-testing content

For example:

```text
What does TCP provide?

A. Unreliable communication
B. Connection-oriented communication
C. Only broadcasting
D. Physical transmission

Correct Answer:
B. Connection-oriented communication
```

This allows students to immediately test their understanding after studying a topic.

---

## 🔊 AI Audio Lessons

LearnAI can convert study material into audio lessons.

This allows users to learn while:

* Travelling
* Walking
* Exercising
* Taking breaks from the screen

Audio lessons are available in:

* English
* Hinglish

The Hinglish mode is particularly useful for students who prefer explanations that combine English with Hindi.

---

## 📒 Personal Notes

Users can maintain their own notes while studying.

Notes can be used for:

* Important points
* Personal explanations
* Questions
* Exam preparation
* Additional information
* Topics that require further revision

This keeps personal study material together with the corresponding document.

---

# 🏗️ Application Architecture

LearnAI follows a client-server architecture.

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │                     │
                    │  • Dashboard       │
                    │  • PDF Management  │
                    │  • Chat             │
                    │  • Quiz            │
                    │  • Flashcards      │
                    │  • Summary         │
                    │  • Notes           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │                     │
                    │  • Authentication  │
                    │  • User Management │
                    │  • Documents       │
                    │  • Study Features  │
                    │  • Data Processing │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │                     │
                    │  • Users            │
                    │  • Documents        │
                    │  • Notes            │
                    │  • Study Data       │
                    └─────────────────────┘
```

The frontend is responsible for the user interface and interaction, while the backend handles authentication, application logic, data processing, and communication with the database.

---

# 🛠️ Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### React

React is used to build the interactive user interface.

The application is divided into reusable components such as:

* Authentication screens
* Dashboard
* Document viewer
* Chat interface
* Quiz interface
* Flashcard interface
* Notes interface

### TypeScript

TypeScript provides static typing and improves code reliability and maintainability.

### Vite

Vite provides a fast development environment and optimized frontend build process.

### Tailwind CSS

Tailwind CSS is used for responsive and consistent UI styling.

---

## Backend

* Node.js
* Express.js

### Node.js

Node.js provides the runtime environment for the backend.

It handles:

* HTTP requests
* Authentication
* Application logic
* Document operations
* Communication with the database

### Express.js

Express.js is used to create the backend server and REST-style routes.

The backend follows a modular structure so that authentication, documents, users, and learning functionality can be managed independently.

---

## Database

### MongoDB

MongoDB is used as the primary database.

It stores application data such as:

* User information
* Authentication-related information
* Uploaded document information
* Personal notes
* Study-related data

MongoDB's document-oriented structure makes it suitable for storing application data that can have different structures.

---

# 🔑 Authentication

LearnAI uses two authentication mechanisms:

### Email & Password

Users can create an account using their email address and password.

Passwords should never be stored directly. Authentication credentials are handled securely before being stored.

### Google Authentication

Users can also authenticate using their Google account.

After successful authentication, the application creates an authenticated session for the user.

### JWT Authentication

JSON Web Tokens are used to maintain authenticated sessions.

The basic authentication flow is:

```text
User
 │
 ▼
Login
 │
 ▼
Backend verifies credentials
 │
 ▼
Authentication successful
 │
 ▼
JWT generated
 │
 ▼
Client stores authentication state
 │
 ▼
Authenticated requests
```

Protected operations require the user to be authenticated.

---

# 📚 Learning Workflow

The typical LearnAI workflow looks like this:

```text
        Upload PDF
            │
            ▼
     Document Processing
            │
            ▼
      Select Document
            │
            ▼
   ┌────────┼─────────┐
   │        │         │
   ▼        ▼         ▼
 Summary   Chat    Flashcards
   │        │         │
   └────────┼─────────┘
            │
            ▼
           Quiz
            │
            ▼
      Test Understanding
            │
            ▼
       Personal Notes
            │
            ▼
       Revision
```

This workflow allows users to move from **learning → understanding → revision → testing** within the same application.

---

# 📁 Project Structure

A simplified project structure looks like:

```text
learnai/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   ├── package.json
│   └── ...
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── public/
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

The exact structure may vary depending on the current implementation.

---

# 🔄 How the Application Works

## Step 1 — User Authentication

The user creates an account or signs in.

The application verifies the user's identity and establishes an authenticated session.

---

## Step 2 — Upload Study Material

The user uploads a PDF document.

The application processes the document and makes its content available for the learning features.

---

## Step 3 — Select a Learning Mode

The user can choose between multiple learning tools:

```text
PDF
 │
 ├── Chat
 ├── Summary
 ├── Flashcards
 ├── Quiz
 ├── Audio Lesson
 └── Personal Notes
```

---

## Step 4 — Interactive Learning

The selected learning feature processes the document's content and produces an appropriate learning experience.

For example:

```text
PDF
 ↓
Content Extraction
 ↓
Relevant Information
 ↓
Learning Tool
 ↓
Student-Friendly Output
```

---

## Step 5 — Revision

Users can use summaries, flashcards, quizzes, and notes to revise the material.

This makes LearnAI useful throughout the entire study cycle rather than only during the initial reading stage.

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure the following software is installed:

* Node.js v18 or later
* MongoDB
* Git

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd learnai
```

---

# 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `backend` directory.

```env
MONGO_URI=<Your_MongoDB_Connection_String>
JWT_SECRET=<Your_JWT_Secret>
GOOGLE_CLIENT_ID=<Your_Google_OAuth_Client_ID>
GOOGLE_CLIENT_SECRET=<Your_Google_OAuth_Client_Secret>
```

Start the backend development server:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:3000
```

---

# 3. Frontend Setup

Open another terminal and return to the project root:

```bash
cd learnai
```

Install dependencies:

```bash
npm install
```

Create the required frontend environment configuration according to the project's configuration.

Then start the development server:

```bash
npm run dev
```

The frontend will generally be available at:

```text
http://localhost:5173
```

---

# 4. Open LearnAI

Open your browser and visit:

```text
http://localhost:5173
```

You can now register/login and begin using the application.

---

# 🔒 Security Considerations

LearnAI is designed with several security considerations:

* JWT-based authentication
* Protected backend routes
* User-specific document access
* Environment variables for sensitive configuration
* OAuth-based authentication
* Server-side validation
* Separation between frontend and backend
* Database-backed user management

Sensitive credentials should never be committed to the Git repository.

Make sure `.env` files are included in `.gitignore`.

Example:

```text
.env
node_modules/
dist/
```

---

# 🎯 Problem Solved

Traditional PDF-based studying has several problems:

* Students spend a lot of time reading lengthy documents.
* Creating summaries manually is time-consuming.
* Making flashcards manually requires additional effort.
* Students need separate tools for quizzes and notes.
* Revising large documents can be difficult.
* Students may struggle to understand complex topics without assistance.

LearnAI brings these activities into one platform.

```text
Traditional Study

PDF → Read → Make Notes → Make Flashcards → Find Questions → Revise


LearnAI

PDF
 ↓
LearnAI
 ↓
Chat + Summary + Flashcards + Quiz + Audio + Notes
 ↓
Learn → Understand → Revise → Test
```

---

# 🌟 Key Benefits

### For Students

* Faster revision
* Interactive document learning
* Automated study material generation
* Personalized explanations
* Active recall through quizzes and flashcards
* Audio-based learning
* Centralized study workspace

### For Educators

The platform can also serve as a foundation for creating interactive learning material from:

* Lecture notes
* Course PDFs
* Study guides
* Reference material
* Educational documents

---

# 🚀 Future Improvements

Potential future improvements include:

* Spaced-repetition flashcards
* Advanced progress tracking
* Study streaks
* Personalized learning recommendations
* Difficulty-based quizzes
* Multiple document comparison
* Collaborative study rooms
* Bookmarking important sections
* Advanced search inside documents
* Learning analytics
* Mobile application
* Offline study support

---

# 📌 Project Highlights

LearnAI demonstrates practical experience with:

* Full-stack web development
* React-based frontend architecture
* TypeScript
* REST-style backend development
* Node.js and Express.js
* MongoDB database design
* JWT authentication
* OAuth authentication
* PDF processing
* Interactive UI development
* AI-assisted learning workflows
* Responsive web design
* Secure environment configuration

---

# 📄 License

This project is developed for educational and personal project purposes.

---

# 👨‍💻 About

LearnAI was built as a full-stack learning platform focused on making document-based studying more interactive, efficient, and personalized.

The application combines modern web technologies with intelligent document processing to transform ordinary PDFs into interactive learning experiences.
