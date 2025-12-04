import { AgentProfile, AgentVoice, DEFAULT_SYSTEM_INSTRUCTION, PRECONFIGURED_AGENTS } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeBaseService } from './knowledgeBase';

const AGENTS_STORAGE_KEY = '12brain_agents';
const ACTIVE_AGENT_ID_KEY = '12brain_active_agent_id';

export const AgentService = {
  
  seedPreconfiguredAgents: (existingAgents: AgentProfile[]): AgentProfile[] => {
    let agents = [...existingAgents];
    let needsUpdate = false;
    PRECONFIGURED_AGENTS.forEach(preconfigured => {
        // Use name as a unique key for preconfigured agents to avoid duplicates
        if (!agents.some(a => a.name === preconfigured.name && a.isPreconfigured)) {
            agents.unshift({ ...preconfigured, id: uuidv4(), createdAt: new Date() });
            needsUpdate = true;
        }
    });
    if (needsUpdate) {
        localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
    }
    return agents;
  },

  getAgents: (): AgentProfile[] => {
    try {
      const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
      const existingAgents = stored ? JSON.parse(stored).map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt),
      })) : [];
      
      // Seed preconfigured agents if they don't exist
      return AgentService.seedPreconfiguredAgents(existingAgents);

    } catch (e) {
      console.error("Failed to load agents", e);
      return [];
    }
  },

  saveAgent: (agentToSave: AgentProfile): AgentProfile[] => {
    const agents = AgentService.getAgents();
    const index = agents.findIndex(a => a.id === agentToSave.id);
    if (index > -1) {
      agents[index] = agentToSave;
    } else {
      agents.push(agentToSave); // Add new custom agents to the end
    }
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
    return agents;
  },

  createAgent: (name: string, icon: string, instructions: string, voice: AgentVoice): { newAgent: AgentProfile, updatedAgents: AgentProfile[] } => {
    const newAgent: AgentProfile = {
      id: uuidv4(),
      name: name || 'Untitled Agent',
      icon: icon || '🤖',
      systemInstruction: instructions || DEFAULT_SYSTEM_INSTRUCTION,
      createdAt: new Date(),
      isPreconfigured: false,
      voice: voice,
    };
    const updatedAgents = AgentService.saveAgent(newAgent);
    return { newAgent, updatedAgents };
  },

  deleteAgent: (id: string): AgentProfile[] => {
    let agents = AgentService.getAgents();
    agents = agents.filter(a => a.id !== id);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));

    // Also delete associated knowledge base
    KnowledgeBaseService.removeAgentKnowledge(id);

    if (AgentService.getActiveAgentId() === id) {
        localStorage.removeItem(ACTIVE_AGENT_ID_KEY);
    }
    return agents;
  },

  getActiveAgentId: (): string | null => {
    return localStorage.getItem(ACTIVE_AGENT_ID_KEY);
  },

  setActiveAgentId: (id: string | null) => {
    if (id) {
        localStorage.setItem(ACTIVE_AGENT_ID_KEY, id);
    } else {
        localStorage.removeItem(ACTIVE_AGENT_ID_KEY);
    }
  },
};