'use client';

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import IntroStep from '@/components/steps/IntroStep';
import StepOne from '@/components/steps/StepOne';
import StepTwo from '@/components/steps/StepTwo';
import StepThree from '@/components/steps/StepThree';
import StepFour from '@/components/steps/StepFour';

const API_URL = '/api/analyze';

export default function Ideafy() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [trendsMode, setTrendsMode] = useState('auto');
  const [trendsText, setTrendsText] = useState('');
  const [competitorsMode, setCompetitorsMode] = useState('auto');
  const [competitorsText, setCompetitorsText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamLog, setStreamLog] = useState<Array<any>>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') setFile(f);
  };

  const handleAnalyze = async () => {
    setCurrentStep(3);
    setStreaming(true);
    setStreamLog([]);
    setResults(null);
    setError(null);

    const trendsValue = trendsMode === 'auto' ? 'auto' : trendsText.trim() || 'auto';
    const competitorsValue = competitorsMode === 'auto' ? 'auto' : competitorsText.trim() || 'auto';

    const url = `${API_URL}?prompt=${encodeURIComponent(description)}&actions=${encodeURIComponent(trendsValue)}&actions=${encodeURIComponent(competitorsValue)}`;

    const formData = new FormData();
    if (file) formData.append('file', file);

    try {
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
      } catch (networkErr: any) {
        throw new Error(
          'Network/CORS error — request was blocked before reaching server. (' +
            networkErr.message +
            ')'
        );
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error('API error ' + response.status + ': ' + (body || response.statusText));
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      const collected: any = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            // Only show parsed messages, not the "sending to api" status messages
            if (parsed.step && parsed.step !== 'init' && parsed.step !== 'http') {
              setStreamLog((prev) => [...prev, parsed]);
            }
            if (parsed.step) {
              if (!collected[parsed.step]) collected[parsed.step] = [];
              collected[parsed.step].push(parsed.content);
            }
          } catch (parseErr) {
            // Silently ignore non-JSON lines
          }
        }
      }

      if (Object.keys(collected).length === 0 && streamLog.length > 0) {
        setResults({ _raw: streamLog.map((l) => l.content).join('\n') });
      } else {
        setResults(collected);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStreaming(false);
    }
  };

  const reset = () => {
    setCurrentStep(-1);
    setDescription('');
    setFile(null);
    setTrendsMode('auto');
    setTrendsText('');
    setCompetitorsMode('auto');
    setCompetitorsText('');
    setStreamLog([]);
    setResults(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header currentStep={currentStep} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {currentStep === -1 && (
          <IntroStep onStart={() => setCurrentStep(0)} />
        )}

        {currentStep === 0 && (
          <StepOne
            description={description}
            setDescription={setDescription}
            onNext={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 1 && (
          <StepTwo
            file={file}
            setFile={setFile}
            fileInputRef={fileInputRef}
            dropRef={dropRef}
            onDrop={handleDrop}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <StepThree
            trendsMode={trendsMode}
            setTrendsMode={setTrendsMode}
            trendsText={trendsText}
            setTrendsText={setTrendsText}
            competitorsMode={competitorsMode}
            setCompetitorsMode={setCompetitorsMode}
            competitorsText={competitorsText}
            setCompetitorsText={setCompetitorsText}
            onBack={() => setCurrentStep(1)}
            onAnalyze={handleAnalyze}
          />
        )}

        {currentStep === 3 && (
          <StepFour
            streaming={streaming}
            streamLog={streamLog}
            results={results}
            error={error}
            onReset={reset}
          />
        )}
      </div>
    </main>
  );
}
