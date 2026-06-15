import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckSquare, Square, Edit2, Check, HelpCircle, AlertCircle, Plus, BookOpen, Layers } from "lucide-react";
import { PlanDay } from "../types";

interface ScheduleProps {
  days: PlanDay[];
  onUpdateDay: (updatedDay: PlanDay, autoLogMinutes?: number, blockTypeForLogging?: string) => void;
  onAddDay: () => void;
}

export default function Schedule({ days, onUpdateDay, onAddDay }: ScheduleProps) {
  const [expandedDayId, setExpandedDayId] = useState<string | null>("day_1");
  const [editingDayId, setEditingDayId] = useState<string | null>(null);

  // Temporary edit state
  const [editState, setEditState] = useState<Partial<PlanDay>>({});

  const handleToggleExpand = (id: string) => {
    setExpandedDayId(expandedDayId === id ? null : id);
  };

  const handleStartEdit = (day: PlanDay) => {
    setEditingDayId(day.id);
    setEditState({ ...day });
  };

  const handleSaveEdit = (originalDay: PlanDay) => {
    if (editingDayId) {
      onUpdateDay({ ...originalDay, ...editState });
      setEditingDayId(null);
      setEditState({});
    }
  };

  const handleCancelEdit = () => {
    setEditingDayId(null);
    setEditState({});
  };

  const handleBlockToggle = (day: PlanDay, blockNum: 1 | 2 | 3 | 4 | 5, currentValue: boolean) => {
    const updated = { ...day };
    let loggedMinutes = 0;
    let blockType = "";

    // Calculate typical block hours provided by the user's fixed daily time structure:
    // Block 1 (3h) -> DSA Concepts
    // Block 2 (3h) -> DSA Problems
    // Block 3 (2h) -> Codeforces / Upsolve
    // Block 4 (2h) -> ML Theory
    // Block 5 (2h) -> ML Implementation / Project
    if (blockNum === 1) {
      updated.block1_completed = !currentValue;
      loggedMinutes = 180; // 3 hours
      blockType = "DSA Concepts";
    } else if (blockNum === 2) {
      updated.block2_completed = !currentValue;
      loggedMinutes = 180; // 3 hours
      blockType = "DSA Problems";
    } else if (blockNum === 3) {
      updated.block3_completed = !currentValue;
      loggedMinutes = 120; // 2 hours
      blockType = "Codeforces/Upsolve";
    } else if (blockNum === 4) {
      updated.block4_completed = !currentValue;
      loggedMinutes = 120; // 2 hours
      blockType = "ML Theory";
    } else if (blockNum === 5) {
      updated.block5_completed = !currentValue;
      loggedMinutes = 120; // 2 hours
      blockType = "ML Implementation/Project";
    }

    // Auto calculate if the overall day is now fully completed
    const allCompleted = 
      updated.block1_completed && 
      updated.block2_completed && 
      updated.block3_completed && 
      updated.block4_completed && 
      updated.block5_completed;
    
    updated.completed = allCompleted;
    if (allCompleted) {
      updated.isBacklog = false; // completed days automatically drop backlog status
    }

    // Pass the update to parent. If block status turns completed (true), we offer to auto-log study minutes!
    onUpdateDay(updated, !currentValue ? loggedMinutes : undefined, !currentValue ? blockType : undefined);
  };

  const handleManualBacklogToggle = (day: PlanDay) => {
    onUpdateDay({
      ...day,
      isBacklog: !day.isBacklog
    });
  };

  return (
    <div className="space-y-6" id="schedule-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold font-display uppercase tracking-[0.15em] text-cyan-400 flex items-center space-x-2">
            <span>30-Day Training Curriculum</span>
            <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/35 text-cyan-400 px-2 py-0.5 rounded font-mono">
              CURRICULUM_V2
            </span>
          </h2>
          <p className="text-slate-400 text-xs">Each session is structured into 12-hour high-intensity blocks. Click rows to view resources & log status.</p>
        </div>
        <button 
          onClick={onAddDay}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider px-4 py-2 rounded text-xs transition flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.25)] cursor-pointer"
        >
          <Plus className="w-4 h-4 font-extrabold" />
          <span>Add Custom Camp Day</span>
        </button>
      </div>

      <div className="space-y-3" id="days-list">
        {days.map((day) => {
          const isExpanded = expandedDayId === day.id;
          const isEditing = editingDayId === day.id;

          // Compute sub-tasks completed count
          const completedCount = 
            (day.block1_completed ? 1 : 0) +
            (day.block2_completed ? 1 : 0) +
            (day.block3_completed ? 1 : 0) +
            (day.block4_completed ? 1 : 0) +
            (day.block5_completed ? 1 : 0);

          return (
            <div 
              key={day.id} 
              className={`rounded-xl border transition-all duration-300 ${
                day.completed 
                  ? "bg-cyan-500/[0.03] border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.03)]" 
                  : day.isBacklog 
                    ? "bg-amber-500/[0.04] border-amber-500/35 border-l-4 border-l-amber-500" 
                    : "bg-[#0d0e14] border-slate-800/60 shadow-lg"
              }`}
              id={`day-card-${day.dayNumber}`}
            >
              {/* Header block click */}
              <div 
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => handleToggleExpand(day.id)}
              >
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className={`p-2.5 rounded-lg font-mono font-bold text-xs h-9 w-9 flex items-center justify-center shrink-0 ${
                    day.completed 
                      ? "bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]" 
                      : day.isBacklog 
                        ? "bg-amber-500/10 border border-amber-500/40 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.1)]" 
                        : "bg-[#161720] border border-slate-800 text-slate-400"
                  }`}>
                    D{day.dayNumber}
                  </div>
                  <div className="space-y-0.5 truncate flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-100">
                        {isEditing ? `Configure Day ${day.dayNumber}` : day.block1_DSA_Concept}
                      </h4>
                      {day.isBacklog && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                          Backlog Alert
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs truncate">
                      {day.block4_ML_Theory}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto space-x-4 shrink-0 border-t sm:border-0 pt-3 sm:pt-0 border-slate-800/60">
                  <div className="text-xs text-slate-400 font-mono flex items-center space-x-1.5 bg-[#161720]/70 px-2 py-1 rounded border border-slate-800/60">
                    <span className="text-cyan-400 font-bold">{completedCount}/5</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Blocks</span>
                  </div>

                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    {/* Backlog Manual Toggle */}
                    <button 
                      onClick={() => handleManualBacklogToggle(day)}
                      title={day.isBacklog ? "Mark as normal" : "Mark as backlog"}
                      className={`p-1.5 rounded border transition ${
                        day.isBacklog 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]" 
                          : "bg-[#161720] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>

                    {/* Edit button */}
                    {isEditing ? (
                      <button 
                        onClick={() => handleSaveEdit(day)}
                        className="bg-cyan-500 text-slate-950 p-1.5 rounded hover:bg-cyan-400 transition shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStartEdit(day)}
                        className="bg-[#161720] hover:bg-slate-800 border border-slate-800 text-cyan-400 p-1.5 rounded transition hover:border-cyan-500/30"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>
              </div>

              {/* Day Expandable Blocks */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-800/60 bg-[#08080c]/40 space-y-5">
                  {isEditing ? (
                    /* EDIT MODE DATA INPUTS */
                    <div className="space-y-4 text-xs font-mono" id={`edit-day-${day.dayNumber}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Block 1: DSA Topic</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.block1_DSA_Concept || ""}
                            onChange={(e) => setEditState({ ...editState, block1_DSA_Concept: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Block 2: DSA Problem Scope</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.block2_DSA_Problems || ""}
                            onChange={(e) => setEditState({ ...editState, block2_DSA_Problems: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Block 3: Codeforces Upsolve</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.block3_CF_Upsolve || ""}
                            onChange={(e) => setEditState({ ...editState, block3_CF_Upsolve: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Block 4: ML Theory Topic</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.block4_ML_Theory || ""}
                            onChange={(e) => setEditState({ ...editState, block4_ML_Theory: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Block 5: ML Code Implementation/Project</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.block5_ML_Project || ""}
                            onChange={(e) => setEditState({ ...editState, block5_ML_Project: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Resource Links / Books</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.resources || ""}
                            placeholder="Add links, papers, books..."
                            onChange={(e) => setEditState({ ...editState, resources: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Practice Problems List (one per line)</label>
                          <textarea 
                            rows={3}
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.problemsList || ""}
                            placeholder="LeetCode 303...\nCodeforces 1800A..."
                            onChange={(e) => setEditState({ ...editState, problemsList: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">ML Projects Ideas & Milestones</label>
                          <textarea 
                            rows={3}
                            className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                            value={editState.projectsList || ""}
                            placeholder="Implement Stochastic Gradient descent with mini-batches..."
                            onChange={(e) => setEditState({ ...editState, projectsList: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Personal Study Notes / Journal</label>
                        <textarea 
                          rows={2}
                          className="w-full bg-[#161720] border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-cyan-500 transition duration-150"
                          value={editState.notes || ""}
                          placeholder="What did you learn today? What stumped you?"
                          onChange={(e) => setEditState({ ...editState, notes: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button 
                          onClick={handleCancelEdit}
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded text-xs tracking-wider uppercase font-bold"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(day)}
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded text-xs tracking-wider uppercase shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL VIEW ACTIVE MODE & TASKS CHECK */
                    <div className="space-y-5">
                      {/* Interactive block checklist */}
                      <div>
                        <h5 className="text-[10px] uppercase tracking-[0.1em] font-mono text-slate-500 font-bold mb-3">Fixed Time Blocks (Check to complete & log focus hours)</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5" id={`blocks-list-day-${day.dayNumber}`}>
                          {/* Block 1 */}
                          <div 
                            onClick={() => handleBlockToggle(day, 1, day.block1_completed)}
                            className={`p-4 rounded-xl border cursor-pointer transition duration-200 select-none flex flex-col justify-between h-28 ${
                              day.block1_completed 
                                ? "bg-cyan-950/20 border-cyan-500/40 text-slate-100 shadow-[0_0_12px_rgba(34,211,238,0.04)]" 
                                : "bg-[#161720]/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#161720]"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Block 1 • 3 Hours</span>
                              {day.block1_completed ? <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                            </div>
                            <p className="text-xs font-bold leading-relaxed line-clamp-2 text-slate-200">
                              {day.block1_DSA_Concept}
                            </p>
                            <span className="text-[9px] text-cyan-400 font-mono font-bold uppercase tracking-widest">DSA Theory</span>
                          </div>

                          {/* Block 2 */}
                          <div 
                            onClick={() => handleBlockToggle(day, 2, day.block2_completed)}
                            className={`p-4 rounded-xl border cursor-pointer transition duration-200 select-none flex flex-col justify-between h-28 ${
                              day.block2_completed 
                                ? "bg-blue-950/20 border-blue-500/40 text-slate-100 shadow-[0_0_12px_rgba(59,130,246,0.04)]" 
                                : "bg-[#161720]/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#161720]"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Block 2 • 3 Hours</span>
                              {day.block2_completed ? <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                            </div>
                            <p className="text-xs font-bold leading-relaxed line-clamp-2 text-slate-200">
                              {day.block2_DSA_Problems}
                            </p>
                            <span className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-widest">DSA Practice</span>
                          </div>

                          {/* Block 3 */}
                          <div 
                            onClick={() => handleBlockToggle(day, 3, day.block3_completed)}
                            className={`p-4 rounded-xl border cursor-pointer transition duration-200 select-none flex flex-col justify-between h-28 ${
                              day.block3_completed 
                                ? "bg-amber-955/20 border-amber-500/40 text-slate-100 shadow-[0_0_12px_rgba(245,158,11,0.04)]" 
                                : "bg-[#161720]/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#161720]"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Block 3 • 2 Hours</span>
                              {day.block3_completed ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                            </div>
                            <p className="text-xs font-bold leading-relaxed line-clamp-2 text-slate-200">
                              {day.block3_CF_Upsolve}
                            </p>
                            <span className="text-[9px] text-amber-500 font-mono font-bold uppercase tracking-widest font-bold">Codeforces</span>
                          </div>

                          {/* Block 4 */}
                          <div 
                            onClick={() => handleBlockToggle(day, 4, day.block4_completed)}
                            className={`p-4 rounded-xl border cursor-pointer transition duration-200 select-none flex flex-col justify-between h-28 ${
                              day.block4_completed 
                                ? "bg-pink-950/20 border-pink-500/40 text-slate-100 shadow-[0_0_12px_rgba(236,72,153,0.04)]" 
                                : "bg-[#161720]/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#161720]"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Block 4 • 2 Hours</span>
                              {day.block4_completed ? <CheckSquare className="w-4 h-4 text-pink-400 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                            </div>
                            <p className="text-xs font-bold leading-relaxed line-clamp-2 text-slate-200">
                              {day.block4_ML_Theory}
                            </p>
                            <span className="text-[9px] text-pink-400 font-mono font-bold uppercase tracking-widest font-bold">ML Theory</span>
                          </div>

                          {/* Block 5 */}
                          <div 
                            onClick={() => handleBlockToggle(day, 5, day.block5_completed)}
                            className={`p-4 rounded-xl border cursor-pointer transition duration-200 select-none flex flex-col justify-between h-28 ${
                              day.block5_completed 
                                ? "bg-purple-950/20 border-purple-500/40 text-slate-100 shadow-[0_0_12px_rgba(139,92,246,0.04)]" 
                                : "bg-[#161720]/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#161720]"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Block 5 • 2 Hours</span>
                              {day.block5_completed ? <CheckSquare className="w-4 h-4 text-purple-450 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                            </div>
                            <p className="text-xs font-bold leading-relaxed line-clamp-2 text-slate-200">
                              {day.block5_ML_Project}
                            </p>
                            <span className="text-[9px] text-purple-400 font-mono font-bold uppercase tracking-widest font-bold">ML Practice</span>
                          </div>
                        </div>
                      </div>

                      {/* Section for references, problem codes, and projects ideas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#0a0b10] p-4 rounded-xl border border-slate-850 shadow-sm">
                        {/* Resources */}
                        <div className="space-y-1.5 p-2">
                          <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase flex items-center space-x-1.5 tracking-wider">
                            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Resources & Study Guides</span>
                          </span>
                          <p className="text-xs text-slate-400 leading-relaxed italic">
                            {day.resources || "No custom resource links declared. Click edit icon to register study guides."}
                          </p>
                        </div>

                        {/* Problems */}
                        <div className="space-y-1.5 p-2">
                          <span className="text-[10px] font-bold font-mono text-blue-400 uppercase flex items-center space-x-1.5 tracking-wider">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>Practice Problems list</span>
                          </span>
                          {day.problemsList ? (
                            <div className="text-xs text-slate-300 font-mono space-y-1 bg-[#161720] p-2.5 rounded border border-slate-800 max-h-24 overflow-y-auto no-scrollbar">
                              {day.problemsList.split('\n').map((prob, pi) => (
                                <div key={pi} className="flex items-center space-x-2">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                  <span>{prob}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No custom problems registered yet.</p>
                          )}
                        </div>

                        {/* Projects / Milestones */}
                        <div className="space-y-1.5 p-2">
                          <span className="text-[10px] font-bold font-mono text-purple-400 uppercase flex items-center space-x-1.5 tracking-wider">
                            <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>ML Projects Milestones</span>
                          </span>
                          {day.projectsList ? (
                            <div className="text-xs text-slate-300 font-mono space-y-1 bg-[#161720] p-2.5 rounded border border-slate-800 max-h-24 overflow-y-auto no-scrollbar">
                              {day.projectsList.split('\n').map((proj, pj) => (
                                <div key={pj} className="flex items-center space-x-2">
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" />
                                  <span>{proj}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No custom project details defined.</p>
                          )}
                        </div>
                      </div>

                      {/* Notes journal entry */}
                      {day.notes && (
                        <div className="bg-indigo-500/5 border-l-2 border-indigo-500 p-3.5 rounded-r-xl">
                          <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-400 block">Performance Journal Entry</span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-1">
                            {day.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
