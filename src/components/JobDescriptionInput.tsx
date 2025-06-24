import React, { useState } from 'react';
import { ArrowLeft, Target, Wand2, Lightbulb } from 'lucide-react';

interface JobDescriptionInputProps {
  onSubmit: (description: string) => void;
  onBack: () => void;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ onSubmit, onBack }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = () => {
    if (!jobDescription.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      onSubmit(jobDescription);
    }, 1500);
  };

  const sampleJobs = [
    {
      title: 'Senior React Developer',
      company: 'TechCorp',
      description: 'We are seeking a Senior React Developer to join our growing team. The ideal candidate will have 5+ years of experience with React, TypeScript, and modern JavaScript frameworks. Experience with Node.js, AWS, and microservices architecture is preferred. You will be responsible for building scalable web applications and mentoring junior developers.'
    },
    {
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      description: 'Looking for a Full Stack Engineer with expertise in JavaScript, Python, and cloud technologies. Must have experience with React, Django, PostgreSQL, and Docker. The role involves designing and implementing features across our entire stack, from database to frontend.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resume Upload</span>
        </button>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Add Job Description</h2>
          <p className="text-lg text-gray-600">
            Paste the job description you're targeting to get personalized optimization suggestions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-900 mb-2">
            Job Description
          </label>
          <p className="text-gray-600 mb-4">
            Copy and paste the complete job posting including requirements, responsibilities, and qualifications
          </p>
        </div>
        
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {jobDescription.length} characters • {jobDescription.split(' ').filter(word => word.length > 0).length} words
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!jobDescription.trim() || isAnalyzing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Optimize Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sample Job Descriptions */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-gray-900">Try these sample job descriptions</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {sampleJobs.map((job, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors duration-200">
              <div className="mb-3">
                <h4 className="font-medium text-gray-900">{job.title}</h4>
                <p className="text-sm text-gray-600">{job.company}</p>
              </div>
              
              <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                {job.description.substring(0, 150)}...
              </p>
              
              <button
                onClick={() => setJobDescription(job.description)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
              >
                Use this example
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">For best optimization results:</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Include the complete job posting with requirements and responsibilities</li>
              <li>• Make sure to include the skills and qualifications section</li>
              <li>• Company culture and benefits sections help with cultural fit optimization</li>
              <li>• The more detailed the job description, the better the optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionInput;