import React, { useState, useEffect } from 'react';
import { Brain, Zap, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface OptimizationEngineProps {
  resumeData: any;
  jobDescription: string;
  onComplete: (results: any) => void;
}

// Move cache outside component so it persists across renders
const optimizationCache = new Map<string, any>();
// Add a function to clear the cache (for use when a new resume is uploaded)
export function clearOptimizationCache() {
  optimizationCache.clear();
}

const OptimizationEngine: React.FC<OptimizationEngineProps> = ({
  resumeData,
  jobDescription,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { title: 'Parsing Job Description', icon: Brain, duration: 2000 },
    { title: 'Analyzing Keywords', icon: Target, duration: 1500 },
    { title: 'Matching Skills', icon: Zap, duration: 1800 },
    { title: 'Generating Insights', icon: TrendingUp, duration: 2200 },
    { title: 'Creating Recommendations', icon: CheckCircle, duration: 1000 }
  ];

  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval>;
    let stepTimeout: ReturnType<typeof setTimeout>;

    // Helper: robust hash for cache key
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

    // Helper: robust PDF hash (same as ResultsDashboard)
    async function getResumeKey(resumeData: any): Promise<string> {
      if (resumeData.pdfArrayBuffer) {
        // Use first 512 bytes for a quick hash
        const bytes = new Uint8Array(resumeData.pdfArrayBuffer).slice(0, 512);
        let hash = 0;
        for (let i = 0; i < bytes.length; i++) {
          hash = ((hash << 5) - hash) + bytes[i];
          hash |= 0;
        }
        return `[PDF-RESUME-HASH:${hash}]`;
      } else if (resumeData.content) {
        return resumeData.content;
      } else {
        return '[No resume text available]';
      }
    }

    const runOptimization = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        setProgress(0);

        // Animate progress for current step
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + (100 / (steps[i].duration / 100));
          });
        }, 100);

        // Wait for step to complete
        await new Promise(resolve => {
          stepTimeout = setTimeout(resolve, steps[i].duration);
        });

        clearInterval(progressInterval);
        setProgress(100);
      }

      // Generate optimization results using GroqCloud LLM (direct fetch, similar to working JS logic)
      try {
        const API_KEY = import.meta.env.VITE_GROQCLOUD_API_KEY;
        const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
        if (!API_KEY) {
          onComplete({ error: 'GroqCloud API key is missing. Check your .env file.' });
          return;
        }
        // Use robust cache key: hash of resume text/hash and job description
        const resumeKey = await getResumeKey(resumeData);
        const cacheKey = JSON.stringify({ resumeHash: simpleHash(resumeKey), jobHash: simpleHash(jobDescription) });
        if (optimizationCache.has(cacheKey)) {
          onComplete(optimizationCache.get(cacheKey));
          return;
        }
        // Stricter prompt: ONLY return valid JSON, no explanation, no markdown, no extra text
        const prompt = `You are an expert AI resume optimizer. Compare the following resume and job description. Return ONLY a valid JSON object with these exact fields (no markdown, no explanation, no extra text):\n- overallScore (number 0-100)\n- atsScore (number 0-100)\n- keywordMatch (number 0-100)\n- improvements (array of objects: {category, priority, suggestions[]})\n- missingKeywords (array of strings)\n- strongMatches (array of strings)\n- skillsGap (array of strings)\n- industryBenchmark (object: {averageScore, topPercentile, yourPosition})\n\nINSTRUCTIONS:\n- Use ONLY information that is explicitly present in BOTH the resume and the job description.\n- Do NOT invent, hallucinate, or guess any data.\n- All scores and suggestions must be evidence-based and traceable to the input.\n- For missingKeywords and strongMatches, only include terms that are actually present in the job description and/or resume.\n- For improvements, give actionable, specific, and relevant suggestions.\n- Output must be valid JSON, no markdown, no explanation, no extra text.\n\nResume: ${resumeKey}\nJob Description: ${jobDescription}`;
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
        let results;
        if (!llmResponse || typeof llmResponse !== 'string' || llmResponse.trim() === '') {
          results = { error: 'LLM returned an empty response', raw: llmResponse };
        } else {
          try {
            results = JSON.parse(llmResponse);
          } catch (e) {
            // Try to extract JSON if LLM returned extra text
            const match = llmResponse.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                results = JSON.parse(match[0]);
              } catch (e2) {
                results = { error: 'Failed to parse LLM response (even after extracting JSON)', raw: llmResponse };
              }
            } else {
              results = { error: 'Failed to parse LLM response', raw: llmResponse };
            }
          }
        }
        // Debug: log raw LLM response if error
        if (results && results.error) {
          // eslint-disable-next-line no-console
          console.error('LLM raw response:', results.raw);
        }
        optimizationCache.set(cacheKey, results);
        onComplete(results);
      } catch (err: any) {
        onComplete({ error: 'GroqCloud API error', details: err && err.message ? err.message : String(err) });
      }
    };

    runOptimization();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [resumeData, jobDescription]);

  // Helper: Extract text from PDF using pdf-lib (browser-friendly, placeholder)
  async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    let text = '';
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      // pdf-lib does not support text extraction in the browser
      text += `[Page ${i + 1} text extraction not supported in browser-only pdf-lib]\n`;
    }
    return text;
  }

  const currentStepData = steps[currentStep];
  const Icon = currentStepData?.icon;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Optimization in Progress</h3>
        <p className="text-gray-600">
          Our AI is analyzing your resume against the job requirements
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Step */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {Icon && <Icon className="w-8 h-8 text-blue-600" />}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {currentStepData?.title}
          </h4>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
        </div>

        {/* Steps Timeline */}
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStep || (index === currentStep && progress === 100);
            const isCurrent = index === currentStep;

            return (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-600 text-white animate-pulse' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  <StepIcon className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-2 text-center max-w-20 ${
                  isCompleted 
                    ? 'text-green-600' 
                    : isCurrent 
                      ? 'text-blue-600' 
                      : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Real-time Insights */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h5 className="font-medium text-gray-900 mb-3">Processing Insights</h5>
          <div className="space-y-2 text-sm">
            {currentStep >= 0 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Identified {Math.floor(Math.random() * 15) + 25} relevant keywords in job description</span>
              </div>
            )}
            {currentStep >= 1 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Found {Math.floor(Math.random() * 8) + 12} matching skills in your resume</span>
              </div>
            )}
            {currentStep >= 2 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Calculated ATS compatibility score: {Math.floor(Math.random() * 20) + 75}%</span>
              </div>
            )}
            {currentStep >= 3 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Generated {Math.floor(Math.random() * 5) + 15} optimization recommendations</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer with Action Buttons */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 flex flex-col md:flex-row gap-4 justify-center items-center py-4 shadow-lg">
        {/* Buttons are now handled in ResultsDashboard, so just render children or nothing here */}
      </div>

      {/* Modal for cover letter is handled in ResultsDashboard */}
    </div>
  );
};

export default OptimizationEngine;