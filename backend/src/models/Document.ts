import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  fileSize: number;
  uploadDate: Date;
  text: string;
  summary?: string;
  notes?: string;
  dataUrl: string;
}

const DocumentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  text: { type: String, required: true },
  summary: { type: String },
  notes: { type: String },
  dataUrl: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.model<IDocument>('Document', DocumentSchema);
