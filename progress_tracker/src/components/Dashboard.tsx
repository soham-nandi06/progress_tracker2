import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend, CartesianGrid } from "recharts";
import { CheckCircle, AlertTriangle, Clock, Zap, Target, Flame, ArrowUpRight, Code, BookOpen } from "lucide-react";
import { PlanDay, StudySession, CodeforcesStats, LeetCodeStats } from "../types";

interface DashboardProps {
  days: PlanDay[];
  sessions: StudySession[];
  cfStats: CodeforcesStats | null;
  lcStats: LeetCodeStats | null;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ days, sessions, cfStats, lcStats, onNavigate }: DashboardProps) {
  // 1. Calculate General Metrics
  const completedDays = days.filter(d => d.completed).length;
  const totalDays = days.length;
  const completionPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // Auto detect active backlogs (days not completed where dayNumber <= today's progress or explicitly flagged)
  const backlogDays = days.filter(d => d.isBacklog && !d.completed).length;

  // Simple active streak calculation (consecutive completed days)
  let currentStreak = 0;
  // Sort days by dayNumber
  const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  for (let i = 0; i < sortedDays.length; i++) {
    if (sortedDays[i].completed) {
      currentStreak++;
    } else if (i > 0) {
      // Streak broken
      break;
    }
  }

  // 2. Chart Data 1: Area line chart of study minutes over last 7 days
  // Group sessions by date
  const groupedByDate: { [date: string]: number } = {};
  sessions.forEach(s => {
    groupedByDate[s.date] = (groupedByDate[s.date] || 0) + s.durationMinutes;
  });

  // Take last 7 dates chronologically helper
  const chartDataArea = Object.keys(groupedByDate)
    .sort()
    .map(date => {
      // Format date for display like "Jun 15"
      const [, month, day] = date.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const displayDate = month ? `${months[parseInt(month) - 1]} ${day}` : date;
      return {
        dateStr: displayDate,
        minutes: groupedByDate[date]
      };
    }).slice(-10); // show last 10 active days

  // Default fallback data if no sessions have been logged yet
  const fallbackArea = [
    { dateStr: "Day 1", minutes: 360 },
    { dateStr: "Day 2", minutes: 420 },
    { dateStr: "Day 3", minutes: 320 },
    { dateStr: "Day 4", minutes: 450 },
    { dateStr: "Day 5", minutes: 380 },
    { dateStr: "Day 6", minutes: 180 },
    { dateStr: "Day 7", minutes: 540 },
  ];

  const actualAreaChartData = chartDataArea.length > 0 ? chartDataArea : fallbackArea;

  // 3. Chart Data 2: Focus Category Breakdown (Pie chart)
  const categoryMinutes: { [cat: string]: number } = {
    "DSA Concepts": 0,
    "DSA Problems": 0,
    "Codeforces/Upsolve": 0,
    "ML Theory": 0,
    "ML Implementation/Project": 0,
    "VS Code Active Session": 0
  };

  sessions.forEach(s => {
    if (categoryMinutes[s.blockType] !== undefined) {
      categoryMinutes[s.blockType] += s.durationMinutes;
    }
  });

  const pieData = Object.keys(categoryMinutes).map(cat => ({
    name: cat,
    value: categoryMinutes[cat] || (chartDataArea.length === 0 ? 120 : 0) // default fallback values if sessions empty
  })).filter(item => item.value > 0);

  const COLORS = [
    "#10B981", // Emerald - DSA Concepts
    "#3B82F6", // Blue - DSA Problems
    "#F59E0B", // Amber - CF/Upsolve
    "#EC4899", // Pink - ML Theory
    "#8B5CF6", // Purple - ML Implementation
    "#6366F1"  // Indigo - VS Code Session
  ];

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Upper Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Core Progression */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 flex items-center justify-between shadow-xl" id="stat-progression">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-mono tracking-wider uppercase">Camp Progress</p>
            <h3 className="text-2xl font-bold font-mono text-cyan-400">{completedDays} / {totalDays} Days</h3>
            <p className="text-slate-400 text-xs">{completionPercentage}% Completed</p>
          </div>
          <div className="bg-cyan-500/10 p-3 rounded-lg text-cyan-400 border border-cyan-500/25 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Focus Hours Logged */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 flex items-center justify-between shadow-xl" id="stat-hours">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-mono tracking-wider uppercase">Total Focus Hours</p>
            <h3 className="text-2xl font-bold font-mono text-indigo-400">{totalStudyHours} hrs</h3>
            <p className="text-slate-400 text-xs">{sessions.length} sessions logged</p>
          </div>
          <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Current Daily Streak */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 flex items-center justify-between shadow-xl" id="stat-streak">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-mono tracking-wider uppercase">Daily Streak</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-400">{currentStreak} Days</h3>
            <p className="text-slate-400 text-xs">Consistent consecutive days</p>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Backlogs Highlight */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 flex items-center justify-between shadow-xl" id="stat-backlogs">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-mono tracking-wider uppercase">Backlogged Days</p>
            <h3 className="text-2xl font-bold font-mono text-amber-500">{backlogDays} Days</h3>
            <p className="text-slate-400 text-xs">Flagged items pending</p>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar overall */}
      <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase font-bold font-mono tracking-wider text-slate-400">Bootcamp Completion Meter</span>
          <span className="text-xs font-bold text-cyan-400 font-mono">{completionPercentage}% COMPLETE</span>
        </div>
        <div className="relative h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/55">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-emerald-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-700" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Addictive Consistency Heatmap & Burnout HUD Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="heatmap-burnout-hud">
        
        {/* GitHub-style Heatmap */}
        <div className="lg:col-span-2 bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">Daily Consistency Grid</h4>
            <p className="text-slate-350 text-xs font-semibold mt-0.5">30-Day Training Roadmap Heatmap - Click blocks to view tasks</p>
          </div>

          <div className="flex flex-wrap gap-2 my-4 items-center justify-start">
            {sortedDays.map((day) => {
              const checkedCount = 
                (day.block1_completed ? 1 : 0) +
                (day.block2_completed ? 1 : 0) +
                (day.block3_completed ? 1 : 0) +
                (day.block4_completed ? 1 : 0) +
                (day.block5_completed ? 1 : 0);

              let bgClass = "bg-slate-950 border-slate-850/80 text-slate-550";
              let shadowClass = "";

              if (day.completed) {
                bgClass = "bg-cyan-400 border-cyan-300 text-slate-950";
                shadowClass = "shadow-[0_0_8px_rgba(34,211,238,0.4)]";
              } else if (checkedCount >= 3) {
                bgClass = "bg-cyan-700/60 border-cyan-650 text-cyan-100";
                shadowClass = "shadow-[0_0_6px_rgba(6,182,212,0.15)]";
              } else if (checkedCount >= 1) {
                bgClass = "bg-cyan-950 border-cyan-900 text-cyan-300";
              } else if (day.isBacklog) {
                bgClass = "bg-amber-500/10 border-amber-500/25 text-amber-505";
              }

              return (
                <div 
                  key={day.id}
                  onClick={() => onNavigate("schedule")}
                  title={`Day ${day.dayNumber}: ${checkedCount}/5 complete`}
                  className={`w-8.5 h-8.5 rounded border text-[9.5px] font-extrabold font-mono flex items-center justify-center cursor-pointer transition hover:scale-105 duration-100 ${bgClass} ${shadowClass}`}
                >
                  D{day.dayNumber}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3.5 text-[10px] text-slate-500 font-mono mt-2 flex-wrap">
            <span className="uppercase font-bold text-slate-550">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-950 border border-slate-850 rounded" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500/10 border border-amber-550/20 rounded" />
              <span>Backlog</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-cyan-950 border border-cyan-900 rounded" />
              <span>1-2 Checked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-cyan-700/60 border border-cyan-650 rounded" />
              <span>3-4 Checked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-cyan-400 border border-cyan-300 rounded" />
              <span>100% OK</span>
            </div>
          </div>
        </div>

        {/* Burnout Risk Indicator & Weekly Consistency Index */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">Cognitive Telemetry</h4>
              <p className="text-slate-350 text-xs font-semibold mt-0.5">Burnout Risk & Streaking Velocity</p>
            </div>

            {/* Burnout Indicator block */}
            <div className="bg-[#14151f] p-4 rounded-xl border border-slate-850 relative overflow-hidden">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-500">Burnout Threshold Index</span>
                {parseFloat(totalStudyHours) > 15 ? (
                  <span className="text-[8.5px] font-bold uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded font-mono shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse">
                    ⚠️ CRITICAL WARNING
                  </span>
                ) : (
                  <span className="text-[8.5px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                    OPTIMAL STABILITY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 font-bold leading-normal">
                {parseFloat(totalStudyHours) > 15 
                  ? "Neural saturation critical! Your daily focus rate is exceeding 10 hours. Schedule active decompression breaks to preserve synapse efficiency."
                  : "Flow stability premium. Pacing margins are well structured. Your cognitive load can support high ELO training upsolves without fatigue."
                }
              </p>
            </div>

            {/* Weekly consistency score circular logic */}
            <div className="flex items-center justify-between bg-[#141520]/50 border border-slate-850 p-3 rounded-lg">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono uppercase text-slate-550 block">Weekly Pacing Index</span>
                <span className="text-xs font-bold text-slate-100">
                  {completionPercentage > 50 ? "Adaptive Velocity Strong" : "Deficit Consolidation Mode"}
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-cyan-455 font-bold text-lg">{completionPercentage}%</span>
                <p className="text-[9px] text-slate-500 uppercase">Target Index</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-grid">
        {/* Trend area chart */}
        <div className="lg:col-span-2 bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Learning Analytics Timeline</h4>
              <p className="text-slate-300 text-sm font-semibold mt-0.5">Historical Daily Study Patterns (minutes)</p>
            </div>
            {sessions.length === 0 && (
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded font-mono">
                Sample Tracker Path
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={actualAreaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeOpacity={0.3} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dateStr" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#08080c", borderColor: "#334155", borderRadius: "8px", color: "#dee2e6" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#22d3ee" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="minutes" name="Minutes" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie focus chart */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Subject Balance</h4>
            <p className="text-slate-300 text-sm font-semibold mt-0.5">Focus Minutes Distribution</p>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#08080c", borderColor: "#334155", color: "#dee2e6" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]" id="pie-legend">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integrated coding stats panel (Leetcode & Codeforces summaries) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="profiles-summary-block">
        {/* Codeforces */}
        <div className="bg-gradient-to-b from-[#0d0e14] to-transparent border border-slate-800/60 rounded-xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 shrink-0 text-cyan-500/10 font-mono text-3xl font-extrabold select-none pointer-events-none">
            CF_STATS
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-cyan-500/10 text-cyan-400 p-2.5 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                <Code className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Codeforces Hub</h4>
                <p className="text-slate-200 text-sm font-semibold mt-0.5">Performance Analytics</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("integrations")}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1 font-semibold"
            >
              <span>Manage API</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {cfStats ? (
            <div className="grid grid-cols-3 gap-4 bg-[#161720]/50 p-4 rounded-xl border border-slate-800/60">
              <div className="text-center border-r border-slate-800/80">
                <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500">Rating</p>
                <p className="text-lg font-bold text-cyan-400 font-mono mt-1">{cfStats.rating || "Unrated"}</p>
                <p className="text-[9px] text-slate-400 capitalize mt-0.5">{cfStats.rank}</p>
              </div>
              <div className="text-center border-r border-slate-800/80">
                <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500">Max Rating</p>
                <p className="text-lg font-bold text-slate-300 font-mono mt-1">{cfStats.maxRating || "N/A"}</p>
                <p className="text-[9px] text-slate-400 capitalize mt-0.5">{cfStats.maxRank}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500">Submissions</p>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">{cfStats.submissionsCount}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">AC Problems</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-[#000]/10 rounded-xl border border-dashed border-slate-800">
              <p className="text-xs text-slate-400 font-mono">CODEFORCES HANDLE UNRESOLVED</p>
              <button 
                onClick={() => onNavigate("integrations")}
                className="mt-2 text-xs bg-cyan-500/10 hover:bg-cyan-505/20 border border-cyan-500/20 px-3.5 py-1.5 rounded text-cyan-400 transition font-bold uppercase tracking-wider"
              >
                Sync Handle coordinates
              </button>
            </div>
          )}
        </div>

        {/* LeetCode */}
        <div className="bg-gradient-to-b from-[#0d0e14] to-transparent border border-slate-800/60 rounded-xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 shrink-0 text-emerald-500/10 font-mono text-3xl font-extrabold select-none pointer-events-none">
            LC_SOLVES
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">LeetCode Hub</h4>
                <p className="text-slate-200 text-sm font-semibold mt-0.5">Interactive Index Summary</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("integrations")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center space-x-1 font-semibold"
            >
              <span>Manage API</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lcStats ? (
            <div className="bg-[#161720]/50 p-4 rounded-xl border border-[#161720] shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Solved Problems</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{lcStats.totalSolved} Solves</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-emerald-500/5">
                  <span className="text-emerald-400 font-bold block uppercase tracking-wider text-[9px]">Easy</span>
                  <span className="text-slate-200 font-bold font-mono mt-0.5 block">{lcStats.solvedByDifficulty.Easy}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-amber-500/5">
                  <span className="text-amber-400 font-bold block uppercase tracking-wider text-[9px]">Medium</span>
                  <span className="text-slate-200 font-bold font-mono mt-0.5 block">{lcStats.solvedByDifficulty.Medium}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-rose-500/5">
                  <span className="text-rose-400 font-bold block uppercase tracking-wider text-[9px]">Hard</span>
                  <span className="text-slate-200 font-bold font-mono mt-0.5 block">{lcStats.solvedByDifficulty.Hard}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-[#000]/10 rounded-xl border border-dashed border-slate-800">
              <p className="text-xs text-slate-400 font-mono">LEETCODE HANDLE UNRESOLVED</p>
              <button 
                onClick={() => onNavigate("integrations")}
                className="mt-2 text-xs bg-emerald-500/10 hover:bg-emerald-505/20 border border-emerald-500/20 px-3.5 py-1.5 rounded text-emerald-400 transition font-bold uppercase tracking-wider"
              >
                Sync Handle coordinates
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
