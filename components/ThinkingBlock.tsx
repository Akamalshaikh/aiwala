import React, { useState } from 'react';

interface ThinkingBlockProps {
  content: string;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-2 transition-colors focus:outline-none"
      >
        <i className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'} text-xs`}></i>
        <span>Thought Process</span>
      </button>
      
      {isOpen && (
        <div className="bg-slate-800/50 border-l-2 border-indigo-500 rounded-r-lg p-3 text-slate-400 text-sm animate-fade-in font-mono whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
};