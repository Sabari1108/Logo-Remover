import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import FrameSelector from './components/FrameSelector';
import ResultDisplay from './components/ResultDisplay';
import Loader from './components/Loader';
import { removeObjectFromFrame, generateVideoFromFrame } from './services/geminiService';
import type { Selection } from './types';
import { extractFrame } from './utils/video';

type AppState = 'idle' | 'video_loaded' | 'processing' | 'generating_video' | 'complete' | 'video_complete' | 'error';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      } else {
        // If aistudio is not available (e.g. running in a different environment),
        // assume a key is present to allow functionality.
        setIsApiKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  // Effect for simulating progress during image processing
  useEffect(() => {
    // FIX: Use `ReturnType<typeof setTimeout>` which correctly infers the timeout ID type in browser environments (number) instead of `NodeJS.Timeout`.
    let timers: ReturnType<typeof setTimeout>[] = [];
    if (appState === 'processing') {
      setProgress(0);
      // Simulate a realistic loading curve
      timers.push(setTimeout(() => setProgress(15), 200));
      timers.push(setTimeout(() => setProgress(40), 800));
      timers.push(setTimeout(() => setProgress(75), 2000));
      timers.push(setTimeout(() => setProgress(90), 4000));
      // Hold at 90% until it completes
    } else {
      setProgress(0);
    }
    return () => timers.forEach(clearTimeout);
  }, [appState]);


  const handleChangeApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsApiKeySelected(hasKey);
      // If a quota error was previously shown, and now they have a key,
      // clear the error state and go back to allow a retry.
      if (hasKey && isQuotaError) {
        setIsQuotaError(false);
        setError(null);
        if (processedImageSrc) {
            setAppState('complete');
        } else if (frameSrc) {
            setAppState('video_loaded');
        }
      }
    }
  }, [isQuotaError, processedImageSrc, frameSrc]);

  const handleFileSelect = useCallback(async (file: File) => {
    setVideoFile(file);
    setAppState('processing');
    setError(null);
    setIsQuotaError(false);
    try {
      const videoUrl = URL.createObjectURL(file);
      const frameDataUrl = await extractFrame(videoUrl);
      setFrameSrc(frameDataUrl);
      setAppState('video_loaded');
    } catch (e) {
      console.error(e);
      setError('Failed to load video or extract frame. Please try another file.');
      setAppState('error');
    }
  }, []);

  const handleRemoveLogo = useCallback(async () => {
    if (!frameSrc || !selection) return;
    setAppState('processing');
    setError(null);
    setIsQuotaError(false);
    try {
      const base64Image = frameSrc.split(',')[1];
      const resultBase64 = await removeObjectFromFrame(base64Image, selection);
      setProgress(100); // Finalize progress on success
      setProcessedImageSrc(`data:image/png;base64,${resultBase64}`);
      setAppState('complete');
    } catch (e: any) {
      console.error(e);
      setProgress(0); // Reset on error
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      if (errorMessage.includes('API quota')) {
          setIsQuotaError(true);
      }
      setError(errorMessage);
      setAppState('error');
    }
  }, [frameSrc, selection]);

  const handleGenerateVideo = useCallback(async () => {
    if (!processedImageSrc) return;
    setAppState('generating_video');
    setError(null);
    setIsQuotaError(false);
    try {
      const base64Image = processedImageSrc.split(',')[1];
      const videoUrl = await generateVideoFromFrame(base64Image);
      setProcessedVideoUrl(videoUrl);
      setAppState('video_complete');
    } catch (e: any) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      if (errorMessage.includes('API quota') || errorMessage.includes('API key not found')) {
          setIsQuotaError(true);
      }
       if (errorMessage.includes('API key not found')) {
            setIsApiKeySelected(false);
       }
      setError(errorMessage);
      setAppState('error');
    }
  }, [processedImageSrc]);

  const handleReset = useCallback(() => {
    setAppState('idle');
    setVideoFile(null);
    setFrameSrc(null);
    setSelection(null);
    setProcessedImageSrc(null);
    setProcessedVideoUrl(null);
    setError(null);
    setIsQuotaError(false);
    setProgress(0);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case 'idle':
        return <FileUploader onFileChange={handleFileSelect} />;
      case 'video_loaded':
        return frameSrc ? <FrameSelector frameSrc={frameSrc} selection={selection} onSelect={setSelection} onProcess={handleRemoveLogo} /> : null;
      case 'processing':
        return <Loader message="Analyzing image and removing object with AI..." progress={progress} />;
      case 'generating_video':
        return <Loader message="Generating video from your edited frame..." subMessage="This can take a few minutes. Please don't close this window."/>;
      case 'complete':
        return (frameSrc && processedImageSrc) ? 
          <ResultDisplay 
            originalSrc={frameSrc} 
            processedImageSrc={processedImageSrc} 
            onReset={handleReset} 
            onGenerateVideo={handleGenerateVideo}
            isApiKeySelected={isApiKeySelected}
            onSelectApiKey={handleChangeApiKey}
          /> : null;
      case 'video_complete':
        return (frameSrc && processedImageSrc && processedVideoUrl) ? 
          <ResultDisplay 
            originalSrc={frameSrc} 
            processedImageSrc={processedImageSrc} 
            processedVideoUrl={processedVideoUrl}
            onReset={handleReset} 
            onGenerateVideo={handleGenerateVideo}
            isApiKeySelected={isApiKeySelected}
            onSelectApiKey={handleChangeApiKey}
          /> : null;
      case 'error':
        if (isQuotaError) {
            return (
                <div className="text-center p-8 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-3">API Quota Exceeded</h2>
                    <p className="text-yellow-300 mb-4">Your current API key has run out of its available usage quota.</p>
                    <div className="mt-4 text-left space-y-4 max-w-md mx-auto">
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                            <p className="text-gray-300 text-center">
                                You can monitor your usage and see when quotas reset on the official dashboard.
                            </p>
                            <a
                                href="https://ai.dev/usage"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center mt-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                View Usage Dashboard
                            </a>
                        </div>
                        <div>
                            <p className="text-yellow-300 mb-2 text-center">To continue immediately, please select a different API key.</p>
                            <button
                                onClick={handleChangeApiKey}
                                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Select API Key
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="mt-6 text-sm text-gray-400 hover:text-white underline"
                    >
                        or Start Over
                    </button>
                </div>
            )
        }
        // Default error case for non-quota errors
        return (
          <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-2">An Error Occurred</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col p-4 sm:p-8">
      <div className="max-w-4xl w-full mx-auto">
        <Header isApiKeySelected={isApiKeySelected} onChangeApiKey={handleChangeApiKey} />
        <main className="mt-8 sm:mt-12">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;