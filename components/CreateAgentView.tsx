import React, { useState } from 'react';
import { AgentProfile, AgentVoice, AVAILABLE_VOICES, DEFAULT_SYSTEM_INSTRUCTION } from '../types';
import { AgentService } from '../services/agentService';

interface CreateAgentViewProps {
  onAgentCreated: (newAgent: AgentProfile) => void;
  onBack: () => void;
}

const CreateAgentView: React.FC<CreateAgentViewProps> = ({ onAgentCreated, onBack }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [instructions, setInstructions] = useState(DEFAULT_SYSTEM_INSTRUCTION);
  const [voice, setVoice] = useState<AgentVoice>('Zephyr');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please provide a name for your agent.");
      return;
    }
    const { newAgent } = AgentService.createAgent(name, icon, instructions, voice);
    onAgentCreated(newAgent);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-800 p-4">
       <div className="w-full max-w-2xl">
            <button onClick={onBack} className="text-sm text-purple-300 hover:underline mb-4">
                &larr; Back to Dashboard
            </button>
            <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-2xl">
                <h1 className="text-3xl font-bold text-white text-center mb-2">Create a New Agent</h1>
                <p className="text-slate-400 text-center mb-8">Define its name, icon, and personality.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-end gap-4">
                         <div>
                            <label htmlFor="icon" className="block text-sm font-medium text-slate-300 mb-1">Icon</label>
                            <input
                                id="icon"
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-20 bg-slate-800 border border-slate-600 rounded-lg p-4 text-4xl text-center focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                maxLength={2}
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Agent Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Customer Support Bot"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                     <div>
                        <label htmlFor="voice" className="block text-sm font-medium text-slate-300 mb-1">Agent Voice</label>
                         <select
                            id="voice"
                            value={voice}
                            onChange={(e) => setVoice(e.target.value as AgentVoice)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                         >
                            {AVAILABLE_VOICES.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                         </select>
                     </div>
                    
                    <div>
                        <label htmlFor="instructions" className="block text-sm font-medium text-slate-300 mb-1">
                            Persona & Instructions
                        </label>
                        <textarea
                            id="instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full h-48 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none text-slate-200 resize-y"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
                    >
                        Create Agent & Start Chat
                    </button>
                </form>
            </div>
       </div>
    </div>
  );
};

export default CreateAgentView;