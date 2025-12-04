import React, { useMemo } from 'react';
import { Message } from '../types';
import { ThinkingBlock } from './ThinkingBlock';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const processedContent = useMemo(() => {
    if (isUser) return null;

    // Split content by <think> tags
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = thinkRegex.exec(message.content)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: message.content.substring(lastIndex, match.index) });
      }
      // The match (thought)
      parts.push({ type: 'think', content: match[1] });
      lastIndex = match.index + match[0].length;
    }
    // Remaining text
    if (lastIndex < message.content.length) {
      parts.push({ type: 'text', content: message.content.substring(lastIndex) });
    }

    // Escape hatch for escaped tags if the API returns them
    if (parts.length === 0 && message.content.includes('\\u003Cthink\\u003E')) {
       // Simple fallback for encoded tags if complex parsing isn't needed
       const decoded = message.content
        .replace(/\\u003Cthink\\u003E/g, '<think>')
        .replace(/\\u003C\/think\\u003E/g, '</think>');
       return [{ type: 'text', content: decoded }]; // Let standard parser re-try or just render text
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: message.content }];
  }, [message.content, isUser]);

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
      {/* Avatar AI */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 mt-1">
          <i className="fa-solid fa-robot text-xs text-white"></i>
        </div>
      )}

      {/* Message Content */}
      <div 
        className={`relative max-w-[90%] md:max-w-[80%] px-5 py-3.5 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-slate-700 text-slate-100 rounded-tr-sm border border-slate-600' 
            : 'bg-transparent text-slate-200 rounded-tl-sm w-full'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</div>
        ) : (
          <div className="text-sm leading-relaxed w-full">
            {processedContent?.map((part, index) => {
              if (part.type === 'think') {
                return <ThinkingBlock key={index} content={part.content} />;
              }
              // Render Markdown
              const rawMarkup = window.marked ? window.marked.parse(part.content) : part.content;
              return (
                <div 
                  key={index} 
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: rawMarkup }} 
                />
              );
            })}
          </div>
        )}
        
        {/* Timestamp/Status */}
        <div className={`text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 ${isUser ? 'right-0 text-slate-500' : 'left-0 text-slate-600'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Avatar User */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-600 mt-1">
          <i className="fa-solid fa-user text-xs text-slate-400"></i>
        </div>
      )}
    </div>
  );
};