import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import ChannelSelector from './ChannelSelector';
import AdminPanel from './AdminPanel';
import VoiceInterface from './VoiceInterface';
import { GeminiService, GeminiLiveService, fileToBase64 } from '../services/geminiService';
import { KnowledgeBaseService } from '../services/knowledgeBase';
import { Message, ChatSessionConfig, AgentProfile, Attachment, VoiceState } from '../types';

interface ChatViewProps {
    apiKey: string;
    setApiKey: (key: string) => void;
    activeAgent: AgentProfile;
    onReturnToDashboard: () => void;
    onUpdateAgent: (agent: AgentProfile) => void;
    agents: AgentProfile[];
    onAgentChange: (id: string) => void;
    onNewAgent: () => void;
    onDeleteAgent: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const ChatView: React.FC<ChatViewProps> = ({ 
    apiKey, setApiKey, activeAgent, onReturnToDashboard, onUpdateAgent,
    agents, onAgentChange, onNewAgent, onDeleteAgent
}) => {
  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat');
  const [channel, setChannel] = useState<'whatsapp' | 'instagram' | 'facebook' | 'web'>('web');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isActive: false, isSpeaking: false, isListening: false, volumeLevel: 0
  });

  const geminiService = useRef<GeminiService | null>(null);
  const geminiLiveService = useRef<GeminiLiveService | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome', role: 'model',
        content: `I am **${activeAgent.name}**. How can I assist you today?`,
        timestamp: new Date()
      }
    ]);
  }, [activeAgent]);

  useEffect(() => {
    resetChat();
  }, [activeAgent, resetChat]);

  useEffect(() => {
    if (currentView === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, currentView]);

  useEffect(() => {
    if (apiKey && activeAgent) {
      try {
        geminiService.current = new GeminiService(apiKey);
        const kbContext = KnowledgeBaseService.buildContextString(activeAgent.id);
        const config: ChatSessionConfig = {
          apiKey,
          channel,
          systemInstruction: activeAgent.systemInstruction,
        };
        geminiService.current.initialize(config, kbContext);
      } catch (e) { console.error("Failed to init Gemini", e); }
    } else {
        geminiService.current = null;
    }
  }, [apiKey, activeAgent, channel, currentView]);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isTyping || !geminiService.current) return;
    const newUserMsg: Message = { id: generateId(), role: 'user', content: inputText, timestamp: new Date(), attachments: [...attachments] };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText(''); setAttachments([]); setIsTyping(true);

    try {
      const responseText = await geminiService.current.sendMessage(newUserMsg.content, newUserMsg.attachments);
      setMessages(prev => [...prev, { id: generateId(), role: 'model', content: responseText, timestamp: new Date() }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: generateId(), role: 'model', content: `**Error:** ${error.message}`, timestamp: new Date(), isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setAttachments(prev => [...prev, { name: file.name, mimeType: file.type, data: base64 }]);
      } catch (err) { alert("Failed to upload file"); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleVoiceMode = async () => {
    if (!apiKey) return alert("API Key is required for voice mode.");

    if (voiceState.isActive) {
      geminiLiveService.current?.stop();
      geminiLiveService.current = null;
      setVoiceState({ isActive: false, isSpeaking: false, isListening: false, volumeLevel: 0 });
    } else {
      try {
        setVoiceState(prev => ({ ...prev, isActive: true, isListening: true }));
        geminiLiveService.current = new GeminiLiveService(apiKey, (status) => {
          setVoiceState(prev => ({ ...prev, isActive: true, isSpeaking: status.isSpeaking, volumeLevel: status.volume }));
        });
        
        const config: ChatSessionConfig = { apiKey, channel, systemInstruction: activeAgent.systemInstruction };
        const kbContext = KnowledgeBaseService.buildContextString(activeAgent.id);
        await geminiLiveService.current.startSession(config, kbContext, activeAgent.voice);

      } catch (e: any) {
        setVoiceState({ isActive: false, isSpeaking: false, isListening: false, volumeLevel: 0 });
        alert(`Could not start voice session. ${e.message}`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-800 overflow-hidden relative">
      {voiceState.isActive && (
        <VoiceInterface voiceState={voiceState} onClose={toggleVoiceMode} agentName={activeAgent.name}/>
      )}

      <Sidebar 
        agents={agents}
        activeAgent={activeAgent}
        onAgentChange={onAgentChange}
        onNewAgent={onNewAgent}
        onUpdateAgent={onUpdateAgent}
        onReturnToDashboard={onReturnToDashboard}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenChat={() => setCurrentView('chat')}
        currentView={currentView}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onDeleteAgent={onDeleteAgent}
      />

      <main className="flex-1 flex flex-col h-full relative w-full bg-slate-800">
        <header className="bg-slate-900 border-b border-slate-700 p-4 pl-16 lg:pl-6 flex justify-between items-center shadow-lg z-10 h-16 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeAgent.icon}</span>
            <div className="text-left">
                <h2 className="font-bold text-white text-lg leading-tight">{activeAgent.name}</h2>
                <p className="text-[10px] sm:text-xs text-slate-400">Channel: <span className="capitalize font-semibold text-purple-300">{channel}</span></p>
            </div>
          </div>
        </header>

        {currentView === 'admin' ? (
          <AdminPanel apiKey={apiKey} activeAgent={activeAgent} onClose={() => setCurrentView('chat')} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 scrollbar-hide">
              <ChannelSelector currentChannel={channel} onChannelChange={setChannel} />
              {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
              {isTyping && <div className="text-xs text-slate-400 ml-4 animate-pulse">Agent is typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 p-3 sm:p-4 shrink-0">
              <div className="max-w-4xl mx-auto">
                {attachments.length > 0 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-xs truncate flex-shrink-0 border border-slate-600">{att.name}</div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:ring-2 focus-within:ring-purple-500 transition-shadow">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-slate-700 transition-colors"><span className="text-xl">📎</span></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder={`Message ${activeAgent.name || 'your agent'}...`}
                    disabled={!apiKey}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 resize-none py-3 max-h-32 text-sm placeholder:text-slate-500"
                    rows={1}
                    style={{ minHeight: '44px' }}
                  />
                  
                  <button 
                    onClick={toggleVoiceMode}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0"
                    title="Start Voice Call"
                  >
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                     </svg>
                  </button>

                  <button 
                    onClick={handleSendMessage}
                    disabled={(!inputText.trim() && attachments.length === 0) || !apiKey}
                    className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ChatView;