
import React, { useState } from 'react';
import { DailyLog, TimeRange, UserProfile } from '../types';
import { generateRoutineReport } from '../services/geminiService.ts.old';
import { Sparkles, RefreshCw, Bot, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIReportProps {
  logs: DailyLog[];
  user: UserProfile | null;
}

export const AIReport: React.FC<AIReportProps> = ({ logs, user }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<TimeRange>(TimeRange.WEEK);

  const handleGenerate = async () => {
    setLoading(true);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const result = await generateRoutineReport(logs, range, user?.name);
    setReport(result);
    setLoading(false);
  };

  const getRangeLabel = () => {
    switch(range) {
      case TimeRange.WEEK: return "Últimos 7 dias";
      case TimeRange.MONTH: return "Últimos 30 dias";
      case TimeRange.YEAR: return "Histórico Anual";
      default: return "";
    }
  }

  return (
    <div className="pb-48 pt-10 px-6 max-w-lg mx-auto min-h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-100 rounded-xl text-brand-600">
            <Bot size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Relatório Inteligente</h1>
      </div>
      <p className="text-slate-500 mb-6 text-sm leading-relaxed">
        Selecione o período e deixe a IA analisar seus padrões, sugerir melhorias e criar um plano de ação.
      </p>

      {/* Range Selector for AI */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex mb-8">
        {[
          { id: TimeRange.WEEK, label: 'Semanal' },
          { id: TimeRange.MONTH, label: 'Mensal' },
          { id: TimeRange.YEAR, label: 'Anual' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setRange(tab.id); setReport(null); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
              range === tab.id 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!report && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-4 animate-in zoom-in-95 duration-500">
          <div className="relative mb-8">
             <div className="absolute inset-0 bg-brand-400 blur-2xl opacity-20 rounded-full animate-pulse"></div>
             <div className="w-24 h-24 bg-gradient-to-tr from-brand-50 to-white rounded-3xl shadow-soft flex items-center justify-center relative z-10 border border-brand-100">
                <Sparkles size={48} className="text-brand-500" />
             </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-2">Gerar {getRangeLabel()}</h3>
          <p className="text-center text-slate-500 mb-10 max-w-[280px] text-sm">
            A IA analisará seus dados de {range === TimeRange.YEAR ? 'todo o ano' : range === TimeRange.MONTH ? 'todo o mês' : 'toda a semana'} para encontrar tendências.
          </p>
          
          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Sparkles size={20} className="text-brand-200" />
            <span>Analisar Agora</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar size={20} className="text-brand-500 animate-pulse" />
                </div>
            </div>
            <p className="text-slate-500 font-medium animate-pulse text-center">
              Lendo seu histórico {range === TimeRange.WEEK ? 'semanal' : range === TimeRange.MONTH ? 'mensal' : 'anual'}...
            </p>
        </div>
      )}

      {report && !loading && (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-soft border border-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-blue-500"></div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Relatório {range}</span>
               <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-full">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-brand-700 max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            className="mt-6 w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={16} />
            Regerar Análise
          </button>
        </div>
      )}
    </div>
  );
};
