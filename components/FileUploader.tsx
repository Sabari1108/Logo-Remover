
import React, { useCallback, useState } from 'react';
import { UploadCloudIcon } from './Icons';

interface FileUploaderProps {
  onFileChange: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && file.type.startsWith('video/')) {
      onFileChange(file);
    } else {
      alert('Please select a valid video file.');
    }
  }, [onFileChange]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-10 sm:p-16 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-800/60'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="video/*"
        onChange={handleInputChange}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
        <UploadCloudIcon className="w-16 h-16 text-gray-500 mb-4 transition-colors duration-300" />
        <span className="font-semibold text-lg text-gray-300">Drag & drop a video file here</span>
        <span className="text-gray-500 my-2">or</span>
        <span className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors">
          Browse Files
        </span>
      </label>
      <p className="mt-6 text-sm text-gray-500">Supports MP4, MOV, WebM, and more.</p>
    </div>
  );
};

export default FileUploader;
