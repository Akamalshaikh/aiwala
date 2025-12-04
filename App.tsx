import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Note: In a real environment without npm, you'd use a utility function. Assuming standard build.
import { Message, ChatSession, AVAILABLE_MODELS } from './types';
import { sendMessageToApi } from './services/chatService';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';

// Simple UUID generator fallback if package not available
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const App: React.FC = () => {
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState(AVAILABLE_MODELS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop default open
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('shaikhs_ai_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
           // Optional: Auto-load last session
           // setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('shaikhs_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSessionId, sessions, isLoading]);

  // Derived state
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Actions
  const createNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      lastModified: Date.now(),
      model: currentModel
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false); // On mobile effectively
    if (window.innerWidth >= 768) setIsSidebarOpen(true); // Keep open on desktop
    return newSession.id;
  }, [currentModel]);

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const updateSessionTitle = (id: string, firstMessage: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          title: firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage,
          lastModified: Date.now()
        };
      }
      return s;
    }));
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = createNewChat();
    }

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    // Update state immediately
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMsg], lastModified: Date.now() };
      }
      return s;
    }));

    // If it's the first message, update title
    const session = sessions.find(s => s.id === activeSessionId);
    if (session && session.messages.length === 0) {
      updateSessionTitle(activeSessionId, input);
    } else if (!session) { // Newly created in this scope
      updateSessionTitle(activeSessionId, input);
    }

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const responseText = await sendMessageToApi(userMsg.content, currentModel);
      
      const aiMsg: Message = {
        id: generateId(),
        role: 'ai',
        content: responseText,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, aiMsg], lastModified: Date.now() };
        }
        return s;
      }));

    } catch (error: any) {
      const errorMsg: Message = {
        id: generateId(),
        role: 'ai',
        content: error.message || "Something went wrong.",
        timestamp: Date.now(),
        isError: true
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, errorMsg] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19] text-slate-200 font-inter">
      
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewChat}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 transition-all duration-300">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-800 bg-[#0b0f19]/90 backdrop-blur-md z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <i className="fa-solid fa-bars text-lg"></i>
            </button>
            <h1 className="hidden sm:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Shaikh's AI
            </h1>
            
            {/* Model Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full text-xs sm:text-sm text-slate-300 transition-all"
              >
                <i className="fa-solid fa-microchip text-indigo-400"></i>
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{currentModel}</span>
                <i className="fa-solid fa-chevron-down text-[10px] opacity-60"></i>
              </button>

              {isModelDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsModelDropdownOpen(false)}
                  ></div>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-[#111827] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in">
                    {AVAILABLE_MODELS.map(model => (
                      <button
                        key={model}
                        onClick={() => { setCurrentModel(model); setIsModelDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                          currentModel === model ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-400'
                        }`}
                      >
                         <i className={`fa-solid fa-circle text-[6px] ${currentModel === model ? 'opacity-100' : 'opacity-0'}`}></i>
                        {model}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <button className="text-slate-500 hover:text-indigo-400 transition-colors">
            <i className="fa-solid fa-gear"></i>
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 scroll-smooth custom-scrollbar relative">
          
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center pb-20 animate-fade-in px-4">
               <div className="w-20 h-20 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/10 border border-slate-800">
                  <i className="fa-solid fa-wand-magic-sparkles text-3xl text-indigo-400"></i>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3 text-center">How can I help you?</h2>
               <p className="text-slate-500 max-w-md text-center mb-8">
                 Experience advanced AI with multi-model support. Select a model and start building.
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                 <button 
                   onClick={() => setInput("Write a Python script to scrape a website")}
                   className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/30 transition-all group text-left"
                 >
                   <div className="text-indigo-400 mb-2"><i className="fa-brands fa-python"></i></div>
                   <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300">Python Scraper</div>
                   <div className="text-xs text-slate-500 mt-1">Extract data from web</div>
                 </button>
                 <button 
                   onClick={() => setInput("Explain quantum computing simply")}
                   className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800 hover:border-purple-500/30 transition-all group text-left"
                 >
                   <div className="text-purple-400 mb-2"><i className="fa-solid fa-brain"></i></div>
                   <div className="text-sm font-semibold text-slate-200 group-hover:text-purple-300">Learn Concepts</div>
                   <div className="text-xs text-slate-500 mt-1">Explain like I'm 5</div>
                 </button>
               </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-4 animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <i className="fa-solid fa-robot text-xs text-white"></i>
                  </div>
                  <div className="bg-slate-800/50 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700/50">
                    <div className="flex items-center gap-1.5 h-4">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-24"></div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19] to-transparent pt-12">
          <div className="max-w-3xl mx-auto relative bg-[#1e293b]/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustTextareaHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder="Message Shaikh's AI..."
              rows={1}
              className="w-full bg-transparent text-slate-200 placeholder-slate-500 px-4 py-3.5 focus:outline-none resize-none max-h-48 custom-scrollbar"
            />
            
            <div className="flex items-center justify-between px-2 pb-2 mt-1">
               <div className="flex items-center gap-1">
                 <button className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-colors" title="Attach">
                   <i className="fa-solid fa-paperclip text-sm"></i>
                 </button>
                 <button className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-colors" title="Voice">
                   <i className="fa-solid fa-microphone text-sm"></i>
                 </button>
               </div>
               
               <button 
                 onClick={handleSendMessage}
                 disabled={!input.trim() || isLoading}
                 className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
               >
                 Send <i className="fa-solid fa-paper-plane text-xs"></i>
               </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
        
      </main>
    </div>
  );
};

export default App;