import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { extractTextFromPDF, fileToDataURL } from '../services/pdfService';
import { saveDocument, getDocuments, deleteDocument } from '../services/storageService';
import { Document } from '../types';
import { UploadCloud, FileText, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DocumentList: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const documents = await getDocuments();
      setDocs(documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setIsUploading(true);
    try {
      const text = await extractTextFromPDF(file);
      const dataUrl = await fileToDataURL(file);
      
      const newDoc: Document = {
        id: crypto.randomUUID(),
        userId: user?.id || '1',
        filename: file.name,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        text,
        dataUrl
      };

      const savedDoc = await saveDocument(newDoc);
      await loadDocuments();
      
      navigate(`/study/${savedDoc._id || savedDoc.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to process PDF. Please try another file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id);
      await loadDocuments();
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Documents</h1>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
        >
          {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
          {isUploading ? 'Processing...' : 'Upload PDF'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="application/pdf"
          onChange={handleFileUpload}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.length > 0 ? (
            docs.map(doc => (
              <Link to={`/study/${doc.id || doc._id}`} key={doc.id || doc._id} className="group bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, doc.id || doc._id)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">{doc.filename}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {new Date(doc.uploadDate).toLocaleDateString()}  {(doc.fileSize / 1024).toFixed(1)} KB
                </p>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm group-hover:gap-2 transition-all">
                  Start Learning <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No documents yet</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Upload your first PDF to get started
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
