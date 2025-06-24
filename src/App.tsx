import React, { useState } from 'react';
import { FileText, Target, Brain, BarChart3 } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import ResumeUpload from './components/ResumeUpload';
import JobDescriptionInput from './components/JobDescriptionInput';
import OptimizationEngine, { clearOptimizationCache } from './components/OptimizationEngine';
import ResultsDashboard from './components/ResultsDashboard';

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [resumeData, setResumeData] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  const steps = [
    { id: 0, title: 'Welcome', icon: Brain },
    { id: 1, title: 'Upload Resume', icon: FileText },
    { id: 2, title: 'Job Description', icon: Target },
    { id: 3, title: 'Optimization', icon: BarChart3 },
  ];

  const handleResumeUpload = (data: any) => {
    clearOptimizationCache(); // Clear cache when a new resume is uploaded
    setResumeData(data);
    setCurrentStep(2);
  };

  const handleJobDescriptionSubmit = (description: string) => {
    setJobDescription(description);
    setCurrentStep(3);
  };

  const handleOptimizationComplete = (results: any) => {
    setOptimizationResults(results);
  };

  // Add navigation: clicking the logo returns to landing page (step 0)
  const handleLogoClick = () => {
    setCurrentStep(0);
    setResumeData(null);
    setJobDescription('');
    setOptimizationResults(null);
  };

  // Add: re-analyze with optimized resume
  const handleReanalyzeOptimizedResume = (optimizedContent: string) => {
    clearOptimizationCache();
    setResumeData((prev: any) => ({ ...prev, content: optimizedContent, pdfArrayBuffer: null }));
    setOptimizationResults(null);
    setCurrentStep(3); // Stay on optimization step
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header steps={steps} currentStep={currentStep} onLogoClick={handleLogoClick} />
      
      <main className="relative">
        {currentStep === 0 && (
          <Hero onGetStarted={() => setCurrentStep(1)} />
        )}
        
        {currentStep === 1 && (
          <ResumeUpload onUpload={handleResumeUpload} />
        )}
        
        {currentStep === 2 && (
          <JobDescriptionInput 
            onSubmit={handleJobDescriptionSubmit}
            onBack={() => setCurrentStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <OptimizationEngine 
              resumeData={resumeData}
              jobDescription={jobDescription}
              onComplete={handleOptimizationComplete}
            />
            
            {optimizationResults && (
              <ResultsDashboard 
                results={optimizationResults}
                resumeData={resumeData}
                jobDescription={jobDescription}
                onReanalyzeOptimizedResume={handleReanalyzeOptimizedResume}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;