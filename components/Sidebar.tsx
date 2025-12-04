import React, { useState } from 'react';
import { AgentProfile, AVAILABLE_VOICES, AgentVoice } from '../types';

interface SidebarProps {
  agents: AgentProfile[];
  activeAgent: AgentProfile; // Now it's never null here
  onAgentChange: (agentId: string) => void;
  onNewAgent: () => void;
  onUpdateAgent: (updatedAgent: AgentProfile) => void;
  onReturnToDashboard: () => void;
  onOpenAdmin: () => void;
  onOpenChat: () => void;
  currentView: 'chat' | 'admin';
  apiKey: string;
  setApiKey: (key: string) => void;
  onDeleteAgent: (agentId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  agents, activeAgent, onAgentChange, onNewAgent, onUpdateAgent, 
  onReturnToDashboard, onOpenAdmin, onOpenChat, currentView, 
  apiKey, setApiKey, onDeleteAgent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateAgent({ ...activeAgent, systemInstruction: e.target.value });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateAgent({ ...activeAgent, name: e.target.value });
  }

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateAgent({ ...activeAgent, icon: e.target.value });
  }
  
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateAgent({ ...activeAgent, voice: e.target.value as AgentVoice });
  };


  return (
    <>
      <button 
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-slate-700/80 backdrop-blur border border-slate-600 rounded-lg shadow-sm active:scale-95 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs sm:w-80 bg-slate-900 text-slate-200 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col h-full
      `}>
        <div className="p-5 border-b border-slate-800 mt-12 lg:mt-0">
          <button onClick={onReturnToDashboard} className="text-sm text-purple-300 hover:underline mb-2">
            &larr; Back to Dashboard
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <span className="text-2xl">🧠</span> 12 Brain Agentes
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          <div className="space-y-2">
             <button 
              onClick={() => { onOpenChat(); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${currentView === 'chat' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span>💬</span> Agent Chat
            </button>
             <button 
              onClick={() => { onOpenAdmin(); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${currentView === 'admin' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span>⚙️</span> Knowledge Base
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Agent Configuration</h3>
            <div className="space-y-4">
               <div>
                 <label className="block text-xs mb-1 text-slate-300">Switch Agent</label>
                 <div className="flex gap-2">
                    <select
                        value={activeAgent?.id || ''}
                        onChange={(e) => onAgentChange(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.icon} {agent.name}</option>
                        ))}
                    </select>
                    <button onClick={onNewAgent} className="px-3 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold text-lg" title="Create New Agent">+</button>
                 </div>
              </div>
              
              <div className='flex gap-2'>
                 <div className="flex-1">
                    <label className="block text-xs mb-1 text-slate-300">Agent Name</label>
                    <input
                      type="text"
                      value={activeAgent.name}
                      onChange={handleNameChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                      disabled={activeAgent.isPreconfigured}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-slate-300">Icon</label>
                    <input
                      type="text"
                      value={activeAgent.icon}
                      onChange={handleIconChange}
                      className="w-12 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-center text-white focus:ring-2 focus:ring-purple-500 outline-none"
                      maxLength={2}
                      disabled={activeAgent.isPreconfigured}
                    />
                  </div>
              </div>

               <div>
                 <label className="block text-xs mb-1 text-slate-300">Agent Voice</label>
                 <select
                    value={activeAgent.voice}
                    onChange={handleVoiceChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                 >
                    {AVAILABLE_VOICES.map(voice => (
                      <option key={voice} value={voice}>{voice}</option>
                    ))}
                 </select>
               </div>

              <div>
                <label className="block text-xs mb-1 text-slate-300">Agent Persona & Instructions</label>
                <textarea 
                  value={activeAgent.systemInstruction}
                  onChange={handleInstructionChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 h-40 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>
              
               <div>
                 <label className="block text-xs mb-1 text-slate-300">API Key</label>
                 <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Gemini API Key"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none placeholder-slate-500"
                 />
              </div>

               {!activeAgent.isPreconfigured && (
                <div>
                  <button
                    onClick={() => onDeleteAgent(activeAgent.id)}
                    className="w-full text-left text-sm text-red-400 hover:text-red-300 hover:underline p-2 rounded"
                  >
                    Delete this Agent
                  </button>
                </div>
               )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;