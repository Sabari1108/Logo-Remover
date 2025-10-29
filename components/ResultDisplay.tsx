import React, { useState } from 'react';
import { RefreshCwIcon } from './Icons';

interface ResultDisplayProps {
  originalSrc: string;
  processedImageSrc: string;
  processedVideoUrl?: string | null;
  onReset: () => void;
  onGenerateVideo: () => void;
  isApiKeySelected: boolean | null;
  onSelectApiKey: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  originalSrc, 
  processedImageSrc, 
  processedVideoUrl, 
  onReset,
  onGenerateVideo,
  isApiKeySelected,
  onSelectApiKey,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = processedImageSrc;
    link.download = 'processed_frame.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadVideo = () => {
    if (!processedVideoUrl) return;
    const link = document.createElement('a');
    link.href = processedVideoUrl;
    link.download = 'generated_video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMedia = () => {
    if (processedVideoUrl) {
      return (
        <video 
          src={processedVideoUrl}
          controls 
          autoPlay 
          loop 
          muted
          className="max-w-full max-h-[60vh] object-contain"
          aria-label="Generated video"
        />
      );
    }
    return (
      <>
        <img
          src={showOriginal ? originalSrc : processedImageSrc}
          alt={showOriginal ? 'Original Frame' : 'Processed Frame'}
          className="max-w-full max-h-[60vh] object-contain transition-opacity duration-300"
        />
        <div className="absolute top-2 right-2 flex items-center bg-gray-900/70 p-2 rounded-lg">
          <span className="text-sm mr-2">{showOriginal ? 'Original' : 'Processed'}</span>
          <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded-md text-sm font-semibold"
            aria-label="Hold to compare with original image"
          >
            Hold to Compare
          </button>
        </div>
      </>
    );
  };
  
  const renderActions = () => {
    if (processedVideoUrl) {
      return (
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={handleDownloadVideo}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Download Video
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            <RefreshCwIcon className="w-5 h-5" />
            Start Over
          </button>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-center">
        <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg w-full max-w-lg text-center">
            <h3 className="text-xl font-semibold mb-3">Next Step: Create a Video</h3>
            <p className="text-gray-400 mb-4">
              Use the edited frame to generate a short, animated video clip with AI.
            </p>
            {isApiKeySelected === false && (
                <div className="mb-4 text-sm text-yellow-300 bg-yellow-900/30 p-3 rounded-md border border-yellow-700">
                    Video generation requires an API key from a project with billing enabled. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">Learn more</a>.
                </div>
            )}
            {isApiKeySelected ? (
                <button 
                  onClick={onGenerateVideo}
                  className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-lg rounded-lg shadow-md transition-all duration-300"
                >
                  Generate Video
                </button>
            ) : (
                <button 
                  onClick={onSelectApiKey}
                  disabled={isApiKeySelected === null}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-md transition-all duration-300 disabled:bg-gray-600 disabled:cursor-wait"
                >
                  {isApiKeySelected === null ? 'Checking Key...' : 'Select API Key to Generate Video'}
                </button>
            )}
        </div>
        <div className="flex flex-wrap gap-4 mt-8 border-t border-gray-700 pt-6 w-full max-w-lg justify-center">
          <button
            onClick={handleDownloadImage}
            className="px-6 py-2 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-lg transition-colors"
          >
            Download Image
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            <RefreshCwIcon className="w-5 h-5" />
            Start Over
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-green-400 to-cyan-500 text-transparent bg-clip-text">
        {processedVideoUrl ? 'Video Generated!' : 'Processing Complete!'}
      </h2>
      <div className="relative rounded-lg overflow-hidden shadow-2xl max-w-full">
        {renderMedia()}
      </div>
      {renderActions()}
    </div>
  );
};

export default ResultDisplay;