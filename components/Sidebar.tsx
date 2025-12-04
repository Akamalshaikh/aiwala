import React, { useState } from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat, 
  onDeleteSession,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.lastModified - a.lastModified);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-80 bg-[#05080f] border-r border-gray-800 flex flex-col 
        transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 flex flex-col gap-4 relative">
          <div className="flex items-center justify-between md:hidden">
            <span className="font-bold text-lg text-slate-200">Menu</span>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          
          {/* Desktop Close Button */}
          <button 
            onClick={onClose} 
            className="hidden md:flex absolute right-4 top-4 p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-all z-10 items-center justify-center w-8 h-8"
            title="Collapse Sidebar"
          >
             <i className="fa-solid fa-angles-left"></i>
          </button>

          <button 
            onClick={() => { onNewChat(); if (window.innerWidth < 768) onClose(); }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/20 font-semibold group border border-indigo-500/50 mt-2 md:mt-1 hover:shadow-indigo-600/20"
          >
            <i className="fa-solid fa-plus transition-transform group-hover:rotate-90"></i> 
            New Chat
          </button>

          <div className="relative group">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-500 text-xs transition-colors group-focus-within:text-indigo-400"></i>
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 text-sm text-slate-300 rounded-xl py-2.5 pl-10 pr-4 border border-gray-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 px-6 opacity-60">
              <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                 <i className="fa-regular fa-comment-dots text-slate-600"></i>
              </div>
              <p className="text-slate-500 text-xs font-medium">No chat history yet.</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Recent Chats</div>
              {filteredSessions.map(session => (
                <div 
                  key={session.id}
                  className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                    currentSessionId === session.id 
                      ? 'bg-slate-800/80 border-slate-700/50 text-indigo-300 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                  }`}
                  onClick={() => { onSelectSession(session.id); if (window.innerWidth < 768) onClose(); }}
                >
                  <i className={`fa-regular fa-message text-xs ${currentSessionId === session.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-500'} flex-shrink-0`}></i>
                  <span className="text-sm truncate pr-6 flex-1 font-medium">{session.title}</span>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => onDeleteSession(e, session.id)}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-md text-slate-600 transition-all"
                    title="Delete chat"
                  >
                    <i className="fa-solid fa-trash text-[10px]"></i>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-gray-800/50 bg-[#05080f]">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all">
              SA
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">User Account</span>
              <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 transition-colors">Free Plan</span>
            </div>
            <i className="fa-solid fa-gear ml-auto text-slate-600 group-hover:text-slate-400"></i>
          </button>
        </div>
      </aside>
    </>
  );
};