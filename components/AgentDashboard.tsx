import React from 'react';
import { AgentProfile } from '../types';

interface AgentDashboardProps {
  agents: AgentProfile[];
  onSelectAgent: (agent: AgentProfile) => void;
  onNavigateToCreate: () => void;
  onDeleteAgent: (agentId: string) => void;
}

const AgentCard: React.FC<{ agent: AgentProfile, onSelect: () => void, onDelete: () => void }> = ({ agent, onSelect, onDelete }) => (
    <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col p-6 shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/50 transition-all duration-300">
        <div className="flex-1">
            <div className="text-4xl mb-4">{agent.icon}</div>
            <h3 className="text-white font-bold text-lg">{agent.name}</h3>
            <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                {agent.systemInstruction.split('\n')[0]}
            </p>
        </div>
        <div className="mt-6 flex gap-2">
            <button
                onClick={onSelect}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
                Start Chat
            </button>
            {!agent.isPreconfigured && (
                 <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors" title="Delete Agent">
                   🗑️
                 </button>
            )}
        </div>
    </div>
);


const AgentDashboard: React.FC<AgentDashboardProps> = ({ agents, onSelectAgent, onNavigateToCreate, onDeleteAgent }) => {
  const preconfiguredAgents = agents.filter(a => a.isPreconfigured);
  const customAgents = agents.filter(a => !a.isPreconfigured);

  return (
    <div className="h-full w-full bg-slate-800 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white flex items-center justify-center gap-4">
            <span className="text-5xl">🧠</span> 12 Brain Agentes
          </h1>
          <p className="mt-3 text-lg text-slate-300">Choose a pre-built agent or create your own.</p>
        </header>

        <main>
          {/* Custom Agents Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">My Custom Agents</h2>
                <button
                    onClick={onNavigateToCreate}
                    className="bg-purple-600 text-white py-2 px-5 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md text-sm"
                >
                    + Create New Agent
                </button>
            </div>
            {customAgents.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {customAgents.map(agent => (
                        <AgentCard 
                            key={agent.id} 
                            agent={agent} 
                            onSelect={() => onSelectAgent(agent)} 
                            onDelete={() => onDeleteAgent(agent.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl">
                    <p className="text-slate-400">You haven't created any custom agents yet.</p>
                    <button onClick={onNavigateToCreate} className="mt-4 text-purple-400 font-semibold hover:underline">
                        Create your first agent
                    </button>
                </div>
            )}
          </div>

          {/* Pre-configured Templates */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Florida Business Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {preconfiguredAgents.map(agent => (
                 <AgentCard key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent)} onDelete={() => {}} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;