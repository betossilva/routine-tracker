
import React, { useState } from 'react';
import { Activity, ActivityType } from '../types';
import { Check } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  onToggle: (id: string) => void;
  onChangeDetails: (id: string, details: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onToggle, onChangeDetails }) => {
  const [isFocused, setIsFocused] = useState(false);

  // Define cores de fundo baseadas no tipo de atividade para destacar os emojis
  const getIconContainerStyle = () => {
    if (activity.completed) {
      return 'bg-slate-100 grayscale opacity-60'; // Mantém discreto quando concluído
    }
    
    // Cores vibrantes para ícones ativos
    if (activity.type === ActivityType.FOOD) {
      return 'bg-orange-100 text-orange-600 border border-orange-200 shadow-sm';
    } else if (activity.type === ActivityType.REST) {
      return 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm';
    } else {
      return 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm';
    }
  };

  return (
    <div 
      className={`relative group p-4 rounded-2xl mb-4 transition-all duration-300 ease-out border ${
        activity.completed 
          ? 'bg-brand-50/50 border-brand-200/50' 
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox Button */}
        <button
          onClick={() => onToggle(activity.id)}
          className={`mt-1 flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            activity.completed 
              ? 'bg-brand-500 text-white shadow-brand-500/30 shadow-lg scale-100 rotate-0' 
              : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:scale-105'
          }`}
        >
          <Check size={24} strokeWidth={3} className={`transition-all duration-300 ${activity.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-bold text-lg leading-tight transition-colors ${activity.completed ? 'text-brand-900 line-through decoration-brand-300' : 'text-slate-800'}`}>
              {activity.label}
            </h3>
            
            {/* Ícone Colorido com Container */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${getIconContainerStyle()}`}>
                <span className="text-xl">{activity.icon}</span>
            </div>
          </div>

          <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}>
            <input
              type="text"
              value={activity.details}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onChangeDetails(activity.id, e.target.value)}
              placeholder={activity.placeholder}
              className={`w-full bg-transparent text-sm py-2 border-b-2 outline-none transition-all placeholder:text-slate-400 ${
                isFocused 
                  ? 'border-brand-500 text-slate-900' 
                  : 'border-transparent text-slate-600 hover:border-slate-200'
              } ${activity.completed ? 'text-brand-700 placeholder:text-brand-300/70' : ''}`}
            />
             {activity.details === '' && !isFocused && !activity.completed && (
                <div className="absolute top-2 left-0 text-xs text-slate-400 pointer-events-none italic opacity-0 group-hover:opacity-100 transition-opacity">
                    Toque para adicionar detalhes...
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
