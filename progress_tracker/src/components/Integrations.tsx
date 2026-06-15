import React, { useState } from "react";
import { Code, BookOpen, Save, RefreshCw, Key, Cloud, ShieldAlert, Cpu, Check } from "lucide-react";
import { UserSettings, CodeforcesStats, LeetCodeStats } from "../types";

interface IntegrationsProps {
  settings: UserSettings;
  cfStats: CodeforcesStats | null;
  lcStats: LeetCodeStats | null;
  cfLoading: boolean;
  lcLoading: boolean;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onFetchCfData: (handle: string) => void;
  onFetchLcData: (handle: string) => void;
  isFirebaseSetup: boolean;
}

export default function Integrations({
  settings,
  cfStats,
  lcStats,
  cfLoading,
  lcLoading,
  onUpdateSettings,
  onFetchCfData,
  onFetchLcData,
  isFirebaseSetup
}: IntegrationsProps) {
  const [cfHandle, setCfHandle] = useState(settings.codeforcesHandle);
  const [lcHandle, setLcHandle] = useState(settings.leetcodeHandle);
  const [vsCodeSync, setVsCodeSync] = useState(settings.vsCodeSyncActive);

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      codeforcesHandle: cfHandle,
      leetcodeHandle: lcHandle,
      vsCodeSyncActive: vsCodeSync
    });

    if (cfHandle.trim()) onFetchCfData(cfHandle.trim());
    if (lcHandle.trim()) onFetchLcData(lcHandle.trim());
  };

  const handleFetchStats = () => {
    if (cfHandle.trim()) onFetchCfData(cfHandle.trim());
    if (lcHandle.trim()) onFetchLcData(lcHandle.trim());
  };

  return (
    <div className="space-y-6" id="integrations-root">
      
      {/* Intro */}
      <div>
        <h2 className="text-lg font-bold font-display uppercase tracking-[0.12em] text-cyan-400">Competitive Profiles & Cloud Storage</h2>
        <p className="text-slate-400 text-xs text-balance">Maintain your platform handles to fetch direct problem counts and verify secure cloud synchronization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="integrations-grid">
        
        {/* Settings forms (Cols 5) */}
        <div className="lg:col-span-5 bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Profile Adjustments</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {/* Codeforces Handle */}
            <div className="space-y-1">
              <label className="text-slate-400 block font-semibold">Codeforces Handle</label>
              <input 
                type="text" 
                className="w-full bg-[#050508] border border-slate-800 rounded p-2.5 text-slate-205 focus:outline-none focus:border-cyan-500 text-slate-200 transition duration-155"
                value={cfHandle}
                placeholder="e.g., tourist, MikeMirzayanov"
                onChange={(e) => setCfHandle(e.target.value)}
              />
            </div>

            {/* LeetCode Handle */}
            <div className="space-y-1">
              <label className="text-slate-400 block font-semibold">LeetCode Handle</label>
              <input 
                type="text" 
                className="w-full bg-[#050508] border border-slate-800 rounded p-2.5 text-slate-205 focus:outline-none focus:border-cyan-500 text-slate-200 transition duration-155"
                value={lcHandle}
                placeholder="e.g., soham, neal_wu"
                onChange={(e) => setLcHandle(e.target.value)}
              />
            </div>

            {/* VS Code active observer sync toggle */}
            <div className="flex items-center justify-between p-3 bg-[#121319] rounded border border-slate-800/60 self-center">
              <div>
                <span className="font-semibold text-slate-300 block">VS Code Real-Time telemetry</span>
                <span className="text-[10px] text-slate-500 text-balance block">Streams active folder structures.</span>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 text-cyan-400 border-slate-800 rounded focus:ring-cyan-500 accent-cyan-500 cursor-pointer"
                checked={vsCodeSync}
                onChange={(e) => setVsCodeSync(e.target.checked)}
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button 
              onClick={handleFetchStats}
              disabled={cfLoading || lcLoading}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-850 text-slate-300 font-bold px-4 py-2 rounded text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${(cfLoading || lcLoading) ? "animate-spin" : ""}`} />
              <span>Fetch Stats</span>
            </button>
            <button 
              onClick={handleSaveSettings}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider px-4 py-2 rounded flex-1 text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Sync Handles</span>
            </button>
          </div>
        </div>

        {/* Live profile responses (Cols 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cloud Storage Synchronize parameter info */}
          <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
              <Cloud className="w-4.5 h-4.5 text-cyan-400" />
              <span>Multi-Device Cloud Backup Sync</span>
            </h3>

            {isFirebaseSetup ? (
              <div className="bg-cyan-500/[0.04] border border-cyan-500/20 text-cyan-300 p-4 rounded flex items-start space-x-3 text-xs leading-relaxed">
                <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Cloud Server Connected</p>
                  <p className="text-slate-400">
                    Your 30-day master journal and focus timeline are being backed up securely in real-time onto Cloud Firestore. Changes on any laptop or phone under your session ID sync immediately!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/[0.04] border border-amber-500/15 text-amber-500 p-4 rounded flex items-start space-x-3 text-xs leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Offline-First Local Storage Active</p>
                  <p className="text-slate-400">
                    We are saving all plan additions, checklists, and minutes studied inside local browser variables. To activate instant cross-device database backup, complete the Firebase setup step in the AI Studio editor frame!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Codeforces detailed stats block */}
          {cfStats && (
            <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <h4 className="font-bold text-sm flex items-center space-x-1.5 font-mono text-cyan-400">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span>Codeforces Handle Rank: {cfStats.rank}</span>
                </h4>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 rounded font-mono font-bold">
                  Rating: {cfStats.rating}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Latest Solved Problem Streams</p>
                {cfStats.lastSubmissions && cfStats.lastSubmissions.length > 0 ? (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {cfStats.lastSubmissions.slice(0, 5).map((sub, i) => (
                      <div key={sub.id || i} className="bg-[#050508]/80 p-2.5 rounded border border-slate-850/70 flex items-center justify-between text-[11px] font-mono">
                        <div className="truncate flex-1 pr-4">
                          <span className="text-slate-600 pr-1.5 select-none">#{sub.contestId || "1000"}{sub.problem?.index}</span>
                          <span className="text-slate-300 font-medium">{sub.problem?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          {sub.problem?.rating && (
                            <span className="bg-[#040406] border border-slate-800 px-1.5 py-0.2 rounded text-[10px] text-amber-400 font-bold">
                              ★ {sub.problem.rating}
                            </span>
                          )}
                          <span className={`${sub.verdict === "OK" ? "text-cyan-400 font-bold" : "text-rose-500"}`}>
                            {sub.verdict === "OK" ? "AC" : "WA"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No submissions indexed in feed.</p>
                )}
              </div>
            </div>
          )}

          {/* Leetcode detailed status block */}
          {lcStats && (
            <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <h4 className="font-bold text-sm flex items-center space-x-1.5 font-mono text-cyan-400">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>LeetCode Handle: {lcStats.username}</span>
                </h4>
                {lcStats.ranking && (
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 rounded font-mono font-bold">
                    Rank: #{lcStats.ranking}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#050508]/70 p-4 rounded border border-slate-850 flex flex-col justify-center text-center">
                  <span className="text-2xl font-black text-cyan-400 font-mono block tracking-tight">{lcStats.totalSolved}</span>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 mt-1 block font-bold">Total Solved</span>
                </div>
                
                <div className="bg-[#050508]/70 p-4 rounded border border-slate-850 space-y-1.5 text-xs font-mono self-center">
                  <div className="flex justify-between">
                    <span className="text-cyan-400 font-bold">Easy:</span>
                    <span className="text-slate-350">{lcStats.solvedByDifficulty.Easy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-500 font-bold">Medium:</span>
                    <span className="text-slate-350">{lcStats.solvedByDifficulty.Medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-500 font-bold">Hard:</span>
                    <span className="text-slate-350">{lcStats.solvedByDifficulty.Hard}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
