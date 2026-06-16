import React, { useState, useEffect } from "react";
import {
  Code,
  BookOpen,
  Save,
  RefreshCw,
  Key,
  Cloud,
  ShieldAlert,
  Cpu,
  Check
} from "lucide-react";

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

  // 🔥 Local state
  const [cfHandle, setCfHandle] = useState("");
  const [lcHandle, setLcHandle] = useState("");
  const [vsCodeSync, setVsCodeSync] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ✅ IMPORTANT: Sync state with props (fixes cross-device + firebase restore)
  useEffect(() => {
    setCfHandle(settings.codeforcesHandle || "");
    setLcHandle(settings.leetcodeHandle || "");
    setVsCodeSync(settings.vsCodeSyncActive || false);
  }, [settings]);

  // 🔥 Save Settings
  const handleSaveSettings = () => {
    setError(null);

    try {
      const updatedSettings: UserSettings = {
        ...settings,
        codeforcesHandle: cfHandle.trim(),
        leetcodeHandle: lcHandle.trim(),
        vsCodeSyncActive: vsCodeSync
      };

      onUpdateSettings(updatedSettings);

      // Auto-fetch after save
      if (cfHandle.trim()) onFetchCfData(cfHandle.trim());
      if (lcHandle.trim()) onFetchLcData(lcHandle.trim());

    } catch (err) {
      setError("Failed to save settings");
      console.error(err);
    }
  };

  // 🔥 Manual Fetch
  const handleFetchStats = () => {
    setError(null);

    if (!cfHandle.trim() && !lcHandle.trim()) {
      setError("Enter at least one handle");
      return;
    }

    try {
      if (cfHandle.trim() && !cfLoading) {
        onFetchCfData(cfHandle.trim());
      }

      if (lcHandle.trim() && !lcLoading) {
        onFetchLcData(lcHandle.trim());
      }
    } catch (err) {
      setError("Fetch failed");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" id="integrations-root">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold font-display uppercase tracking-[0.12em] text-cyan-400">
          Competitive Profiles & Cloud
        </h2>
        <p className="text-slate-400 text-xs">
          Sync Codeforces, LeetCode & Firebase across devices
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT PANEL */}
        <div className="lg:col-span-5 space-y-4">

          {/* Codeforces */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Code size={16} />
              <span className="text-sm font-semibold">Codeforces</span>
            </div>

            <input
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              placeholder="Enter handle"
              className="w-full p-2 bg-slate-800 rounded text-sm outline-none"
            />
          </div>

          {/* LeetCode */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} />
              <span className="text-sm font-semibold">LeetCode</span>
            </div>

            <input
              value={lcHandle}
              onChange={(e) => setLcHandle(e.target.value)}
              placeholder="Enter username"
              className="w-full p-2 bg-slate-800 rounded text-sm outline-none"
            />
          </div>

          {/* VS Code Sync */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Cpu size={16} /> VS Code Sync
            </span>

            <button
              onClick={() => setVsCodeSync(!vsCodeSync)}
              className={`px-3 py-1 rounded text-xs ${
                vsCodeSync ? "bg-green-500" : "bg-slate-700"
              }`}
            >
              {vsCodeSync ? "ON" : "OFF"}
            </button>
          </div>

          {/* Firebase Status */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Cloud size={16} /> Firebase
            </span>

            <span
              className={`text-xs px-2 py-1 rounded ${
                isFirebaseSetup ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {isFirebaseSetup ? "Connected" : "Not Setup"}
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveSettings}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 p-2 rounded text-sm flex items-center justify-center gap-2"
            >
              <Save size={14} /> Save
            </button>

            <button
              onClick={handleFetchStats}
              className="flex-1 bg-purple-500 hover:bg-purple-600 p-2 rounded text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Fetch
            </button>
          </div>
        </div>

        {/* RIGHT PANEL (STATS) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Codeforces Stats */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 className="text-sm mb-2">Codeforces Stats</h3>

            {cfLoading ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : cfStats ? (
              <div className="text-xs space-y-1">
                <p>Rating: {cfStats.rating}</p>
                <p>Rank: {cfStats.rank}</p>
                <p>Problems Solved: {cfStats.solved}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No data</p>
            )}
          </div>

          {/* LeetCode Stats */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 className="text-sm mb-2">LeetCode Stats</h3>

            {lcLoading ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : lcStats ? (
              <div className="text-xs space-y-1">
                <p>Total Solved: {lcStats.totalSolved}</p>
                <p>Easy: {lcStats.easy}</p>
                <p>Medium: {lcStats.medium}</p>
                <p>Hard: {lcStats.hard}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No data</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
