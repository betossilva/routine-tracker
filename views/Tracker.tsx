import React from 'react';
import { DailyLog, UserProfile } from '../types';
import { ActivityCard } from '../components/ActivityCard';
import { CalendarDays } from 'lucide-react';

interface TrackerProps {
  currentLog: DailyLog;
  user: UserProfile | null;
  onToggleActivity: (id: string) => void;
  onUpdateDetails: (id: string, details: string) => void;
}

export const Tracker: React.FC<TrackerProps> = ({ currentLog, user, onToggleActivity, onUpdateDetails }) => {
  // Calculate progress
  const completedCount = currentLog.activities.filter(a => a.completed).length;
  const totalCount = currentLog.activities.length;
  const progress = (completedCount / totalCount) * 100;

  // Formatting date
  const dateObj = new Date(currentLog.date + 'T00:00:00'); // Force local interpretation
  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long' });

  // Greeting
  const hour = new Date().getHours();
  let greeting = 'Bom dia';
  if (hour >= 12) greeting = 'Boa tarde';
  if (hour >= 18) greeting = 'Boa noite';

  const userName = user ? user.name.split(' ')[0] : '';

  return (
    <div className="pb-48 pt-10 px-6 max-w-lg mx-auto">
      <header className="mb-8 animate-in slide-in-from-top-4 duration-700">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-brand-700 font-medium text-sm mb-1 uppercase tracking-wide opacity-80">
                  {greeting}{userName ? `, ${userName}` : ''}!
                </p>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
                    {dayName}, <span className="text-brand-600">{dayNum}</span>
                </h1>
                <p className="text-slate-400 font-medium text-sm capitalize">{monthName}</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-brand-100 flex flex-col items-center min-w-[80px]">
                 <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-brand-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-brand-500 transition-all duration-1000 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-xs font-bold text-brand-700">{Math.round(progress)}%</span>
                 </div>
            </div>
        </div>
      </header>

      {/* Modern Gradient Progress Bar */}
      <div className="mb-8 animate-in fade-in duration-1000">
          <div className="flex justify-between text-xs font-semibold text-brand-700/60 mb-2 uppercase tracking-wider">
              <span>Seu Progresso Diário</span>
              <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="h-4 w-full bg-white rounded-full overflow-hidden shadow-inner border border-brand-100/50">
            <div 
                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 shadow-glow transition-all duration-700 ease-out rounded-full"
                style={{ width: `${progress}%` }}
            />
          </div>
      </div>

      <div className="space-y-4">
        {currentLog.activities.map((activity, index) => (
          <div key={activity.id} className="animate-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: `${index * 50}ms` }}>
            <ActivityCard
                activity={activity}
                onToggle={onToggleActivity}
                onChangeDetails={onUpdateDetails}
            />
          </div>
        ))}
      </div>
    </div>
  );
};