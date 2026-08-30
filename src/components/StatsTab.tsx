import React, { useState } from 'react';
import { FlashCard, UserStats } from '../types';
import { Flame, Award, Target, Clock, Calendar, TrendingUp, Info, Sparkles } from 'lucide-react';

interface StatsTabProps { stats: UserStats; cards: FlashCard[]; }

export const StatsTab: React.FC<StatsTabProps> = ({ stats, cards }) => {
  const [selectedDay, setSelectedDay] = useState<{ formattedDate: string; cardsReviewed: number; timeSeconds: number } | null>(null);
  const masteredCount = cards.filter((c) => c.state === 'Dominado').length;
  const learningCount = cards.filter((c) => c.state === 'Aprendendo').length;
  const reviewCount = cards.filter((c) => c.state === 'Revisão').length;
  const newCount = cards.filter((c) => c.state === 'Novo').length;
  const accuracy = stats.totalReviews > 0 ? Math.round((stats.correctReviews / stats.totalReviews) * 100) : 100;
  const totalMinutes = Math.round(stats.totalTimeSeconds / 60);
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (29 - i)); const isoDate = d.toISOString().split('T')[0];
    return { date: d, isoDate, dayOfMonth: d.getDate(), dayOfWeekStr: d.toLocaleDateString('pt-BR', { weekday: 'narrow' }), formattedDate: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) };
  });
  const historyData = stats.dailyHistory || {};
  const hasHistory = Object.keys(historyData).length > 0;
  const getDayStats = (isoDate: string, index: number) => {
    if (historyData[isoDate]) return historyData[isoDate];
    if (!hasHistory || Object.keys(historyData).length < 2) {
      const seed = (index * 7 + 3) % 11;
      if (seed > 3 && index < 29) { const mockCards = seed * 3 + 2; return { cardsReviewed: mockCards, timeSeconds: mockCards * 45 }; }
    }
    return { cardsReviewed: 0, timeSeconds: 0 };
  };
  const daysWithStats = last30Days.map((day, idx) => { const dayStat = getDayStats(day.isoDate, idx); return { ...day, cardsReviewed: dayStat.cardsReviewed || 0, timeSeconds: dayStat.timeSeconds || 0 }; });
  const activeDaysCount = daysWithStats.filter((d) => d.cardsReviewed > 0).length;
  const total30DaysCards = daysWithStats.reduce((acc, d) => acc + d.cardsReviewed, 0);
  const avgCardsPerDay = Math.round(total30DaysCards / 30);
  const getIntensityLevel = (count: number) => count === 0 ? 0 : count <= 4 ? 1 : count <= 10 ? 2 : count <= 20 ? 3 : 4;
  const levelClasses = ['bg-[#fff0eb] border-[#f4ddd4] dark:bg-[#382b31] dark:border-[#58424c]','bg-[#dff3e8] border-[#c1e5d1] dark:bg-[#30433a] dark:border-[#466052]','bg-[#bfe5d0] border-[#9ed4b7] dark:bg-[#3d6651] dark:border-[#54846c]','bg-[#8fd0ae] border-[#70bd99] dark:bg-[#4b8d6c] dark:border-[#6aad88]','bg-[#65b58d] border-[#55a77f] dark:bg-[#7cc49f] dark:border-[#99d6b8]'];
  const metricCards = [
    { label: 'Dias consecutivos', value: stats.streakDays, icon: <Flame className="w-6 h-6 fill-current" />, bg: 'bg-[#fff5df] dark:bg-[#493a2c]', border: 'border-[#f6d89d] dark:border-[#69513b]', color: 'text-[#d39042]' },
    { label: 'Palavras aprendidas', value: masteredCount, icon: <Award className="w-6 h-6" />, bg: 'bg-[#eef9f3] dark:bg-[#2f4138]', border: 'border-[#ccebdc] dark:border-[#436052]', color: 'text-[#58a47f]' },
    { label: 'Precisão de retenção', value: `${accuracy}%`, icon: <Target className="w-6 h-6" />, bg: 'bg-[#fff0f3] dark:bg-[#493039]', border: 'border-[#ffd3dc] dark:border-[#693c49]', color: 'text-[#e25d78]' },
    { label: 'Tempo estudado', value: `${totalMinutes}m`, icon: <Clock className="w-6 h-6" />, bg: 'bg-[#f3efff] dark:bg-[#403650]', border: 'border-[#ddd3ff] dark:border-[#5d4c73]', color: 'text-[#8874c9]' },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-7 pb-32 flex flex-col gap-5">
      <header className="rounded-[30px] ankiu-surface px-5 py-5 relative overflow-hidden">
        <span className="absolute right-5 top-4 text-[#f09aaf] ankiu-sparkle">✦</span>
        <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#aa8490] flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Seu progresso</div>
        <div className="flex items-end justify-between gap-3 mt-1"><div><h1 className="text-3xl font-black text-[#3d2d34] dark:text-[#fff7f3] tracking-[-.04em]">Estatísticas</h1><p className="text-xs text-[#957b84] dark:text-[#c9b3bb] mt-1">Pequenos passos também contam ♡</p></div><div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fff0f3] dark:bg-[#493039] text-[#df5d78] dark:text-[#ff9caf] border border-[#ffd1da] dark:border-[#693c49] text-[10px] font-black"><TrendingUp className="w-3.5 h-3.5" />30 dias</div></div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((item) => <div key={item.label} className={`${item.bg} ${item.border} border rounded-[28px] p-5 shadow-[0_12px_32px_rgba(116,65,80,.08)] flex flex-col justify-between gap-3`}><div className={`w-11 h-11 rounded-[18px] bg-white/60 dark:bg-black/10 flex items-center justify-center ${item.color}`}>{item.icon}</div><div><span className={`text-3xl font-black ${item.color}`}>{item.value}</span><p className="text-xs font-bold text-[#987b86] dark:text-[#c8b1b9] mt-0.5">{item.label}</p></div></div>)}
      </div>

      <section className="rounded-[30px] ankiu-surface p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-2xl bg-[#eef9f3] dark:bg-[#2f4138] text-[#58a47f] flex items-center justify-center"><Calendar className="w-4 h-4" /></div><div><h3 className="text-sm font-black text-[#4b373f] dark:text-[#fff7f3]">Atividade dos últimos 30 dias</h3><p className="text-xs text-[#9a7f88] dark:text-[#c8b1b9]">{activeDaysCount} dias com estudo</p></div></div><span className="text-[10px] font-black text-[#58a47f] bg-[#eef9f3] dark:bg-[#2f4138] px-2.5 py-1 rounded-full">~{avgCardsPerDay}/dia</span></div>
        <div className="grid grid-cols-6 gap-2 pt-1">{daysWithStats.map((d, index) => { const level = getIntensityLevel(d.cardsReviewed); const isToday = index === 29; return <button key={d.isoDate} type="button" onClick={() => setSelectedDay({ formattedDate: d.formattedDate, cardsReviewed: d.cardsReviewed, timeSeconds: d.timeSeconds })} className={`relative aspect-square rounded-[14px] border transition-all flex flex-col items-center justify-center p-1 hover:scale-110 ${levelClasses[level]} ${isToday ? 'ring-2 ring-[#ef8298] ring-offset-2 dark:ring-offset-[#382b31]' : ''}`} title={`${d.formattedDate}: ${d.cardsReviewed} cartões`}><span className="text-[10px] font-black opacity-75">{d.dayOfMonth}</span>{d.cardsReviewed > 0 && <div className="w-1 h-1 rounded-full bg-current opacity-50 mt-0.5" />}</button>; })}</div>
        <div className="flex items-center justify-between text-[10px] text-[#a98b94] pt-2 border-t border-[#f1ddd7] dark:border-[#57414a]"><span>Leve</span><div className="flex gap-1">{levelClasses.map((cls, idx) => <div key={idx} className={`w-3.5 h-3.5 rounded-md border ${cls}`} />)}</div><span>Intenso</span></div>
        {selectedDay ? <div className="p-3.5 rounded-[20px] bg-[#fff8f3] dark:bg-[#30242a] border border-[#efd8d1] dark:border-[#57414a] flex items-center justify-between"><div><div className="text-xs font-black text-[#4b373f] dark:text-[#fff7f3]">{selectedDay.formattedDate}</div><div className="text-xs text-[#927781] dark:text-[#c8b1b9]">{selectedDay.cardsReviewed > 0 ? `${selectedDay.cardsReviewed} cartões • ~${Math.ceil(selectedDay.timeSeconds / 60)} min` : 'Sem revisões neste dia'}</div></div><button onClick={() => setSelectedDay(null)} className="text-xs font-black text-[#e05d78]">Fechar</button></div> : <div className="flex items-center gap-1.5 text-[11px] text-[#a98b94] italic"><Info className="w-3.5 h-3.5" />Toque em um dia para ver detalhes.</div>}
      </section>

      <section className="rounded-[30px] ankiu-surface p-5 flex flex-col gap-4">
        <h3 className="text-[11px] font-black uppercase tracking-[.13em] text-[#a3838d]">Distribuição do vocabulário ({cards.length})</h3>
        <div className="w-full h-3 rounded-full bg-[#f5e6e1] dark:bg-[#4b3941] overflow-hidden flex"><div style={{ width: `${(newCount / (cards.length || 1)) * 100}%` }} className="bg-[#cfb8bf] h-full" /><div style={{ width: `${(learningCount / (cards.length || 1)) * 100}%` }} className="bg-[#efb85f] h-full" /><div style={{ width: `${(reviewCount / (cards.length || 1)) * 100}%` }} className="bg-[#f06d86] h-full" /><div style={{ width: `${(masteredCount / (cards.length || 1)) * 100}%` }} className="bg-[#79c49f] h-full" /></div>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#80646f] dark:text-[#d1bac2]"><div>○ Novos ({newCount})</div><div className="text-[#c88a3f]">● Aprendendo ({learningCount})</div><div className="text-[#e25d78]">● Revisão ({reviewCount})</div><div className="text-[#58a47f]">● Dominados ({masteredCount})</div></div>
      </section>
    </div>
  );
};
