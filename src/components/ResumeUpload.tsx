import React, { useState, useRef } from 'react';
import { Upload, FileText, File, AlertCircle, Check } from 'lucide-react';
import extractTextFromPDF from './pdfTextExtract';

interface ResumeUploadProps {
  onUpload: (data: any) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [resumeText, setResumeText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setIsProcessing(true);
    let resumeContent = '';
    let pdfArrayBuffer = null;
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // PDF: extract real text
        const arrayBuffer = await file.arrayBuffer();
        pdfArrayBuffer = arrayBuffer;
        resumeContent = await extractTextFromPDF(arrayBuffer);
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        // TXT: read as text
        resumeContent = await file.text();
      } else {
        // Fallback: just read as text (for doc/docx, you may want to add mammoth or similar)
        resumeContent = await file.text();
      }
    } catch (e) {
      resumeContent = '[Failed to extract resume text]';
    }
    
    setTimeout(() => {
      const resumeData = {
        fileName: file.name,
        fileSize: file.size,
        content: resumeContent,
        pdfArrayBuffer,
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
        experience: ['Software Engineer', 'Web Development', 'Team Leadership', 'Performance Optimization'],
        education: ['Computer Science', 'Bachelor of Science']
      };
      
      setIsProcessing(false);
      onUpload(resumeData);
    }, 500);
  };

  const handleTextUpload = () => {
    if (!resumeText.trim()) return;
    
    setIsProcessing(true);
    
    setTimeout(() => {
      const mockResumeData = {
        content: resumeText,
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
        experience: ['Software Engineer', 'Web Development', 'Team Leadership', 'Performance Optimization'],
        education: ['Computer Science', 'Bachelor of Science']
      };
      
      setIsProcessing(false);
      onUpload(mockResumeData);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Resume</h2>
        <p className="text-lg text-gray-600">
          Upload your resume or paste the content to get started with AI-powered optimization
        </p>
      </div>

      {/* Upload Method Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setUploadMethod('file')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
              uploadMethod === 'file'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setUploadMethod('text')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
              uploadMethod === 'text'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {uploadMethod === 'file' ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-8 transition-all duration-200 hover:border-blue-400">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`text-center transition-all duration-200 ${isDragging ? 'scale-105' : ''}`}
          >
            {isProcessing ? (
              <div className="py-12">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">Processing your resume...</p>
                <p className="text-sm text-gray-500 mt-2">Extracting text and analyzing content</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop your resume here, or click to browse
                </h3>
                <p className="text-gray-600 mb-6">
                  Support for PDF, DOC, DOCX files up to 10MB
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Choose File
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4" />
                    <span>DOC/DOCX</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>TXT</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-900 mb-2">
              Paste Your Resume Content
            </label>
            <p className="text-gray-600 mb-4">
              Copy and paste your resume text directly into the text area below
            </p>
          </div>
          
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content here..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleTextUpload}
              disabled={!resumeText.trim() || isProcessing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Process Resume</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Tips for best results:</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Use a standard resume format with clear sections</li>
              <li>• Include your contact information, experience, skills, and education</li>
              <li>• Avoid images or graphics that might not be parsed correctly</li>
              <li>• Make sure your resume is up-to-date and accurate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;