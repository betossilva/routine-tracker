
import React, { useState, useEffect, useRef } from 'react';
import { DailyLog, UserProfile, ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIReportProps {
  logs: DailyLog[];
  user: UserProfile | null;
}

const CHAT_STORAGE_KEY = 'routine_tracker_chat_history_v1';

export const AIReport: React.FC<AIReportProps> = ({ logs, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar histórico ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar chat", e);
      }
    } else {
      // Mensagem de boas-vindas inicial se não houver histórico
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: `Olá, ${user?.name?.split(' ')[0] || 'amigo'}! 👋 \n\nSou seu Coach de Rotina Inteligente. Posso analisar seus dados, sugerir melhorias na dieta e treino, ou apenas conversar sobre seu progresso. \n\nComo posso ajudar hoje?`,
        timestamp: Date.now()
      }]);
    }
  }, [user]);

  // Salvar histórico sempre que mudar
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearChat = () => {
    if (window.confirm('Tem certeza que deseja apagar todo o histórico da conversa?')) {
      const initialMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: 'Histórico limpo! Vamos começar de novo. O que você gostaria de saber sobre sua rotina?',
        timestamp: Date.now()
      };
      setMessages([initialMsg]);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([initialMsg]));
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Pequeno delay para UX
    setTimeout(scrollToBottom, 100);

    const responseText = await sendMessageToGemini(textToSend, messages, logs, user);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const suggestions = [
    "Como foi minha semana?",
    "Dicas para dormir melhor",
    "Analise meus treinos",
    "Estou comendo bem?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] pt-6 pb-4 max-w-lg mx-auto relative">
      {/* Header */}
      <div className="px-6 pb-4 flex justify-between items-center bg-brand-50/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-xl text-white shadow-lg shadow-brand-500/20">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Coach IA</h1>
            <p className="text-xs text-brand-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Online
            </p>
          </div>
        </div>
        <button 
          onClick={handleClearChat}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Limpar conversa"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6 scroll-smooth pb-4 no-scrollbar">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-white border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 shadow-sm">
                  <Bot size={14} />
                </div>
              )}
              
              <div 
                className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  isUser 
                    ? 'bg-brand-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                }`}
              >
                {isUser ? (
                   <p>{msg.text}</p>
                ) : (
                   <div className="prose prose-sm prose-p:my-1 prose-headings:text-brand-800 prose-strong:text-brand-700 text-slate-700">
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   </div>
                )}
                <span className={`text-[10px] block mt-1 opacity-60 ${isUser ? 'text-brand-100' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
                  {user?.photoUrl ? <img src={user.photoUrl} alt="Me" className="w-full h-full object-cover" /> : <User size={14} />}
                </div>
              )}
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start gap-2 items-end animate-in fade-in duration-300">
             <div className="w-8 h-8 rounded-full bg-white border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 shadow-sm">
                <Bot size={14} />
             </div>
             <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2">
        {/* Quick Suggestions - Only show if not loading and messages < 2 or last message was AI */}
        {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model' && (
          <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mask-gradient">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-4 py-2 bg-white border border-brand-100 text-brand-700 text-xs font-semibold rounded-full shadow-sm hover:bg-brand-50 hover:border-brand-300 transition-all active:scale-95 flex items-center gap-1"
              >
                <Sparkles size={12} />
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre sua rotina..."
            disabled={isLoading}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm pl-4 pr-12 py-4 rounded-full shadow-lg shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-slate-400 disabled:opacity-70 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-brand-600 text-white rounded-full shadow-md hover:bg-brand-700 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-90"
          >
            <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            {isLoading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
          </button>
        </div>
      </div>
    </div>
  );
};
