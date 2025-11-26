
import React, { useState, useMemo } from 'react';
import { DailyLog, ActivityType, TimeRange } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { FileText, TrendingUp, CalendarCheck, CalendarRange, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalyticsProps {
  logs: DailyLog[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ logs }) => {
  const [range, setRange] = useState<TimeRange>(TimeRange.WEEK);
  const [isExporting, setIsExporting] = useState(false);

  // Process data based on selected range
  const chartData = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (range === TimeRange.YEAR) {
      // Group by Month for Year View
      const monthlyData: Record<string, { total: number, completed: number, count: number }> = {};
      
      sortedLogs.forEach(log => {
        const date = new Date(log.date + 'T00:00:00');
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); // ex: jan/24
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, completed: 0, count: 0 };
        }
        
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].total += log.activities.length;
        monthlyData[monthKey].completed += log.activities.filter(a => a.completed).length;
      });

      return Object.entries(monthlyData).map(([name, data]) => ({
        name,
        completed: Math.round(data.completed / data.count), // Average tasks completed per day in that month
        percent: data.total > 0 ? (data.completed / data.total) * 100 : 0
      }));
    } 
    
    else {
      // Daily view for Week/Month
      let sliceCount = range === TimeRange.WEEK ? 7 : 30;
      const slicedLogs = sortedLogs.slice(-sliceCount);

      return slicedLogs.map(log => {
        const d = new Date(log.date + 'T00:00:00'); 
        return {
          name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
          completed: log.activities.filter(a => a.completed).length,
          total: log.activities.length,
          percent: log.activities.length > 0 ? (log.activities.filter(a => a.completed).length / log.activities.length) * 100 : 0
        };
      });
    }
  }, [logs, range]);

  // Calculate totals for the selected period
  const stats = useMemo(() => {
    let slicedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (range === TimeRange.WEEK) slicedLogs = slicedLogs.slice(-7);
    if (range === TimeRange.MONTH) slicedLogs = slicedLogs.slice(-30);
    // Year uses all available logs (or last 365 if we had that much data)

    const totalCompleted = slicedLogs.reduce((acc, log) => acc + log.activities.filter(a => a.completed).length, 0);
    const totalWorkouts = slicedLogs.reduce((acc, log) => acc + log.activities.filter(a => a.completed && a.type === ActivityType.EXERCISE).length, 0);
    
    return { totalCompleted, totalWorkouts };
  }, [logs, range]);

  
  const handleExportReport = () => {
      setIsExporting(true);
      const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const doc = new jsPDF();

      // --- Header ---
      doc.setFillColor(22, 163, 74); // Brand 600
      doc.rect(0, 0, 210, 25, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("RoutineTracker", 14, 16);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Relatório de Histórico - Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

      // --- Stats Summary ---
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo de Desempenho", 14, 38);

      const totalDays = logs.length;
      const totalActivities = logs.reduce((acc, log) => acc + log.activities.filter(a => a.completed).length, 0);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de Dias Registrados: ${totalDays}`, 14, 46);
      doc.text(`Total de Atividades Concluídas: ${totalActivities}`, 14, 52);

      // --- Data Preparation for AutoTable ---
      const tableBody = sortedLogs.map(log => {
        const dateStr = new Date(log.date + 'T00:00:00').toLocaleDateString('pt-BR');
        const completedCount = log.activities.filter(a => a.completed).length;
        const totalCount = log.activities.length;
        const percentage = Math.round((completedCount / totalCount) * 100);
        
        // Format activities into a multiline string for the cell
        const activitiesStr = log.activities.map(a => {
            const status = a.completed ? '✅' : '⬜';
            const detail = a.details ? ` - ${a.details}` : '';
            return `${status} ${a.label}${detail}`;
        }).join('\n');

        return [dateStr, `${percentage}% (${completedCount}/${totalCount})`, activitiesStr];
      });

      // --- Generate Table ---
      autoTable(doc, {
        startY: 60,
        head: [['Data', 'Progresso', 'Detalhes das Atividades']],
        body: tableBody,
        theme: 'grid',
        headStyles: { 
            fillColor: [22, 163, 74], 
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: 50
        },
        columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold' }, // Date
            1: { cellWidth: 30, halign: 'center' }, // Progress
            2: { cellWidth: 'auto' } // Activities
        },
        alternateRowStyles: {
            fillColor: [240, 253, 244] // Brand 50
        }
      });

      // --- Footer ---
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
      }

      // --- Save ---
      doc.save(`RoutineTracker_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsExporting(false);
  };

  return (
    <div className="pb-48 pt-10 px-6 max-w-lg mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
            <p className="text-slate-500 text-sm">Análise de desempenho</p>
        </div>
        <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="group flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full hover:bg-brand-600 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Baixar Relatório PDF"
        >
            {isExporting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <Download size={20} />
            )}
        </button>
      </div>

      {/* Range Selector */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex mb-8">
        {[
          { id: TimeRange.WEEK, label: '7 Dias' },
          { id: TimeRange.MONTH, label: '30 Dias' },
          { id: TimeRange.YEAR, label: 'Ano' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRange(tab.id)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
              range === tab.id 
                ? 'bg-brand-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl shadow-soft border border-slate-50 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalendarCheck size={40} className="text-brand-500" />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Atividades ({range === TimeRange.YEAR ? 'Ano' : range === TimeRange.MONTH ? 'Mês' : 'Semana'})
            </p>
            <p className="text-3xl font-extrabold text-brand-600 tracking-tight">{stats.totalCompleted}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-soft border border-slate-50 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={40} className="text-blue-500" />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Treinos Realizados
            </p>
            <p className="text-3xl font-extrabold text-blue-600 tracking-tight">{stats.totalWorkouts}</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-50 mb-6">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">
              {range === TimeRange.YEAR ? 'Média Mensal' : 'Atividades Diárias'}
            </h2>
            <div className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-md font-medium">
              <CalendarRange size={12} />
              <span>Visão {range === TimeRange.YEAR ? 'Anual' : range === TimeRange.MONTH ? 'Mensal' : 'Semanal'}</span>
            </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                interval={range === TimeRange.MONTH ? 2 : 0} // Skip labels on month view to fit
              />
              <YAxis 
                tick={{fill: '#94a3b8', fontSize: 11}} 
                tickLine={false} 
                axisLine={false} 
                domain={[0, 5]}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                formatter={(value: number) => [value, range === TimeRange.YEAR ? 'Média/Dia' : 'Feito']}
              />
              <Bar 
                dataKey="completed" 
                name="Atividades" 
                fill="#10b981" 
                radius={[6, 6, 6, 6]} 
                barSize={range === TimeRange.MONTH ? 8 : 24}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-50 mb-6">
        <h2 className="text-base font-bold text-slate-800 mb-6">Consistência (%)</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} tickLine={false} axisLine={false} dy={10} interval={range === TimeRange.MONTH ? 2 : 0} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 formatter={(value: number) => [`${Math.round(value)}%`, 'Consistência']}
              />
              <Area 
                type="monotone" 
                dataKey="percent" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPercent)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
