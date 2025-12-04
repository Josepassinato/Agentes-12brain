import React, { useState, useEffect } from 'react';
import { KnowledgeDocument, AgentProfile } from '../types';
import { KnowledgeBaseService } from '../services/knowledgeBase';
import { GeminiService, fileToBase64 } from '../services/geminiService';

interface AdminPanelProps {
  apiKey: string;
  activeAgent: AgentProfile;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ apiKey, activeAgent, onClose }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'research'>('upload');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [researchMode, setResearchMode] = useState<'topic' | 'url'>('topic');
  const [researchQuery, setResearchQuery] = useState("");
  
  const [previewData, setPreviewData] = useState<{ title: string; content: string; url: string } | null>(null);

  useEffect(() => {
    if (activeAgent) {
      setDocuments(KnowledgeBaseService.getDocuments(activeAgent.id));
    }
  }, [activeAgent]);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!apiKey) return alert("API Key missing");
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLoading(true);
      setStatus(`Reading ${file.name} with AI...`);
      
      try {
        const base64 = await fileToBase64(file);
        const gemini = new GeminiService(apiKey);
        const extractedText = await gemini.extractTextFromMedia(base64, file.type);

        const newDoc: KnowledgeDocument = {
          id: Date.now().toString(),
          agentId: activeAgent.id,
          title: file.name,
          type: 'pdf',
          content: extractedText,
          dateAdded: new Date()
        };

        const updated = KnowledgeBaseService.addDocument(newDoc);
        setDocuments(updated);
        setStatus("Document processed & added to knowledge base.");
      } catch (err) {
        console.error(err);
        setStatus("Error processing document.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!researchQuery) return;
    if (!apiKey) return alert("API Key missing");

    setLoading(true);
    setPreviewData(null);
    setStatus(researchMode === 'topic' 
        ? "Agent is researching the web..." 
        : "Scraping URL via Jina AI...");

    try {
        const gemini = new GeminiService(apiKey);
        let result = "";
        let docTitle = "";

        if (researchMode === 'topic') {
            result = await gemini.performResearch(researchQuery);
            docTitle = `Research: ${researchQuery}`;
        } else {
            const scrapeResult = await gemini.scrapeUrl(researchQuery);
            result = scrapeResult.text;
            docTitle = `Scrape: ${researchQuery}`;
        }

        setPreviewData({
            title: docTitle,
            content: result,
            url: researchMode === 'url' ? researchQuery : 'Google Search'
        });
        
        setStatus("Analysis complete. Review and save.");

    } catch (err: any) {
        console.error(err);
        setStatus("Operation failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSavePreview = () => {
      if (!previewData) return;
      
      const newDoc: KnowledgeDocument = {
        id: Date.now().toString(),
        agentId: activeAgent.id,
        title: previewData.title,
        type: 'web',
        sourceUrl: previewData.url,
        content: previewData.content,
        dateAdded: new Date()
      };

      const updated = KnowledgeBaseService.addDocument(newDoc);
      setDocuments(updated);
      setPreviewData(null);
      setResearchQuery("");
      setStatus("✅ Content saved to Knowledge Base.");
  };

  const handleDelete = (id: string) => {
    const updated = KnowledgeBaseService.removeDocument(id, activeAgent.id);
    setDocuments(updated);
  };

  return (
    <div className="flex-1 h-full bg-slate-800 flex flex-col p-4 sm:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4 sm:mb-6 mt-12 lg:mt-0">
        <div>
           <h2 className="text-xl sm:text-2xl font-bold text-white">Knowledge Base</h2>
           <p className="text-xs sm:text-sm text-slate-400">Training Data for: <span className="font-bold text-purple-300">{activeAgent?.name}</span></p>
        </div>
        <button onClick={onClose} className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-white text-sm hover:bg-slate-600">Back to Chat</button>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setActiveTab('upload')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'upload' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200 border border-slate-600'}`}
        >
          📄 Upload Docs
        </button>
        <button 
          onClick={() => setActiveTab('research')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'research' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200 border border-slate-600'}`}
        >
          🔍 Web Researcher
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden pb-4">
        {/* Interaction Column */}
        <div className="w-full lg:w-1/2 bg-slate-900 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 flex flex-col flex-shrink-0 lg:overflow-y-auto">
          {activeTab === 'upload' ? (
            <div className="flex flex-col items-center justify-center h-64 lg:h-full border-2 border-dashed border-slate-700 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
              <input type="file" id="doc-upload" className="hidden" accept="application/pdf,image/*" onChange={handleDocumentUpload} disabled={loading} />
              <label htmlFor="doc-upload" className={`cursor-pointer text-center p-6 w-full ${loading ? 'opacity-50' : ''}`}>
                <div className="text-4xl mb-3">📂</div>
                <span className="block font-medium text-white">Upload PDF/Image</span>
                <span className="text-xs text-slate-400 mt-2">Agent extracts text & adds to knowledge base</span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-white font-bold text-sm mb-1">Web Knowledge Tools</h4>
                  <p className="text-slate-400 text-xs">Uses Jina AI Reader & Google Search.</p>
              </div>

              <div className="flex bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => { setResearchMode('topic'); setPreviewData(null); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${researchMode === 'topic' ? 'bg-slate-700 text-purple-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Topic Research
                </button>
                <button 
                    onClick={() => { setResearchMode('url'); setPreviewData(null); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${researchMode === 'url' ? 'bg-slate-700 text-purple-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    URL Scraper
                </button>
              </div>

              {!previewData && (
                  <>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {researchMode === 'topic' ? "Research Topic" : "Target Website URL"}
                        </label>
                        <input 
                        type="text" 
                        value={researchQuery}
                        onChange={(e) => setResearchQuery(e.target.value)}
                        placeholder={researchMode === 'topic' ? "e.g., Latest trends in AI" : "https://example.com/article"}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        />
                    </div>
                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !researchQuery}
                        className={`bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex justify-center items-center ${loading ? 'opacity-50' : ''}`}
                    >
                        {loading ? 'Analyzing...' : 'Analyze & Preview'}
                    </button>
                  </>
              )}

              {previewData && (
                  <div className="flex-1 flex flex-col space-y-3 bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-hidden">
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-300 uppercase">Preview Extracted Data</span>
                          <button onClick={() => setPreviewData(null)} className="text-xs text-red-400 hover:underline">Discard</button>
                      </div>
                      <textarea 
                          className="flex-1 w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-300 resize-none focus:outline-none"
                          value={previewData.content}
                          readOnly
                      />
                      <button 
                        onClick={handleSavePreview}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                          Save to Knowledge Base
                      </button>
                  </div>
              )}
            </div>
          )}
          {status && !previewData && <p className={`text-center font-medium mt-4 text-xs sm:text-sm ${status.includes('Error') || status.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
        </div>

        <div className="w-full lg:w-1/2 bg-slate-900 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 overflow-y-auto lg:h-full min-h-[300px]">
          <h3 className="font-bold text-white mb-4 flex justify-between items-center">
             <span>Learned Knowledge</span>
             <span className="bg-slate-700 text-purple-300 text-xs px-2 py-1 rounded-full">{documents.length}</span>
          </h3>
          {documents.length === 0 ? (
             <p className="text-slate-500 text-sm italic text-center py-10">This agent has no knowledge yet.</p>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="p-3 border border-slate-800 rounded-lg flex justify-between items-start hover:bg-slate-800/50 transition-colors">
                  <div className="overflow-hidden flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">{doc.type === 'pdf' ? '📄' : '🔍'}</span>
                      <h4 className="font-medium text-slate-200 text-sm truncate" title={doc.title}>{doc.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{doc.dateAdded.toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{doc.content}</p>
                  </div>
                  <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
