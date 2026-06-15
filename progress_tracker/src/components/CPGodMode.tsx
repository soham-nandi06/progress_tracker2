import React, { useState, useEffect } from "react";
import { 
  Code, 
  Zap, 
  Target, 
  Flame, 
  Award, 
  TrendingUp, 
  HelpCircle, 
  Play, 
  Square, 
  Timer, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  BarChart2, 
  RefreshCw 
} from "lucide-react";
import { CodeforcesStats, StudySession } from "../types";

interface CPGodModeProps {
  cfStats: CodeforcesStats | null;
  sessions: StudySession[];
  onLogSession: (minutes: number, blockType: any, notes: string, source: string) => void;
}

export default function CPGodMode({ cfStats, sessions, onLogSession }: CPGodModeProps) {
  // Contest Mode States
  const [contestTimerActive, setContestTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(7200); // 2 hours default
  const [selectedContestName, setSelectedContestName] = useState("Codeforces Round 910 (Div. 2)");
  const [customMistakes, setCustomMistakes] = useState<Array<{ problem: string, type: string, notes: string }>>([
    { problem: "1800C", type: "Implementation details", notes: "Forgot to clarify priority queue priorities." },
    { problem: "1800E", type: "Mathematical representation", notes: "Failed to realize divisibility by 3 checks." }
  ]);
  const [newMistakeProblem, setNewMistakeProblem] = useState("");
  const [newMistakeType, setNewMistakeType] = useState("Tidying implementation");
  const [newMistakeNotes, setNewMistakeNotes] = useState("");

  // Problem Recommender states
  const [difficultySetting, setDifficultySetting] = useState<"comfort" | "stretch" | "nightmare">("stretch");

  // Timer Effect
  useEffect(() => {
    let intervalId: any;
    if (contestTimerActive && secondsLeft > 0) {
      intervalId = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setContestTimerActive(false);
      alert("Contest time is up! Time for post-contest upsolving and mistake categorization.");
    }
    return () => clearInterval(intervalId);
  }, [contestTimerActive, secondsLeft]);

  // Format seconds -> timer string
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartContest = () => {
    setContestTimerActive(true);
  };

  const handleStopContest = () => {
    setContestTimerActive(false);
    // Log typical virtual contest to focus hours!
    const minutesStudied = Math.floor((7200 - secondsLeft) / 60);
    if (minutesStudied > 5) {
      onLogSession(
        minutesStudied,
        "Codeforces/Upsolve",
        `Completed virtual practice for '${selectedContestName}'.`,
        "Simulation"
      );
    }
  };

  const handleResetContest = () => {
    setContestTimerActive(false);
    setSecondsLeft(7200);
  };

  const handleAddMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMistakeProblem.trim()) return;
    setCustomMistakes([
      ...customMistakes,
      {
        problem: newMistakeProblem.trim(),
        type: newMistakeType,
        notes: newMistakeNotes.trim() || "Uncategorized deficit details."
      }
    ]);
    setNewMistakeProblem("");
    setNewMistakeNotes("");
  };

  // 1. Calculate Performance Intelligence from Live Submissions
  const submissions = cfStats?.lastSubmissions || [];
  const totalChecked = submissions.length;
  const acSubmissions = submissions.filter((s: any) => s.verdict === "OK");
  const failedSubmissions = submissions.filter((s: any) => s.verdict && s.verdict !== "OK");
  const accuracyPercentage = totalChecked > 0 
    ? Math.round((acSubmissions.length / totalChecked) * 100) 
    : 72; // fallback high accuracy default

  // Average Solved rating
  const solvedRatings = acSubmissions
    .map((s: any) => s.problem?.rating)
    .filter((r: any) => typeof r === "number");
  const avgSolvedRating = solvedRatings.length > 0
    ? Math.round(solvedRatings.reduce((sum, r) => sum + r, 0) / solvedRatings.length)
    : 1150; // fallback standard default

  // Simple tag weakness detection from failed vs solved submissions
  const solvedTags: { [key: string]: number } = {};
  const failedTags: { [key: string]: number } = {};

  acSubmissions.forEach((sub: any) => {
    const tags = sub.problem?.tags || [];
    tags.forEach((tag: string) => {
      solvedTags[tag] = (solvedTags[tag] || 0) + 1;
    });
  });

  failedSubmissions.forEach((sub: any) => {
    const tags = sub.problem?.tags || [];
    tags.forEach((tag: string) => {
      failedTags[tag] = (failedTags[tag] || 0) + 1;
    });
  });

  // Weak topic: standard ratio of failed tags / (solved + failed)
  const topicStats = Object.keys({ ...solvedTags, ...failedTags }).map(tag => {
    const sCount = solvedTags[tag] || 0;
    const fCount = failedTags[tag] || 0;
    const total = sCount + fCount;
    // We want high error rates
    const failRate = total > 0 ? (fCount / total) : 0;
    return { tag, sCount, fCount, failRate, total };
  });

  const sortedWeakTopics = [...topicStats]
    .sort((a, b) => b.failRate - a.failRate || b.fCount - a.fCount)
    .filter(t => t.total >= 1)
    .map(t => t.tag);

  const fallbackWeakTopics = ["dp", "graphs", "greedy"];
  const finalWeakTopics = sortedWeakTopics.length > 0 ? sortedWeakTopics.slice(0, 3) : fallbackWeakTopics;

  // 2. Dynamic Problem Recommender based on Codeforces rating
  const currentRating = cfStats?.rating || 1320;
  const targetRatings = {
    comfort: Math.max(800, Math.floor(currentRating / 100) * 100 - 100),
    stretch: Math.floor(currentRating / 100) * 100 + 100,
    nightmare: Math.floor(currentRating / 100) * 100 + 300,
  };

  const recommendationTier = targetRatings[difficultySetting];

  // Static high quality problem bank to map recommendations elegantly
  const problemBank = [
    { id: "1850A", name: "To My Critics", rating: 800, tags: ["math", "greedy"] },
    { id: "1850B", name: "Ten Words of Wisdom", rating: 800, tags: ["implementation"] },
    { id: "1811A", name: "Insert Digit", rating: 900, tags: ["greedy", "strings"] },
    { id: "1807D", name: "Odd Queries", rating: 1000, tags: ["math", "data structures"] },
    { id: "1800B", name: "Count the Number of Pairs", rating: 1000, tags: ["greedy", "strings"] },
    { id: "1791D", name: "Distinct Split", rating: 1100, tags: ["brute force", "strings"] },
    { id: "1722D", name: "Line", rating: 1100, tags: ["greedy", "two pointers"] },
    { id: "1800C", name: "Powering the Hero (Easy)", rating: 1100, tags: ["dp", "greedy"] },
    { id: "1676D", name: "X-Sum", rating: 1200, tags: ["brute force", "implementation"] },
    { id: "1690D", name: "Black and White Stripe", rating: 1200, tags: ["two pointers"] },
    { id: "1703E", name: "Mirror Grid", rating: 1200, tags: ["implementation"] },
    { id: "1800D", name: "Remove Two Letters", rating: 1200, tags: ["greedy", "strings"] },
    { id: "1791G1", name: "Teleporters (Easy)", rating: 1200, tags: ["greedy", "sorts"] },
    { id: "1669H", name: "Maximal AND", rating: 1300, tags: ["bitmask", "greedy"] },
    { id: "1722D", name: "Prefix Tree Sum", rating: 1300, tags: ["trees", "dp"] },
    { id: "1800E2", name: "Unforgivable Riddle", rating: 1400, tags: ["dsu", "greedy"] },
    { id: "1551B2", name: "Wonderful Coloring - 2", rating: 1400, tags: ["data structures", "greedy"] },
    { id: "1619D", name: "New Year's Concert", rating: 1500, tags: ["dp", "graphs", "trees"] },
    { id: "1791G2", name: "Teleporters (Hard)", rating: 1500, tags: ["binary search", "greedy"] },
    { id: "1800F", name: "Dasha and Nightmares", rating: 1600, tags: ["bitmask", "strings"] },
    { id: "173B", name: "Chamber of Secrets", rating: 1600, tags: ["graphs", "shortest paths"] },
    { id: "1526C2", name: "Potions (Hard Version)", rating: 1650, tags: ["greedy", "data structures"] },
    { id: "1619E", name: "MEX and Increments", rating: 1700, tags: ["dp", "greedy", "sorts"] },
    { id: "1601B", name: "Frog Traveler", rating: 1800, tags: ["graphs", "shortest paths", "dp"] },
    { id: "1800G", name: "Symmetric Trees", rating: 1900, tags: ["trees", "hashing"] },
  ];

  // Filter recommendations matching requested rating tier
  const matchedRecommendations = problemBank
    .filter(p => p.rating >= recommendationTier - 100 && p.rating <= recommendationTier + 100)
    .slice(0, 3);

  return (
    <div className="space-y-6" id="cp-god-mode-root">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold font-display uppercase tracking-[0.15em] text-cyan-400 flex items-center space-x-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <span>Codeforces God Mode Hub</span>
          </h2>
          <p className="text-slate-400 text-xs">Unleash live automated ranking sync, smart targeting, and bulletproof mistake analytics.</p>
        </div>
        <div className="text-[10px] font-mono font-bold bg-[#1d1f30] text-cyan-400 uppercase tracking-widest px-3 py-1.5 rounded-full border border-cyan-500/20">
          Rank: {cfStats?.rank ? cfStats.rank.toUpperCase() : "UNRANKED"} ({cfStats?.rating || 0} ELO)
        </div>
      </div>

      {/* Grid of Performance Intelligence & Problem Recommender */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Intelligence Panel */}
        <div className="lg:col-span-2 bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl space-y-4">
          <div>
            <span className="text-[10px] tracking-wider uppercase font-mono text-slate-500 font-bold block">Performance Intelligence Matrix</span>
            <p className="text-slate-400 text-[10px]">Real-time algorithm metrics parsed over active contest runs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Accuracy card */}
            <div className="bg-[#14151f] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">AC Submission Accuracy</span>
              <div className="my-3 flex items-baseline space-x-1">
                <span className="text-3xl font-black font-mono text-cyan-400">{accuracyPercentage}%</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {acSubmissions.length} OK / {totalChecked} total verdicts
              </p>
            </div>

            {/* Average rating card */}
            <div className="bg-[#14151f] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">Avg Problem Rating Solved</span>
              <div className="my-3 flex items-baseline space-x-1">
                <span className="text-3xl font-black font-mono text-indigo-400">{avgSolvedRating}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Strengths target: {avgSolvedRating - 100} to {avgSolvedRating + 200} Elo
              </p>
            </div>

            {/* Weak topics card */}
            <div className="bg-[#14151f] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">Weak Theme Deficit Detected</span>
              <div className="my-2.5 space-y-1">
                {finalWeakTopics.map((topic, i) => (
                  <div key={topic} className="flex justify-between items-center bg-[#1b1c2b] px-2 py-0.5 rounded border border-rose-500/10 text-[10px] font-mono">
                    <span className="text-rose-450 font-bold">#{i + 1} {topic.toUpperCase()}</span>
                    <span className="text-slate-400">deficit</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-tight mt-1">
                Prioritize down-solved tree loops.
              </p>
            </div>

          </div>

          {/* Codeforces Live Submissions stream */}
          <div className="space-y-2 mt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-500 block">Live Codeforce Verdicts timeline</span>
            <div className="max-h-40 overflow-y-auto bg-[#07070a] p-3 rounded-xl border border-slate-850 space-y-2 font-mono text-xs no-scrollbar">
              {submissions.length > 0 ? (
                submissions.map((sub: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#11121c]/50 hover:bg-[#11121c] border border-slate-900 transition">
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${sub.verdict === "OK" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500"}`} />
                      <span className="text-slate-400">Contest {sub.contestId || "N/A"} - </span>
                      <span className="font-bold text-slate-200 truncate">{sub.problem?.name || "Problem"}</span>
                      {sub.problem?.rating && (
                        <span className="bg-[#1c2135] text-cyan-400 text-[10px] px-1.5 py-0.2 rounded font-bold">{sub.problem.rating}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase shrink-0 ${sub.verdict === "OK" ? "text-emerald-400" : "text-rose-400"}`}>
                      {sub.verdict || "QUEUED"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic text-[11px] p-2">Sync Codeforces handle on settings area first to stream live submissions.</p>
              )}
            </div>
          </div>

        </div>

        {/* Dynamic Problem Recommender */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] tracking-wider uppercase font-mono text-slate-500 font-bold block">Smart Problem Recommender</span>
            <p className="text-slate-400 text-[10px]">Recommended practice matching your current Elo index.</p>
          </div>

          {/* Difficulty selector tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#141520] p-1 rounded-lg border border-slate-800 my-4 text-[10px] font-mono uppercase text-center">
            <button 
              onClick={() => setDifficultySetting("comfort")}
              className={`py-1 rounded font-bold cursor-pointer transition ${
                difficultySetting === "comfort" 
                  ? "bg-cyan-500/10 text-cyan-455 border border-cyan-500/20" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Comfort
            </button>
            <button 
              onClick={() => setDifficultySetting("stretch")}
              className={`py-1 rounded font-bold cursor-pointer transition ${
                difficultySetting === "stretch" 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.08)]" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Stretch
            </button>
            <button 
              onClick={() => setDifficultySetting("nightmare")}
              className={`py-1 rounded font-bold cursor-pointer transition ${
                difficultySetting === "nightmare" 
                  ? "bg-rose-500/10 text-rose-450 border border-rose-500/20" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Nightmare
            </button>
          </div>

          <div className="space-y-2.5 flex-1 flex flex-col justify-center">
            {matchedRecommendations.map((prob) => (
              <a 
                href={`https://codeforces.com/contest/${prob.id.match(/\d+/)?.[0]}/problem/${prob.id.match(/[A-Z]\d*/)?.[0] || ""}`}
                target="_blank" 
                rel="noreferrer"
                key={prob.id}
                className="bg-[#14151f] hover:bg-[#181926] border border-slate-800 hover:border-cyan-500/30 p-3.5 rounded-xl transition group flex items-center justify-between"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="font-mono text-cyan-400 font-bold block text-xs">{prob.id}</span>
                    <span className="bg-[#1b1c2b] text-[10px] text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold">
                      {prob.rating} ELO
                    </span>
                  </div>
                  <h5 className="font-semibold text-xs text-slate-200 leading-normal group-hover:text-white transition">
                    {prob.name}
                  </h5>
                  <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-slate-500">
                    {prob.tags.slice(0, 2).map(t => `#${t}`).join(" ")}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
              </a>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 font-mono text-center mt-4">
            Solving target ELO: <span className="text-cyan-400 font-bold">~{recommendationTier}</span> based on active {cfStats?.rating || 1320} rank.
          </p>
        </div>

      </div>

      {/* Contest Mode block and timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="contest-and-mistakes">

        {/* Contest controller segment */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span>Contest God Mode (Timer Simulator)</span>
            </h4>
            <p className="text-slate-400 text-xs">Run high-fidelity training sessions with custom virtual timers.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 flex flex-col items-center justify-center space-y-3 shadow-inner my-2">
            <span className="text-4xl font-extrabold font-mono tracking-widest text-cyan-400" id="contest-countdown-timer">
              {formatTime(secondsLeft)}
            </span>
            <div className="flex items-center space-x-2">
              {!contestTimerActive ? (
                <button 
                  onClick={handleStartContest}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider px-4 py-1.5 rounded text-xs transition flex items-center space-x-1 shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Start virtual</span>
                </button>
              ) : (
                <button 
                  onClick={handleStopContest}
                  className="bg-rose-500 hover:bg-rose-455 text-white font-bold uppercase tracking-wider px-4 py-1.5 rounded text-xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Log & Stop</span>
                </button>
              )}
              <button 
                onClick={handleResetContest}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 font-bold uppercase tracking-wider px-3 py-1.5 rounded text-xs transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-500 block">Select Active Contest Frame</label>
            <input 
              type="text" 
              className="w-full bg-[#14151f] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500" 
              value={selectedContestName}
              onChange={(e) => setSelectedContestName(e.target.value)}
              placeholder="e.g. Codeforces Round 910"
            />
          </div>
        </div>

        {/* Post Contest upsolving classifier */}
        <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Post-Contest Mistake Classifier</span>
            </h4>
            <p className="text-slate-400 text-xs">Register and index upsolving logic to crush recurring bottlenecks.</p>
          </div>

          {/* Mistakes Scroll block */}
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1 font-mono text-xs no-scrollbar flex-1">
            {customMistakes.map((mist, i) => (
              <div key={i} className="bg-[#141520]/60 border border-slate-800 p-2.5 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-cyan-400 font-bold font-mono text-[11px]">Problem: {mist.problem}</span>
                  <span className="text-amber-500 bg-amber-500/10 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                    {mist.type}
                  </span>
                </div>
                <p className="text-slate-300 text-[10.5px] leading-relaxed italic">
                  "{mist.notes}"
                </p>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleAddMistake} className="space-y-2 border-t border-slate-800/80 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                className="bg-[#14151f] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-cyan-500" 
                placeholder="Problem ID (e.g., 1800C)"
                value={newMistakeProblem}
                onChange={(e) => setNewMistakeProblem(e.target.value)}
              />
              <select 
                className="bg-[#141520] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-505"
                value={newMistakeType}
                onChange={(e) => setNewMistakeType(e.target.value)}
              >
                <option value="Tidying implementation">Tidying implementation</option>
                <option value="Tidying mathematical representation">Tidying mathematical representation</option>
                <option value="Misread problem statements">Misread problem statements</option>
                <option value="Time limit exceeded optimization">Time limit exceeded optimization</option>
                <option value="Corner Case exception bugs">Corner Case exception bugs</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-[#14151f] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-cyan-500" 
                placeholder="Deficit details (e.g. overlooked N=1 edge constraint...)"
                value={newMistakeNotes}
                onChange={(e) => setNewMistakeNotes(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-[#1a2135] hover:bg-slate-800/80 border border-cyan-500/20 text-cyan-400 p-2 rounded text-xs tracking-wider transition font-bold"
              >
                <Plus className="w-4 h-4 font-extrabold" />
              </button>
            </div>
          </form>

        </div>

      </div>

    </div>
  );
}
