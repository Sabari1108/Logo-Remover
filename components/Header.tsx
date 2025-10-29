import React from 'react';
import { LayersIcon, KeyIcon } from './Icons';

interface HeaderProps {
  isApiKeySelected: boolean | null;
  onChangeApiKey: () => void;
}

const Header: React.FC<HeaderProps> = ({ isApiKeySelected, onChangeApiKey }) => {
  return (
    <header className="relative text-center py-4">
      <div className="flex items-center justify-center gap-4 mb-4">
        <LayersIcon className="w-12 h-12 text-cyan-400" />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
          Logo Remover AI
        </h1>
      </div>
      <p className="max-w-2xl mx-auto text-lg text-gray-400">
        Upload a video, select a logo on the first frame, and let our AI remove it seamlessly.
      </p>
      <button
        onClick={onChangeApiKey}
        className="absolute top-0 right-0 p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
        aria-label="Change API Key"
        title={isApiKeySelected ? "Change API Key" : "Select API Key"}
      >
        <KeyIcon className={`w-6 h-6 transition-colors ${isApiKeySelected ? 'text-green-400' : 'text-yellow-400'}`} />
      </button>
    </header>
  );
};

export default Header;
