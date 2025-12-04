import React, { useState, useEffect, useCallback } from 'react';
import AgentDashboard from './components/AgentDashboard';
import CreateAgentView from './components/CreateAgentView';
import ChatView from './components/ChatView';
import { AgentService } from './services/agentService';
import { AgentProfile } from './types';

type AppView = 'dashboard' | 'createAgent' | 'chat';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  const loadAgents = useCallback(() => {
    const loadedAgents = AgentService.getAgents();
    setAgents(loadedAgents);
    // Check for a previously active agent to potentially restore session
    const activeId = AgentService.getActiveAgentId();
    if (activeId) {
        const agentToActivate = loadedAgents.find(a => a.id === activeId);
        if (agentToActivate) {
            setActiveAgent(agentToActivate);
            setCurrentView('chat'); // Go directly to chat if an agent was active
        }
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleSelectAgent = (agent: AgentProfile) => {
    setActiveAgent(agent);
    AgentService.setActiveAgentId(agent.id);
    setCurrentView('chat');
  };

  const handleNavigateToCreate = () => {
    setActiveAgent(null);
    AgentService.setActiveAgentId(null);
    setCurrentView('createAgent');
  };

  const handleAgentCreated = (newAgent: AgentProfile) => {
    const updatedAgents = AgentService.getAgents(); // Re-fetch to include the new one
    setAgents(updatedAgents);
    handleSelectAgent(newAgent); // Automatically select the new agent and go to chat
  };
  
  const handleUpdateAgent = (updatedAgent: AgentProfile) => {
      setActiveAgent(updatedAgent);
      const updatedAgents = AgentService.saveAgent(updatedAgent);
      setAgents(updatedAgents);
  }

  const handleDeleteAgent = (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent and all its knowledge? This cannot be undone.')) {
        const updatedAgents = AgentService.deleteAgent(agentId);
        setAgents(updatedAgents);
        if(activeAgent?.id === agentId) {
            handleReturnToDashboard();
        }
    }
  }

  const handleReturnToDashboard = () => {
    setActiveAgent(null);
    AgentService.setActiveAgentId(null);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'createAgent':
        return (
          <CreateAgentView
            onAgentCreated={handleAgentCreated}
            onBack={handleReturnToDashboard}
          />
        );
      case 'chat':
        return activeAgent ? (
          <ChatView
            apiKey={apiKey}
            setApiKey={setApiKey}
            activeAgent={activeAgent}
            onReturnToDashboard={handleReturnToDashboard}
            onUpdateAgent={handleUpdateAgent}
            agents={agents}
            onAgentChange={(id) => {
                const newAgent = agents.find(a => a.id === id);
                if (newAgent) handleSelectAgent(newAgent);
            }}
            onNewAgent={handleNavigateToCreate}
            onDeleteAgent={handleDeleteAgent}
          />
        ) : null;
      case 'dashboard':
      default:
        return (
          <AgentDashboard
            agents={agents}
            onSelectAgent={handleSelectAgent}
            onNavigateToCreate={handleNavigateToCreate}
            onDeleteAgent={handleDeleteAgent}
          />
        );
    }
  };

  return <div className="h-screen bg-slate-800 text-slate-100 overflow-hidden">{renderView()}</div>;
};

export default App;
