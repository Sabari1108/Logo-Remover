import React from 'react';

interface LoaderProps {
  message: string;
  subMessage?: string;
  progress?: number;
}

const Loader: React.FC<LoaderProps> = ({ message, subMessage, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
      <p className="mt-6 text-lg font-semibold text-gray-300 max-w-md">{message}</p>
      {subMessage && <p className="mt-2 text-sm text-gray-400 max-w-md">{subMessage}</p>}
      {progress !== undefined && progress > 0 && (
        <div className="w-full max-w-md mt-4">
          <div className="bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-cyan-400 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-right text-sm text-gray-400 mt-1">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
};

export default Loader;
