import { GoogleGenAI, Part, LiveServerMessage, Modality, GenerateContentResponse } from "@google/genai";
import { Attachment, ChatSessionConfig } from '../types';

// --- HELPER FUNCTIONS FOR AUDIO ---

// Converte Float32 (formato Web Audio) para PCM 16-bit (formato Gemini)
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

// Converte Base64 string para Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// CRUCIAL: Downsampler para converter 44.1k/48k para 16k
function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (outputRate === inputRate) return buffer;
  
  const sampleRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRatio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    // Interpolação simples para performance em tempo real
    result[i] = buffer[Math.round(i * sampleRatio)];
  }
  return result;
}

export class GeminiLiveService {
  private client: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private onStatusChange: (status: { isSpeaking: boolean, volume: number }) => void;
  private stopSignal = false;
  private stream: MediaStream | null = null;

  constructor(apiKey: string, onStatusChange: (status: { isSpeaking: boolean, volume: number }) => void) {
    this.client = new GoogleGenAI({ apiKey });
    this.onStatusChange = onStatusChange;
  }

  async startSession(config: ChatSessionConfig, knowledgeContext: string, voiceName: string) {
    this.stopSignal = false;
    
    try {
      // STEP 1: Initialize Audio Pipeline FIRST, triggered by user click
      await this.initializeAudioPipeline();

      const fullSystemInstruction = `${config.systemInstruction}\n${knowledgeContext}\n\nIMPORTANT: This is a VOICE conversation. Keep responses shorter, conversational, and direct.`;

      // STEP 2: Connect to Live API now that audio is ready
      this.sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: fullSystemInstruction,
          speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
          }
        },
        callbacks: {
          onopen: () => console.log("Voice Session Connected and streaming from microphone."),
          onmessage: async (msg: LiveServerMessage) => {
            if (this.stopSignal) return;
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              this.playAudioChunk(audioData);
              this.onStatusChange({ isSpeaking: true, volume: Math.random() * 50 + 50 }); 
            }
            if (msg.serverContent?.turnComplete) {
               this.onStatusChange({ isSpeaking: false, volume: 0 });
            }
          },
          onclose: () => {
            console.log("Voice Session Closed");
            this.stop();
          },
          onerror: (err) => {
            console.error("Voice Session Error", err);
            this.stop();
          }
        }
      });
      // The 'onaudioprocess' is already running and will now start sending data via the promise
    } catch (err) {
        console.error("Failed to start voice session:", err);
        this.stop(); // Clean up on failure
        throw err; // Re-throw to be caught by the UI
    }
  }
  
  private async initializeAudioPipeline() {
    try {
        // Output Context: Gemini 2.5 Flash returns áudio em 24kHz
        this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();

        this.stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });

        this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
        this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
            if (this.stopSignal || !this.sessionPromise) return;
            
            const inputData = e.inputBuffer.getChannelData(0);
            
            let sum = 0;
            for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            if (rms > 0.01) this.onStatusChange({ isSpeaking: false, volume: rms * 500 });

            const currentRate = this.inputAudioContext!.sampleRate;
            const downsampledData = downsampleBuffer(inputData, currentRate, 16000);
            const pcmData = floatTo16BitPCM(downsampledData);
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData)));

            this.sessionPromise.then((s: any) => {
                s.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64Audio } });
            });
        };

        this.inputSource.connect(this.processor);
        this.processor.connect(this.inputAudioContext.destination);

    } catch (err) {
        console.error("Microphone Access Error", err);
        throw new Error("Microphone permission was denied. Please allow access and try again.");
    }
  }

  private async playAudioChunk(base64Audio: string) {
    if (!this.outputAudioContext) return;
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    const audioBytes = base64ToUint8Array(base64Audio);
    const audioBuffer = await this.decodeAudioData(audioBytes);
    
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    
    const currentTime = this.outputAudioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  // Custom decoder for raw PCM 16-bit to AudioBuffer
  private decodeAudioData(bytes: Uint8Array): Promise<AudioBuffer> {
      return new Promise((resolve) => {
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768;
        
        const buffer = this.outputAudioContext!.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        resolve(buffer);
      });
  }

  stop() {
    this.stopSignal = true;
    
    // Stop microphone tracks
    this.stream?.getTracks().forEach(track => track.stop());

    this.inputSource?.disconnect();
    this.processor?.disconnect();
    
    // Close contexts after a small delay to allow final events to process
    setTimeout(() => {
        this.inputAudioContext?.close().catch(console.error);
        this.outputAudioContext?.close().catch(console.error);
    }, 100);

    this.sessionPromise = null;
    this.stream = null;
  }
}

export class GeminiService {
  private genAI: GoogleGenAI | null = null;
  private chat: any = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }

  public initialize(config: ChatSessionConfig, knowledgeContext: string = "") {
    if (!this.genAI) return;

    const fullSystemInstruction = `${config.systemInstruction}\n${knowledgeContext}\n\n[CURRENT CHANNEL: ${config.channel.toUpperCase()}]\nAdjust your response brevity and formatting for this channel.`;
    
    this.chat = this.genAI.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.2, 
      },
      history: [],
    });
  }

  public async extractTextFromMedia(base64Data: string, mimeType: string): Promise<string> {
    if (!this.genAI) throw new Error("API Key missing");

    try {
      const cleanData = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
      const model = this.genAI.models;
      const response = await model.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: cleanData } },
            { text: "Analyze this document strictly. Extract ALL relevant text, data, rules, and accounting information into a clean, plain text summary. Do not use markdown formatting like bold or tables, just clear structured text paragraphs. This text will be used to train an AI agent." }
          ]
        }
      });
      return response.text || "No text extracted.";
    } catch (e) {
      console.error("Extraction error", e);
      throw new Error("Failed to extract text from document.");
    }
  }

  // REAL Web Scraping: Hybrid approach (Jina AI + Fallback to Gemini Grounding)
  public async scrapeUrl(url: string): Promise<{ text: string, source: string }> {
    if (!this.genAI) throw new Error("API Key missing");
    
    // 1. Try Jina AI Reader first (Deep Scraping)
    try {
        console.log(`Attempting deep scrape via Jina AI for: ${url}`);
        const jinaUrl = `https://r.jina.ai/${url}`;
        const response = await fetch(jinaUrl);
        
        if (response.ok) {
            const text = await response.text();
            if (text && text.length > 100) {
                return { 
                    text: `[Source: Jina AI Deep Scrape]\n${text}`, 
                    source: 'Jina AI' 
                };
            }
        }
    } catch (e) {
        console.warn("Jina AI scrape failed, falling back to Google Search Grounding", e);
    }

    // 2. Fallback: Google Search Grounding
    try {
        const response = await this.genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Access this specific URL and extract all relevant text content verbatim where possible: ${url}`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        let result = response.text || "No content extracted.";
        
        // Append source metadata
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            result += `\n\nSource Verified: ${url}`;
        }
        return { text: result, source: 'Google Search' };

    } catch (e: any) {
        console.error("Scraping error", e);
        throw new Error("Failed to scrape URL: " + e.message);
    }
  }

  // REAL Research for generic topics
  public async performResearch(query: string): Promise<string> {
    if (!this.genAI) throw new Error("API Key missing");
    
    try {
        const response = await this.genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Research the following topic in depth and provide a comprehensive summary suitable for an accountant's knowledge base. Focus on facts, numbers, and dates: "${query}"`,
            config: {
                tools: [{ googleSearch: {} }] // REAL Google Search Tool
            }
        });
        
        let result = response.text || "No results found.";
        
        // Append source links if available
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            result += "\n\nSources:\n";
            response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    result += `- ${chunk.web.title}: ${chunk.web.uri}\n`;
                }
            });
        }
        return result;

    } catch (e: any) {
        console.error("Research error", e);
        throw new Error("Failed to perform research: " + e.message);
    }
  }

  public async sendMessage(message: string, attachments: Attachment[] = []): Promise<string> {
    if (!this.chat) throw new Error("Chat session not initialized.");

    try {
      const parts: Part[] = [];
      if (attachments.length > 0) {
        attachments.forEach(att => {
          const base64Data = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
          parts.push({ inlineData: { mimeType: att.mimeType, data: base64Data } });
        });
      }
      if (message) parts.push({ text: message });

      const result: GenerateContentResponse = await this.chat.sendMessage({ message: parts });
      return result.text || "No response generated.";
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(error.message || "Failed to communicate with the Tax Agent.");
    }
  }
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};