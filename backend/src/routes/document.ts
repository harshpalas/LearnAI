import express from 'express';
import { authMiddleware } from '../middleware/auth';
import Document from '../models/Document';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({ userId: (req.user as any)._id });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const document = await Document.create({
      userId: (req.user as any)._id,
      ...req.body
    });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: (req.user as any)._id
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      req.body,
      { new: true }
    );
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: (req.user as any)._id
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;

// Save specific generated content types
router.patch('/:id/summary', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      { summary: req.body.summary },
      { new: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save summary' });
  }
});

router.patch('/:id/notes', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      { notes: req.body.notes },
      { new: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

router.patch('/:id/important-points', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      { importantPoints: req.body.importantPoints },
      { new: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save important points' });
  }
});

router.patch('/:id/explanation', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      { explanation: req.body.explanation },
      { new: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save explanation' });
  }
});

router.patch('/:id/flashcards', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      { flashcards: req.body.flashcards },
      { new: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save flashcards' });
  }
});

router.patch('/:id/quiz', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      { quiz: { questions: req.body.questions, generatedAt: new Date() } },
      { new: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save quiz' });
  }
});

router.patch('/:id/audio', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: (req.user as any)._id },
      { audioLesson: { text: req.body.text, generatedAt: new Date() } },
      { new: true }
    );
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save audio lesson' });
  }
});

router.patch('/:id/chat', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: (req.user as any)._id
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    
    if (!document.chatHistory) document.chatHistory = [];
    document.chatHistory.push({
      role: req.body.role,
      content: req.body.content,
      timestamp: new Date()
    });
    
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

