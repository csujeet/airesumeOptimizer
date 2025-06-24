import React, { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Eye, 
  BarChart3, 
  Lightbulb,
  Star,
  Award,
  ArrowRight,
  FileText,
  Zap,
  Users,
  Brain,
  X,
  Copy,
  Check
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import extractTextFromPDF from './pdfTextExtract';

interface ResultsDashboardProps {
  results: any;
  resumeData: any;
  jobDescription: string;
  onReanalyzeOptimizedResume?: (optimizedContent: string) => void;
}

// Move cache outside component so it persists across renders
const coverLetterCache = new Map<string, string>();

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, resumeData, jobDescription, onReanalyzeOptimizedResume }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showOptimizedResume, setShowOptimizedResume] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterContent, setCoverLetterContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  // Add: Use Optimized Resume for Analysis
  const [optimizedResumeContent, setOptimizedResumeContent] = useState<string | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isCustomizingCoverLetter, setIsCustomizingCoverLetter] = useState(false);
  const [customCoverLetter, setCustomCoverLetter] = useState('');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'keywords', label: 'Keywords', icon: Target },
    { id: 'improvements', label: 'Improvements', icon: TrendingUp },
    { id: 'skills', label: 'Skills Gap', icon: Brain }
  ];

  const generateOptimizedResume = () => {
    const missingKeywords = Array.isArray(results.missingKeywords) ? results.missingKeywords : [];
    const strongMatches = Array.isArray(results.strongMatches) ? results.strongMatches : [];
    const optimizedContent = `${resumeData.content}

OPTIMIZED ENHANCEMENTS:

TECHNICAL SKILLS (Enhanced):
• ${missingKeywords.slice(0, 8).join(' • ')}
• ${strongMatches.slice(0, 6).join(' • ')}

KEY ACHIEVEMENTS (Quantified):
• Improved application performance by 40% through React optimization
• Led cross-functional team of 5+ developers on major product releases
• Implemented automated testing reducing production bugs by 30%
• Delivered 15+ features using Agile methodology and CI/CD practices

RELEVANT EXPERIENCE (ATS Optimized):
• Extensive experience with ${missingKeywords.slice(0, 3).join(', ')}
• Proven track record in ${strongMatches.slice(0, 3).join(', ')}
• Strong background in modern development practices and cloud technologies`;
    return optimizedContent;
  };

  const generateCoverLetter = () => {
    const missingKeywords = Array.isArray(results.missingKeywords) ? results.missingKeywords : [];
    const strongMatches = Array.isArray(results.strongMatches) ? results.strongMatches : [];
    const jobKeywords = missingKeywords.concat(strongMatches).slice(0, 10);
    return `Dear Hiring Manager,

I am writing to express my strong interest in the position described in your job posting. After analyzing the requirements, I am confident that my technical expertise and professional experience make me an ideal candidate for this role.

My background includes extensive experience with ${strongMatches.slice(0, 4).join(', ')}, which directly aligns with your technical requirements. Throughout my career, I have successfully:

• Developed and maintained scalable applications using modern frameworks and technologies
• Collaborated with cross-functional teams to deliver high-quality software solutions
• Implemented best practices in ${strongMatches.slice(0, 3).join(', ')} development
• Led projects that improved system performance and user experience

I am particularly excited about this opportunity because it combines my passion for ${strongMatches[0] ?? ''} development with my experience in ${strongMatches[1] ?? ''}. Your job description mentions ${missingKeywords.slice(0, 3).join(', ')}, which are areas I am actively developing and would love to contribute to your team.

Key qualifications that make me a strong fit:
• ${Math.floor(Math.random() * 3) + 3}+ years of experience in software development
• Proven track record of delivering projects on time and within scope
• Strong problem-solving skills and attention to detail
• Excellent communication and teamwork abilities

I would welcome the opportunity to discuss how my skills and enthusiasm can contribute to your team's success. Thank you for considering my application.

Best regards,
[Your Name]

---
This cover letter was generated based on your resume and the job description analysis. Please customize it with your personal details and specific examples from your experience.`;
  };

  const handlePreviewOptimizedResume = () => {
    setShowOptimizedResume(!showOptimizedResume);
  };

  // LLM-powered cover letter generation
  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true);
    try {
      const API_KEY = import.meta.env.VITE_GROQCLOUD_API_KEY;
      const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
      if (!API_KEY) {
        setCoverLetterContent('GroqCloud API key is missing. Check your .env file.');
        setIsGeneratingCoverLetter(false);
        setShowCoverLetter(true);
        return;
      }
      let resumeText = '';
      if (resumeData.pdfArrayBuffer) {
        resumeText = await extractTextFromPDF(resumeData.pdfArrayBuffer);
      } else if (resumeData.content) {
        resumeText = resumeData.content;
      } else {
        resumeText = '[No resume text available]';
      }
      // Use a robust cache key: hash of resumeText + jobDescription
      function simpleHash(str: string) {
        let hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
          chr = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0;
        }
        return hash;
      }
      const cacheKey = JSON.stringify({ resumeHash: simpleHash(resumeText), jobHash: simpleHash(jobDescription) });
      if (coverLetterCache.has(cacheKey)) {
        setCoverLetterContent(coverLetterCache.get(cacheKey) || 'No cover letter generated.');
        setShowCoverLetter(true);
        setIsGeneratingCoverLetter(false);
        return;
      }
      // --- Improved prompt for more tailored cover letter ---
      const prompt = `You are an expert career coach and professional writer. Write a concise, formal, and highly tailored cover letter (max 200 words) for the following job application.\n\nUse only the information from the candidate's resume and the job description below.\n\n- Reference specific skills, achievements, and experience that are present in BOTH the resume and the job description.\n- Clearly demonstrate how the candidate's background matches the job requirements.\n- Mention the job title and company if available.\n- Avoid generic statements and focus on real, relevant matches.\n- Write in a natural, business-like tone.\n\nResume Content:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nFormat the cover letter as a formal business letter. Do not include placeholders. Do not repeat the resume verbatim. Do not exceed 200 words.`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          temperature: 0,
          top_p: 1,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await response.json();
      let llmResponse = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        llmResponse = data.choices[0].message.content;
      }
      coverLetterCache.set(cacheKey, llmResponse || 'No cover letter generated.');
      setCoverLetterContent(llmResponse || 'No cover letter generated.');
      setShowCoverLetter(true);
    } catch (err: any) {
      setCoverLetterContent('Error generating cover letter: ' + (err && err.message ? err.message : String(err)));
      setShowCoverLetter(true);
    }
    setIsGeneratingCoverLetter(false);
  };

  // LLM-powered optimized resume Word download with improved formatting
  const handleDownloadOptimizedResume = async () => {
    let optimizedText = '';
    try {
      if (resumeData.pdfArrayBuffer) {
        // 1. Extract text from PDF
        const originalText = await extractTextFromPDF(resumeData.pdfArrayBuffer);
        // 2. Ask LLM to rewrite resume
        const API_KEY = import.meta.env.VITE_GROQCLOUD_API_KEY;
        const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
        const suggestions = results.improvements || 'No suggestions.';
        const prompt = `Rewrite the following resume to incorporate these suggestions. Keep the format professional and concise.\nResume:\n${originalText}\nSuggestions:\n${JSON.stringify(suggestions)}`;
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'user', content: prompt }
            ]
          })
        });
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          optimizedText = data.choices[0].message.content;
        }
      } else if (resumeData.content) {
        // If not PDF, just use the content
        optimizedText = resumeData.content;
      } else {
        alert('No resume found. Please upload your resume first.');
        return;
      }
      // --- Custom formatting for Word export (match sample image) ---
      const lines = optimizedText.split(/\r?\n/).map(l => l.trim());
      let name = '', address = '', phone = '', email = '', linkedin = '';
      let headerEndIdx = 0;
      // Try to extract header info from the first 10 lines
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        if (/^[A-Z][a-z]+( [A-Z][a-z]+)+$/.test(line)) name = line; // Name: Title Case
        if (/phone|number/i.test(line)) phone = line.replace(/^(Phone number:|Phone:)/i, '').trim();
        if (/email/i.test(line)) email = line.replace(/^(Email:)/i, '').trim();
        if (/address/i.test(line)) address = line.replace(/^(Address:)/i, '').trim();
        if (/linkedin/i.test(line)) linkedin = line.replace(/^(LinkedIn:)/i, '').trim();
        if (line === '' && i > 0) { headerEndIdx = i; break; }
      }
      if (!name && lines[0]) name = lines[0];
      // Remove header lines from main content
      const contentLines = lines.slice(headerEndIdx + 1).filter(l => l);
      // Build docx content
      const docChildren = [];
      // Top border (horizontal line)
      docChildren.push(
        new Paragraph({
          border: { top: { color: '000000', space: 1, style: 'single', size: 8 } },
          spacing: { after: 100 }
        })
      );
      // Name (centered, large, bold)
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: name, bold: true, size: 40, font: 'Times New Roman' })
          ],
          alignment: 'center',
          spacing: { after: 80 }
        })
      );
      // Contact info (centered, single line, separated by symbols)
      const contactParts = [];
      if (address) contactParts.push(address);
      if (phone) contactParts.push(`Phone: ${phone}`);
      if (email) contactParts.push(email);
      if (linkedin) contactParts.push(linkedin);
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: contactParts.join(' ♦ '), size: 24, font: 'Times New Roman' })
          ],
          alignment: 'center',
          spacing: { after: 100 }
        })
      );
      // Now parse and format the rest
      let lastSection = '';
      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i];
        if (!line) continue;
        // Section heading: ALL CAPS, bold, left
        if (/^[A-Z ]{3,}$/.test(line) && line.length > 2) {
          lastSection = line;
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, size: 28, font: 'Times New Roman' })],
              spacing: { after: 60 }
            })
          );
        } else if (/^[A-Z0-9 .\-&()]+$/.test(line) && line.length > 2 && lastSection) {
          // Subsection heading (e.g., company or degree)
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, size: 26, font: 'Times New Roman' })],
              spacing: { after: 40 }
            })
          );
        } else if (/^(•|-|\*)\s?/.test(line)) {
          // Bullet point
          docChildren.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: line.replace(/^(•|-|\*)\s?/, ''), size: 24, font: 'Times New Roman' })],
              spacing: { after: 20 }
            })
          );
        } else if (/^([A-Za-z0-9 .,&()\-]+)\s{2,}([A-Za-z .,&()\-]+)$/.test(line)) {
          // Job/company left, city/state right (split by 2+ spaces)
          const match = line.match(/^([A-Za-z0-9 .,&()\-]+)\s{2,}([A-ZaZ .,&()\-]+)$/);
          if (match) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({ text: match[1].trim(), bold: true, size: 26, font: 'Times New Roman' }),
                  new TextRun({ text: ' '.repeat(60) }),
                  new TextRun({ text: match[2].trim(), bold: true, size: 26, font: 'Times New Roman' })
                ],
                spacing: { after: 20 }
              })
            );
          }
        } else {
          // Normal paragraph
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 24, font: 'Times New Roman' })],
              spacing: { after: 20 }
            })
          );
        }
      }
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized_resume.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate optimized Word file: ' + err);
    }
  };

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadCoverLetter = () => {
    const blob = new Blob([coverLetterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fallback: show a message if results are empty or missing expected fields
  const isResultsEmpty =
    !Array.isArray(results.missingKeywords) &&
    !Array.isArray(results.strongMatches) &&
    !Array.isArray(results.improvements) &&
    !Array.isArray(results.skillsGap) &&
    (!results.industryBenchmark || typeof results.industryBenchmark !== 'object');

  // Helper to generate optimized resume content (text only)
  const handleUseOptimizedResume = async () => {
    setIsReanalyzing(true);
    let optimizedText = '';
    try {
      let originalText = resumeData.content;
      if (resumeData.pdfArrayBuffer) {
        // Use real text extraction for PDFs
        originalText = await extractTextFromPDF(resumeData.pdfArrayBuffer);
      }
      const API_KEY = import.meta.env.VITE_GROQCLOUD_API_KEY;
      const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
      const suggestions = results.improvements || 'No suggestions.';
      const prompt = `Rewrite the following resume to incorporate these suggestions. Keep the format professional and concise.\nResume:\n${originalText}\nSuggestions:\n${JSON.stringify(suggestions)}`;
      // Use a robust cache key for optimization as well (optional, if you cache here)
      // const cacheKey = JSON.stringify({ resumeHash: simpleHash(originalText), suggestionsHash: simpleHash(JSON.stringify(suggestions)) });
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          temperature: 0,
          top_p: 1,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        optimizedText = data.choices[0].message.content;
      }
      setOptimizedResumeContent(optimizedText);
    } catch (err) {
      alert('Failed to generate optimized resume: ' + err);
    }
    setIsReanalyzing(false);
  };

  return (
    <div className="space-y-8">
      {/* PDF Warning */}
      {resumeData.pdfArrayBuffer && (
        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-lg mb-4">
          <strong>Note:</strong> PDF resume analysis is limited. For best results and accurate scoring, please upload your resume as a <span className="font-semibold">.docx</span> or <span className="font-semibold">.txt</span> file. PDF text extraction is not supported in-browser, so the AI cannot analyze your real resume content.
        </div>
      )}
      {/* Header with Key Metrics */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Optimization Results</h2>
          <p className="text-gray-600">Your resume has been analyzed and optimized for the target position</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${getScoreBgColor(results.overallScore)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(results.overallScore)}`}>
                {results.overallScore}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Overall Score</h3>
            <p className="text-sm text-gray-600">Resume optimization rating</p>
          </div>

          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${getScoreBgColor(results.atsScore)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(results.atsScore)}`}>
                {results.atsScore}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">ATS Score</h3>
            <p className="text-sm text-gray-600">System compatibility</p>
          </div>

          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${getScoreBgColor(results.keywordMatch)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(results.keywordMatch)}`}>
                {results.keywordMatch}%
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Keyword Match</h3>
            <p className="text-sm text-gray-600">Job description alignment</p>
          </div>
        </div>

        {/* Industry Benchmark */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-gray-900">Industry Benchmark</h4>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {results.industryBenchmark?.yourPosition || 'N/A'}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Your Score</span>
              <span className="font-semibold text-blue-600">{results.overallScore ?? 'N/A'}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Industry Average</span>
              <span className="font-semibold text-gray-700">{results.industryBenchmark?.averageScore ?? 'N/A'}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Top 10% Threshold</span>
              <span className="font-semibold text-green-600">{results.industryBenchmark?.topPercentile ?? 'N/A'}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {isResultsEmpty ? (
            <div className="text-center text-red-600 font-semibold text-lg py-12">
              No optimization results available.<br />
              Please ensure your resume and job description are provided and try again.<br />
              If this persists, the AI may not be returning the expected data format.
            </div>
          ) : activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Wins</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Strong Matches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(results.strongMatches) ? results.strongMatches.slice(0, 6).map((skill: string, index: number) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {skill}
                        </span>
                      )) : null}
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Missing Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(results.missingKeywords) ? results.missingKeywords.slice(0, 6).map((keyword: string, index: number) => (
                        <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                          {keyword}
                        </span>
                      )) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">AI Recommendation</h4>
                </div>
                <p className="text-blue-800 mb-4">
                  Your resume shows strong technical skills but could benefit from more specific keywords related to {(Array.isArray(results.missingKeywords) ? results.missingKeywords.slice(0, 3).join(', ') : '')}. 
                  Consider adding these terms naturally within your experience descriptions.
                </p>
                <div className="flex space-x-4">
                  <span className="text-sm text-blue-700">Impact: High</span>
                  <span className="text-sm text-blue-700">Effort: Low</span>
                  <span className="text-sm text-blue-700">Time: 10 minutes</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Keywords Found ({results.strongMatches.length})</span>
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(results.strongMatches ?? []).map((keyword: string, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <span className="text-green-900 font-medium">{keyword}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 text-sm">Match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>Missing Keywords ({results.missingKeywords.length})</span>
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(results.missingKeywords ?? []).map((keyword: string, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                        <span className="text-red-900 font-medium">{keyword}</span>
                        <button className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-sm transition-colors duration-200">
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-semibold text-yellow-900 mb-3">Keyword Optimization Tips</h4>
                <ul className="text-yellow-800 space-y-2">
                  <li>• Use keywords naturally within your experience descriptions</li>
                  <li>• Include variations and synonyms of important terms</li>
                  <li>• Place critical keywords in your summary and skills sections</li>
                  <li>• Don't stuff keywords - maintain readability and context</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'improvements' && (
            <div className="space-y-6">
              {Array.isArray(results.improvements) ? results.improvements.map((category: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`px-6 py-4 border-b border-gray-200 ${
                    category.priority === 'high' ? 'bg-red-50' : 
                    category.priority === 'medium' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{category.category}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(category.priority)}`}>
                        {category.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {Array.isArray(category.suggestions) ? category.suggestions.map((suggestion: string, suggestionIndex: number) => (
                        <li key={suggestionIndex} className="flex items-start space-x-3">
                          <ArrowRight className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{suggestion}</span>
                        </li>
                      )) : null}
                    </ul>
                  </div>
                </div>
              )) : null}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-blue-900">Skills Gap Analysis</h3>
                </div>
                <p className="text-blue-800 mb-4">
                  Based on the job description, here are the skills that would strengthen your application:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">High-Impact Skills to Add</h4>
                  <div className="space-y-3">
                    {(results.skillsGap ?? []).map((skill: string, index: number) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-orange-900">{skill}</span>
                          <span className="text-orange-600 text-sm">High Impact</span>
                        </div>
                        <p className="text-orange-800 text-sm">
                          This skill appears frequently in the job description and similar roles.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Learning Resources</h4>
                  <div className="space-y-3">
                    {(results.skillsGap ?? []).slice(0, 3).map((skill: string, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{skill}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>• Online courses and certifications available</p>
                          <p>• Practice projects and tutorials recommended</p>
                          <p>• Community resources and documentation</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Sticky Footer with Action Buttons */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 flex flex-col md:flex-row gap-4 justify-center items-center py-4 shadow-lg">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          onClick={handleGenerateCoverLetter}
          type="button"
          disabled={isGeneratingCoverLetter}
        >
          <Zap className="w-4 h-4" />
          {isGeneratingCoverLetter ? 'Generating...' : 'Generate Cover Letter'}
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          onClick={handleDownloadOptimizedResume}
          type="button"
        >
          <Download className="w-4 h-4" />
          Download Optimized Resume
        </button>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
          onClick={handleUseOptimizedResume}
          type="button"
          disabled={isReanalyzing}
        >
          <Zap className="w-4 h-4" />
          {isReanalyzing ? 'Optimizing...' : 'Generate & Analyze Optimized Resume'}
        </button>
      </div>
      {/* Optimized Resume Modal */}
      {optimizedResumeContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Optimized Resume (Preview)</span>
              </h3>
              <button
                onClick={() => setOptimizedResumeContent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] font-mono text-sm whitespace-pre-line leading-relaxed bg-gray-50">
              {optimizedResumeContent}
            </div>
            <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                onClick={() => {
                  if (typeof onReanalyzeOptimizedResume === 'function') {
                    onReanalyzeOptimizedResume(optimizedResumeContent!);
                  }
                  setOptimizedResumeContent(null);
                }}
              >
                <Zap className="w-4 h-4" />
                <span>Analyze This Resume</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cover Letter Modal */}
      {showCoverLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Generated Cover Letter</span>
              </h3>
              <button
                onClick={() => { setShowCoverLetter(false); setIsCustomizingCoverLetter(false); }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!isCustomizingCoverLetter ? (
                <div className="bg-gray-50 rounded-lg p-6 font-serif text-sm whitespace-pre-line leading-relaxed">
                  {coverLetterContent}
                </div>
              ) : (
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-serif text-sm resize-vertical"
                  value={customCoverLetter}
                  onChange={e => setCustomCoverLetter(e.target.value)}
                  autoFocus
                />
              )}
            </div>
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => handleCopyToClipboard(isCustomizingCoverLetter ? customCoverLetter : coverLetterContent)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleDownloadCoverLetter()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                {!isCustomizingCoverLetter ? (
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                    onClick={() => { setIsCustomizingCoverLetter(true); setCustomCoverLetter(coverLetterContent); }}
                  >
                    Customize
                  </button>
                ) : (
                  <>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 mr-2"
                      onClick={() => { setCoverLetterContent(customCoverLetter); setIsCustomizingCoverLetter(false); }}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-500 transition-colors duration-200"
                      onClick={() => setIsCustomizingCoverLetter(false)}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;