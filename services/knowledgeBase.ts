import { KnowledgeDocument } from '../types';

const STORAGE_KEY = '12brain_knowledge_base';

// This service now manages a single list of all documents,
// filtering them by agentId.
export const KnowledgeBaseService = {
  
  // Gets all documents from storage for a SPECIFIC agent
  getDocuments: (agentId: string): KnowledgeDocument[] => {
    if (!agentId) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const allDocs: any[] = JSON.parse(stored);
      
      const agentDocs = allDocs
        .filter(doc => doc.agentId === agentId)
        .map(doc => ({ ...doc, dateAdded: new Date(doc.dateAdded) }));
        
      return agentDocs;
    } catch (e) {
      console.error("Failed to load knowledge base", e);
      return [];
    }
  },

  // Gets ALL documents for ALL agents
  _getAllDocuments: (): KnowledgeDocument[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addDocument: (doc: KnowledgeDocument): KnowledgeDocument[] => {
    const allDocs = KnowledgeBaseService._getAllDocuments();
    const updated = [doc, ...allDocs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return KnowledgeBaseService.getDocuments(doc.agentId);
  },

  removeDocument: (id: string, agentId: string): KnowledgeDocument[] => {
    const allDocs = KnowledgeBaseService._getAllDocuments();
    const updated = allDocs.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return KnowledgeBaseService.getDocuments(agentId);
  },
  
  // Deletes all documents for a specific agent - used when an agent is deleted
  removeAgentKnowledge: (agentId: string) => {
     const allDocs = KnowledgeBaseService._getAllDocuments();
     const remainingDocs = allDocs.filter(d => d.agentId !== agentId);
     localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingDocs));
  },

  buildContextString: (agentId: string): string => {
    const docs = KnowledgeBaseService.getDocuments(agentId);
    if (docs.length === 0) return "";

    let context = "\n\n=== INTERNAL KNOWLEDGE BASE (STRICTLY FOLLOW THIS DATA) ===\n";
    docs.forEach((doc, index) => {
      context += `\n[SOURCE ${index + 1}: ${doc.title} (${doc.type})]\n${doc.content}\n`;
    });
    context += "\n=== END KNOWLEDGE BASE ===\nUse the information above to answer user queries with high priority.\n";
    return context;
  }
};
