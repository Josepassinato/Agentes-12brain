import React, { useState, useEffect, useRef } from 'react';
import { AgentProfile, Message, ChatSessionConfig } from '../types';
import { GeminiService } from '../services/geminiService';
import MessageBubble from './MessageBubble';

interface PromptHelperModalProps {
  apiKey: string;
  alfredProfile: AgentProfile;
  onClose: () => void;
  onPromptGenerated: (prompt: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const PromptHelperModal: React.FC<PromptHelperModalProps> = ({ apiKey, alfredProfile, onClose, onPromptGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
  
  const geminiService = useRef<GeminiService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Gemini Service for Alfred
    if (apiKey) {
      geminiService.current = new GeminiService(apiKey);
      const config: ChatSessionConfig = {
        apiKey,
        channel: 'web',
        systemInstruction: alfredProfile.systemInstruction,
      };
      geminiService.current.initialize(config);
      setMessages([{
        id: 'alfred-welcome',
        role: 'model',
        content: `I'm Alfred. Tell me about the AI agent you want to build. What will be its name and primary purpose?`,
        timestamp: new Date(),
      }]);
    }
  }, [apiKey, alfredProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping || !geminiService.current) return;
    const newUserMsg: Message = { id: generateId(), role: 'user', content: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true);
    setFinalPrompt(null); // Clear previous final prompt

    try {
      const responseText = await geminiService.current.sendMessage(inputText);
      
      // Check if the response contains the final prompt in a markdown block
      const promptMatch = responseText.match(/```(markdown)?\n([\s\S]+?)```/);
      if (promptMatch && promptMatch[2]) {
        setFinalPrompt(promptMatch[2].trim());
      }

      setMessages(prev => [...prev, { id: generateId(), role: 'model', content: responseText, timestamp: new Date() }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: generateId(), role: 'model', content: `**Error:** ${error.message}`, timestamp: new Date(), isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleUsePrompt = () => {
    if (finalPrompt) {
      onPromptGenerated(finalPrompt);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-3">
            <span className="text-2xl">{alfredProfile.icon}</span> {alfredProfile.name}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
          {isTyping && <div className="text-xs text-slate-400 ml-4 animate-pulse">Alfred is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Final Prompt Action */}
        {finalPrompt && (
          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <p className="text-xs text-green-400 mb-2 text-center">Alfred has generated the System Instruction!</p>
            <button
              onClick={handleUsePrompt}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Use this Prompt
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:ring-2 focus-within:ring-purple-500">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Describe the agent you want to build..."
              disabled={isTyping}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 resize-none py-2 max-h-24 text-sm"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptHelperModal;