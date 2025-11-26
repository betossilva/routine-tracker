
import React, { useState, useEffect } from 'react';
import { ActivityId, ActivityType, DailyLog, View, Activity, UserProfile } from './types';
import { Tracker } from './views/Tracker';
import { Analytics } from './views/Analytics';
import { AIReport } from './views/AIReport';
import { Login } from './views/Login';
import { LayoutDashboard, CheckCircle2, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'routine_tracker_data_v1';
const USER_KEY = 'routine_tracker_user_v1';

// Função para obter a data local no formato YYYY-MM-DD
const getLocalTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Default Structure for a new day
const getDefaultActivities = (): Activity[] => [
  {
    id: ActivityId.SLEEP,
    label: 'Horas de Sono',
    type: ActivityType.REST,
    completed: false,
    details: '',
    placeholder: 'Quantas horas dormiu?',
    icon: '😴'
  },
  {
    id: ActivityId.BREAKFAST,
    label: 'Café da Manhã',
    type: ActivityType.FOOD,
    completed: false,
    details: '',
    placeholder: 'O que você comeu?',
    icon: '☕'
  },
  {
    id: ActivityId.LUNCH,
    label: 'Almoço',
    type: ActivityType.FOOD,
    completed: false,
    details: '',
    placeholder: 'O que você comeu?',
    icon: '🥗'
  },
  {
    id: ActivityId.DINNER,
    label: 'Jantar',
    type: ActivityType.FOOD,
    completed: false,
    details: '',
    placeholder: 'O que você comeu?',
    icon: '🍽️'
  },
  {
    id: ActivityId.WORKOUT,
    label: 'Treino',
    type: ActivityType.EXERCISE,
    completed: false,
    details: '',
    placeholder: 'Qual treino realizou?',
    icon: '💪'
  },
  {
    id: ActivityId.CARDIO,
    label: 'Cardio',
    type: ActivityType.EXERCISE,
    completed: false,
    details: '',
    placeholder: 'Tempo ou distância?',
    icon: '🏃'
  }
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentView, setCurrentView] = useState<View>(View.TRACKER);
  // Usa a função corrigida para obter a data local
  const [todayStr, setTodayStr] = useState<string>(getLocalTodayStr());

  // Check for User
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setCurrentView(View.TRACKER); // Reset view
  };

  // Update date if app stays open past midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const checkDate = getLocalTodayStr();
      if (checkDate !== todayStr) {
        setTodayStr(checkDate);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [todayStr]);

  // Load data on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedLogs = JSON.parse(stored);
        setLogs(parsedLogs);
      } catch (e) {
        console.error("Failed to parse storage", e);
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }
  }, [logs]);

  // Ensure "Today" exists and update structure if needed
  useEffect(() => {
    if (logs.length > 0) {
       const todayLogIndex = logs.findIndex(l => l.date === todayStr);
       
       if (todayLogIndex === -1) {
         // Create new log if not exists
         setLogs(prev => [
           ...prev,
           { date: todayStr, activities: getDefaultActivities() }
         ]);
       } else {
         // Migration logic: If today exists but missing "SLEEP", add it
         const currentActivities = logs[todayLogIndex].activities;
         const hasSleep = currentActivities.some(a => a.id === ActivityId.SLEEP);
         
         if (!hasSleep) {
            setLogs(prev => {
                const newLogs = [...prev];
                const sleepActivity = getDefaultActivities().find(a => a.id === ActivityId.SLEEP);
                if (sleepActivity) {
                    newLogs[todayLogIndex].activities = [sleepActivity, ...newLogs[todayLogIndex].activities];
                }
                return newLogs;
            });
         }
       }
    } else {
        // First run
        setLogs([{ date: todayStr, activities: getDefaultActivities() }]);
    }
  }, [todayStr, logs.length]); // Added logic to check structure

  const getCurrentLog = () => {
    return logs.find(l => l.date === todayStr) || { date: todayStr, activities: getDefaultActivities() };
  };

  const handleToggleActivity = (activityId: string) => {
    setLogs(prevLogs => prevLogs.map(log => {
      if (log.date !== todayStr) return log;
      return {
        ...log,
        activities: log.activities.map(act => 
          act.id === activityId ? { ...act, completed: !act.completed } : act
        )
      };
    }));
  };

  const handleUpdateDetails = (activityId: string, details: string) => {
    setLogs(prevLogs => prevLogs.map(log => {
      if (log.date !== todayStr) return log;
      return {
        ...log,
        activities: log.activities.map(act => 
          act.id === activityId ? { ...act, details } : act
        )
      };
    }));
  };

  // Login View
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Main App
  return (
    <div className="min-h-screen w-full bg-brand-50 font-sans text-slate-900 overflow-x-hidden relative selection:bg-brand-200">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-screen bg-grid-pattern opacity-40 pointer-events-none z-0" />
      <div className="fixed top-[-10%] right-[-20%] w-[500px] h-[500px] bg-brand-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      
      <main className="w-full h-full max-w-lg mx-auto min-h-screen relative z-0">
        {currentView === View.TRACKER && (
          <Tracker 
            currentLog={getCurrentLog()} 
            user={user}
            onToggleActivity={handleToggleActivity}
            onUpdateDetails={handleUpdateDetails}
            onLogout={handleLogout}
          />
        )}
        {currentView === View.ANALYTICS && (
          <Analytics logs={logs} />
        )}
        {currentView === View.AI_REPORT && (
          <AIReport logs={logs} user={user} />
        )}
      </main>

      {/* Modern Floating Bottom Navigation */}
      <div className="fixed bottom-4 left-0 w-full flex justify-center z-50 px-4 pointer-events-none">
        <nav className="glass bg-white/70 backdrop-blur-xl border border-white/40 shadow-soft rounded-3xl px-6 py-3 flex items-center gap-8 pointer-events-auto">
          <button 
            onClick={() => setCurrentView(View.TRACKER)}
            className={`relative p-2 rounded-xl transition-all duration-300 ${currentView === View.TRACKER ? 'text-brand-600 bg-brand-100/50' : 'text-slate-400 hover:text-brand-500'}`}
          >
            <CheckCircle2 size={24} strokeWidth={currentView === View.TRACKER ? 2.5 : 2} />
            {currentView === View.TRACKER && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
          </button>

          <button 
            onClick={() => setCurrentView(View.ANALYTICS)}
            className={`relative p-2 rounded-xl transition-all duration-300 ${currentView === View.ANALYTICS ? 'text-brand-600 bg-brand-100/50' : 'text-slate-400 hover:text-brand-500'}`}
          >
            <LayoutDashboard size={24} strokeWidth={currentView === View.ANALYTICS ? 2.5 : 2} />
            {currentView === View.ANALYTICS && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
          </button>

          <button 
            onClick={() => setCurrentView(View.AI_REPORT)}
            className={`relative p-2 rounded-xl transition-all duration-300 ${currentView === View.AI_REPORT ? 'text-brand-600 bg-brand-100/50' : 'text-slate-400 hover:text-brand-500'}`}
          >
            <Sparkles size={24} strokeWidth={currentView === View.AI_REPORT ? 2.5 : 2} />
            {currentView === View.AI_REPORT && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
          </button>
        </nav>
      </div>
    </div>
  );
}
