
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, X, Send, Sparkles, MessageCircle, Loader2, User, ChevronRight } from 'lucide-react';
import { Task, User as UserType, StatusUpdate } from '../types';

interface AIAssistantProps {
  tasks: Task[];
  users: UserType[];
  statusUpdates: StatusUpdate[];
  currentUser: UserType;
  projectName: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const SUGGESTIONS = [
  "What is the most critical task right now?",
  "Summarize the project status.",
  "Are any tasks overdue?",
  "Draft a status update for this week."
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ tasks, users, statusUpdates, currentUser, projectName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'intro', role: 'model', text: `Hi ${currentUser.name.split(' ')[0]}! I'm your Project Assistant. I have full visibility into your board, team, and deadlines. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) {
          throw new Error("API Key missing");
      }
      const ai = new GoogleGenAI({ apiKey });

      // Construct Context
      const projectContext = JSON.stringify({
        project: projectName,
        tasks: tasks.map(t => ({
            title: t.title,
            status: t.status,
            assignee: t.assignee,
            priority: t.priority,
            dueDate: t.dueDate,
            description: t.description,
            phase: t.phase
        })),
        team: users.map(u => ({ name: u.name, role: u.role })),
        recentUpdates: statusUpdates.slice(0, 3)
      });

      const systemInstruction = `
        You are an expert AI Project Manager for the project "${projectName}".
        You are helpful, concise, and proactive.
        
        Here is the live project data (JSON):
        ${projectContext}
        
        Current Date: ${new Date().toLocaleDateString()}
        
        Rules:
        1. Answer questions based SPECIFICALLY on the project data provided.
        2. If asked to draft content (like updates or tickets), use professional formatting.
        3. Identify blockers or overdue items when asked about risks.
        4. Keep responses relatively short unless asked for a detailed report.
      `;

      // We use a simple single-turn generation for this demo, 
      // effectively passing history by appending it if we wanted full conversation,
      // but for simplicity in this structure, we'll treat each as a fresh query with context + history.
      
      // Construct a simple chat history for the prompt
      const conversationHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
      const finalPrompt = `${conversationHistory}\nUser: ${textToSend}\nAI:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: finalPrompt,
        config: {
            systemInstruction: systemInstruction,
        }
      });

      const cleanText = (response.text || "").replace(/\*\*/g, '');

      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: cleanText || "I'm having trouble analyzing the project right now." 
      };
      
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "I encountered an error connecting to the AI service. Please check your API key configuration." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
            fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-primary-600 to-secondary-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group
            ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75 group-hover:animate-none"></div>
        <Bot className="w-8 h-8 relative z-10" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
      </button>

      {/* Chat Modal */}
      <div 
        className={`
            fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right
            ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}
        `}
        style={{ height: '600px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
                <div className="p-1.5 bg-white/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">{projectName} AI Agent</h3>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-[10px] opacity-80">Online • Gemini 2.5 Flash</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                        max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                        ${msg.role === 'user' 
                            ? 'bg-primary-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}
                    `}>
                        {msg.role === 'model' && (
                            <div className="flex items-center gap-1 mb-1 opacity-50 text-[10px] font-bold uppercase tracking-wider">
                                <Bot className="w-3 h-3" /> Assistant
                            </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                        <span className="text-xs text-gray-500">Thinking...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Suggestions (Only if few messages) */}
        {messages.length < 3 && !isLoading && (
            <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto scrollbar-hide">
                {SUGGESTIONS.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSend(s)}
                        className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-primary-400 hover:text-primary-600 transition-colors whitespace-nowrap"
                    >
                        {s}
                    </button>
                ))}
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about tasks, deadlines..."
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-500"
                    disabled={isLoading}
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-sm"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400">AI can make mistakes. Verify important info.</p>
            </div>
        </div>

      </div>
    </>
  );
};
