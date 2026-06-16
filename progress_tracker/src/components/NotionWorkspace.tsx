import React, { useState } from "react";
import { 
  FileText, 
  Columns, 
  Calendar as CalendarIcon, 
  Table as TableIcon, 
  ChevronRight, 
  Check, 
  Edit2, 
  Folder, 
  ArrowRight, 
  Clock, 
  Flame, 
  Layers, 
  RefreshCw, 
  Sparkles 
} from "lucide-react";
import { PlanDay } from "../types";

interface NotionWorkspaceProps {
  days: PlanDay[];
  onUpdateDay: (updatedDay: PlanDay, autoLogMinutes?: number, blockTypeForLogging?: string) => void;
  startDate?: string;
  onUpdateStartDate: (date: string) => void;
  onResetProgress: () => void;
}

export default function NotionWorkspace({ days, onUpdateDay, startDate, onUpdateStartDate, onResetProgress }: NotionWorkspaceProps) {
  // Page states: "daily" | "weekly" | "monthly"
  const [activePage, setActivePage] = useState<"daily" | "weekly" | "monthly">("daily");
  
  // Tab states for Daily View: "list" | "table" | "kanban" | "calendar"
  const [activeDailyView, setActiveDailyView] = useState<"list" | "table" | "kanban" | "calendar">("list");
  
  // Kanban active selection: which day's blocks are we looking at?
  const [kanbanSelectedDayNum, setKanbanSelectedDayNum] = useState<number>(1);
  
  // Inline edit state
  const [inlineEditingCell, setInlineEditingCell] = useState<{ dayId: string, field: string } | null>(null);
  const [inlineEditText, setInlineEditText] = useState("");

  // In progress block tracking for Kanban columns
  const [blockProgressState, setBlockProgressState] = useState<{ [key: string]: "todo" | "doing" | "done" }>({});

  // Helper: Get actual status of a block
  const getBlockKanbanColumn = (day: PlanDay, blockNum: 1 | 2 | 3 | 4 | 5) => {
    const key = `${day.id}_block_${blockNum}`;
    
    // Determine completed status
    let completed = false;
    if (blockNum === 1) completed = day.block1_completed;
    else if (blockNum === 2) completed = day.block2_completed;
    else if (blockNum === 3) completed = day.block3_completed;
    else if (blockNum === 4) completed = day.block4_completed;
    else if (blockNum === 5) completed = day.block5_completed;

    if (completed) return "done";
    return blockProgressState[key] || "todo";
  };

  // Move a block in kanban
  const handleMoveKanbanBlock = (dayNum: number, blockNum: 1 | 2 | 3 | 4 | 5, targetColumn: "todo" | "doing" | "done") => {
    const day = days.find(d => d.dayNumber === dayNum);
    if (!day) return;

    const key = `${day.id}_block_${blockNum}`;
    
    if (targetColumn === "done") {
      // Toggle block to complete
      const updated = { ...day };
      let loggedMinutes = 0;
      let blockType = "";

      if (blockNum === 1) { updated.block1_completed = true; loggedMinutes = 180; blockType = "DSA Concepts"; }
      else if (blockNum === 2) { updated.block2_completed = true; loggedMinutes = 180; blockType = "DSA Problems"; }
      else if (blockNum === 3) { updated.block3_completed = true; loggedMinutes = 120; blockType = "Codeforces/Upsolve"; }
      else if (blockNum === 4) { updated.block4_completed = true; loggedMinutes = 120; blockType = "ML Theory"; }
      else if (blockNum === 5) { updated.block5_completed = true; loggedMinutes = 120; blockType = "ML Implementation/Project"; }

      const allDone = 
        updated.block1_completed && 
        updated.block2_completed && 
        updated.block3_completed && 
        updated.block4_completed && 
        updated.block5_completed;

      updated.completed = allDone;
      if (allDone) updated.isBacklog = false;

      setBlockProgressState(prev => ({ ...prev, [key]: "done" }));
      onUpdateDay(updated, loggedMinutes, blockType);
    } else {
      // Move to todo or doing
      const updated = { ...day };
      
      // if it was done previously, toggle open status
      if (blockNum === 1) updated.block1_completed = false;
      else if (blockNum === 2) updated.block2_completed = false;
      else if (blockNum === 3) updated.block3_completed = false;
      else if (blockNum === 4) updated.block4_completed = false;
      else if (blockNum === 5) updated.block5_completed = false;
      
      updated.completed = false;

      setBlockProgressState(prev => ({ ...prev, [key]: targetColumn }));
      onUpdateDay(updated);
    }
  };

  // Drag and drop HTML5 handlers for kanban cards
  const handleDragStart = (e: React.DragEvent, blockNum: number) => {
    e.dataTransfer.setData("text/plain", blockNum.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumn: "todo" | "doing" | "done") => {
    e.preventDefault();
    const blockNumStr = e.dataTransfer.getData("text/plain");
    const blockNum = parseInt(blockNumStr);
    if (blockNum >= 1 && blockNum <= 5) {
      handleMoveKanbanBlock(kanbanSelectedDayNum, blockNum as 1 | 2 | 3 | 4 | 5, targetColumn);
    }
  };

  // Inline editing saving handler
  const handleSaveInlineEdit = (dayId: string, field: string) => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;

    const updated = {
      ...day,
      [field]: inlineEditText
    };
    onUpdateDay(updated);
    setInlineEditingCell(null);
  };

  const handleTriggerInlineEdit = (dayId: string, field: string, val: string) => {
    setInlineEditingCell({ dayId, field });
    setInlineEditText(val);
  };

  // Smart Adaptive Plan Trigger
  const [adapting, setAdapting] = useState(false);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState("");

  const handleTriggerAdaptiveOptimization = async () => {
    setAdapting(true);
    setAdaptiveFeedback("AI is analyzing recent metrics and training streak indices...");
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planState: days.map(d => ({ day: d.dayNumber, completed: d.completed, isBacklog: d.isBacklog })),
          sessions: [],
          settings: { userId: "local_temp", codeforcesHandle: "sohamjace06" }
        })
      });

      if (response.ok) {
        const audit = await response.json();
        const score = audit.productivityScore || 80;
        
        let difficultyShift = "";
        let shiftDesc = "";

        if (score < 55) {
          difficultyShift = "REDUCING COGNITIVE LOAD";
          shiftDesc = "We detected minor backlogs on algorithms and ML. Adjusting upcoming CF contest ELO target to 1100 and reducing proof complexity.";
          
          // Modify next uncompleted day tasks to be easier
          const nextUncompleted = days.find(d => !d.completed);
          if (nextUncompleted) {
            const adjusted = {
              ...nextUncompleted,
              block1_DSA_Concept: "Slower Pace: Arrays prefix sum review and basic two-pointer layout",
              block2_DSA_Problems: "Solve 2 Easy problems on ranges",
              block3_CF_Upsolve: "Practice rating band 1000",
              block4_ML_Theory: "Derive simple 2D linear matrices scratch plots",
              block5_ML_Project: "Visualize fits inside simple plots"
            };
            onUpdateDay(adjusted);
          }
        } else {
          difficultyShift = "INCREASING INTELLECTUAL LOAD";
          shiftDesc = "Consistent streak detected! Scaling up tree recursion and adding advanced transformer parameters.";
          
          const nextUncompleted = days.find(d => !d.completed);
          if (nextUncompleted) {
            const adjusted = {
              ...nextUncompleted,
              block1_DSA_Concept: "Elite: Graph DFS recursion, tree heights optimization algorithms",
              block2_DSA_Problems: "Solve 4 Medium-Hard graph problems",
              block3_CF_Upsolve: "Upsolve rating band 1500-1700 problems",
              block4_ML_Theory: "Analyze multi-head transformer positional embeddings from scratch",
              block5_ML_Project: "Code self-attention serializer weights in custom NumPy arrays"
            };
            onUpdateDay(adjusted);
          }
        }
        
        setAdaptiveFeedback(`[ADAPTIVE AI ENGINE: ${difficultyShift}] ${shiftDesc}`);
      } else {
        throw new Error("API failed");
      }
    } catch (e) {
      // Offline fallback adaptive optimization logic
      const uncompletedCount = days.filter(d => !d.completed).length;
      if (uncompletedCount > 15) {
        setAdaptiveFeedback("[ADAPTIVE AI ENGINE: REDUCING LOAD] High backlog weight. Lowering upsolve ELO to 1100.");
        const nextUncompleted = days.find(d => !d.completed);
        if (nextUncompleted) {
          onUpdateDay({
            ...nextUncompleted,
            block1_DSA_Concept: "Warmup: Two-Pointer sliding windows basics",
            block2_DSA_Problems: "Practice LC 209 (Sliding Window)",
            block3_CF_Upsolve: "Upsolve 900-1100 ELO",
            block4_ML_Theory: "Check simple L1 shrinkage limits",
            block5_ML_Project: "Plot lines in Jupyter code"
          });
        }
      } else {
        setAdaptiveFeedback("[ADAPTIVE AI ENGINE: SCALING DEPTH] Elite consistency detected! Pushing graph target ELO to 1500.");
        const nextUncompleted = days.find(d => !d.completed);
        if (nextUncompleted) {
          onUpdateDay({
            ...nextUncompleted,
            block1_DSA_Concept: "Elite: Tree DSU recursive paths",
            block2_DSA_Problems: "Verify LC 124 Binary Tree Max Path",
            block3_CF_Upsolve: "Upsolve 1500 ELO graphs",
            block4_ML_Theory: "Trace Adam Optimizer learning momentum",
            block5_ML_Project: "Build Adam optimizer scratch logic"
          });
        }
      }
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="space-y-6" id="notion-workspace-root">
      
      {/* Notion Navigation Header HUD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4" id="notion-nested-header">
        {/* Breadcrumb navigator */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <Folder className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-500 hover:text-slate-300 transition cursor-pointer">Workspace Pages</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-650" />
          <span className="text-white uppercase font-bold tracking-wider">
            {activePage === "daily" ? `Daily Tasks - ${activeDailyView.toUpperCase()}` : `${activePage.toUpperCase()} MILESTONES`}
          </span>
        </div>

        {/* Page Selector (Pages inside Pages) */}
        <div className="flex bg-[#12131b] border border-slate-800 p-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider gap-0.5">
          <button 
            onClick={() => setActivePage("daily")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${activePage === "daily" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15" : "text-slate-450 hover:text-slate-200"}`}
          >
            Daily Workspace
          </button>
          <button 
            onClick={() => setActivePage("weekly")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${activePage === "weekly" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15" : "text-slate-450 hover:text-slate-200"}`}
          >
            Weekly Milestones
          </button>
          <button 
            onClick={() => setActivePage("monthly")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${activePage === "monthly" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15" : "text-slate-450 hover:text-slate-200"}`}
          >
            Monthly Roadmap
          </button>
        </div>
      </div>

      {/* Daily Workspace Content */}
      {activePage === "daily" && (
        <div className="space-y-5">
          
          {/* Subview View Selector (Table, Kanban, Calendar, List) */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#11121d]/40 p-3 rounded-2xl border border-slate-850">
            <div className="flex flex-wrap text-xs gap-1 opacity-90">
              <button 
                onClick={() => setActiveDailyView("list")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer font-bold uppercase font-mono ${activeDailyView === "list" ? "bg-[#1f2033] text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notion List</span>
              </button>
              <button 
                onClick={() => setActiveDailyView("table")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer font-bold uppercase font-mono ${activeDailyView === "table" ? "bg-[#1f2033] text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"}`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table Grid</span>
              </button>
              <button 
                onClick={() => setActiveDailyView("kanban")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer font-bold uppercase font-mono ${activeDailyView === "kanban" ? "bg-[#1f2033] text-cyan-400 border border-cyan-500/20 shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </button>
              <button 
                onClick={() => setActiveDailyView("calendar")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer font-bold uppercase font-mono ${activeDailyView === "calendar" ? "bg-[#1f2033] text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar Month</span>
              </button>
            </div>

            {/* Smart Adaptive AI Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              <button 
                onClick={handleTriggerAdaptiveOptimization}
                disabled={adapting}
                className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs px-3.5 py-1.5 rounded-lg font-bold uppercase font-mono flex items-center space-x-1.5 transition cursor-pointer"
              >
                {adapting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Engaging AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>AI Adaptive Adjust</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Adaptive Engine Feedback line */}
          {adaptiveFeedback && (
            <div className="bg-[#1a1b2e]/60 border border-indigo-500/20 p-3 rounded-lg text-xs leading-relaxed text-indigo-300 font-mono">
              {adaptiveFeedback}
            </div>
          )}

          {/* Core Daily Views */}
          
          {/* 1. TABLE GRID VIEW (Edit anything anywhere) */}
          {activeDailyView === "table" && (
            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#090b10] no-scrollbar">
              <table className="w-full text-left border-collapse text-xs select-text">
                <thead>
                  <tr className="bg-slate-950 text-slate-450 uppercase font-mono tracking-wider border-b border-slate-800">
                    <th className="p-3.5 font-bold w-16">Day</th>
                    <th className="p-3.5 font-bold min-w-[150px]">Block 1 (DSA Concept)</th>
                    <th className="p-3.5 font-bold min-w-[150px]">Block 2 (DSA Problems)</th>
                    <th className="p-3.5 font-bold min-w-[150px]">Block 4 (ML Theory)</th>
                    <th className="p-3.5 font-bold min-w-[150px]">Block 5 (ML Code)</th>
                    <th className="p-3.5 font-bold w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {days.slice(0, 15).map((day) => (
                    <tr key={day.id} className="hover:bg-[#12131e]/50 transition duration-100">
                      <td className="p-3 bg-slate-950/40 text-center font-bold text-cyan-450 border-r border-slate-800 w-16">
                        D{day.dayNumber}
                      </td>
                      
                      {/* Block 1 */}
                      <td 
                        className="p-3 cursor-pointer relative hover:bg-[#1c1d2e]/30 group"
                        onClick={() => handleTriggerInlineEdit(day.id, "block1_DSA_Concept", day.block1_DSA_Concept)}
                      >
                        {inlineEditingCell?.dayId === day.id && inlineEditingCell.field === "block1_DSA_Concept" ? (
                          <input 
                            autoFocus
                            type="text"
                            value={inlineEditText}
                            onChange={(e) => setInlineEditText(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(day.id, "block1_DSA_Concept")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveInlineEdit(day.id, "block1_DSA_Concept")}
                            className="w-full bg-[#1b1c2b] border border-cyan-500 rounded p-1 text-white text-xs select-all focus:outline-none"
                          />
                        ) : (
                          <div className="flex justify-between items-center pr-2">
                            <span className="truncate max-w-[180px] block font-medium" title="Click to edit cell inline">
                              {day.block1_DSA_Concept}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-cyan-500 opacity-0 group-hover:opacity-150 transition" />
                          </div>
                        )}
                      </td>

                      {/* Block 2 */}
                      <td 
                        className="p-3 cursor-pointer relative hover:bg-[#1c1d2e]/30 group"
                        onClick={() => handleTriggerInlineEdit(day.id, "block2_DSA_Problems", day.block2_DSA_Problems)}
                      >
                        {inlineEditingCell?.dayId === day.id && inlineEditingCell.field === "block2_DSA_Problems" ? (
                          <input 
                            autoFocus
                            type="text"
                            value={inlineEditText}
                            onChange={(e) => setInlineEditText(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(day.id, "block2_DSA_Problems")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveInlineEdit(day.id, "block2_DSA_Problems")}
                            className="w-full bg-[#1b1c2b] border border-cyan-500 rounded p-1 text-white text-xs select-all"
                          />
                        ) : (
                          <div className="flex justify-between items-center pr-2">
                            <span className="truncate max-w-[180px] block text-slate-350" title="Click to edit cell inline">
                              {day.block2_DSA_Problems}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-cyan-500 opacity-0 group-hover:opacity-150 transition" />
                          </div>
                        )}
                      </td>

                      {/* Block 4 */}
                      <td 
                        className="p-3 cursor-pointer relative hover:bg-[#1c1d2e]/30 group"
                        onClick={() => handleTriggerInlineEdit(day.id, "block4_ML_Theory", day.block4_ML_Theory)}
                      >
                        {inlineEditingCell?.dayId === day.id && inlineEditingCell.field === "block4_ML_Theory" ? (
                          <input 
                            autoFocus
                            type="text"
                            value={inlineEditText}
                            onChange={(e) => setInlineEditText(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(day.id, "block4_ML_Theory")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveInlineEdit(day.id, "block4_ML_Theory")}
                            className="w-full bg-[#1b1c2b] border border-cyan-500 rounded p-1 text-white text-xs select-all"
                          />
                        ) : (
                          <div className="flex justify-between items-center pr-2">
                            <span className="truncate max-w-[180px] block text-slate-400" title="Click to edit cell inline">
                              {day.block4_ML_Theory}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-cyan-505 opacity-0 group-hover:opacity-150 transition" />
                          </div>
                        )}
                      </td>

                      {/* Block 5 */}
                      <td 
                        className="p-3 cursor-pointer relative hover:bg-[#1c1d2e]/30 group"
                        onClick={() => handleTriggerInlineEdit(day.id, "block5_ML_Project", day.block5_ML_Project)}
                      >
                        {inlineEditingCell?.dayId === day.id && inlineEditingCell.field === "block5_ML_Project" ? (
                          <input 
                            autoFocus
                            type="text"
                            value={inlineEditText}
                            onChange={(e) => setInlineEditText(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(day.id, "block5_ML_Project")}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveInlineEdit(day.id, "block5_ML_Project")}
                            className="w-full bg-[#1b1c2b] border border-cyan-500 rounded p-1 text-white text-xs select-all"
                          />
                        ) : (
                          <div className="flex justify-between items-center pr-2">
                            <span className="truncate max-w-[180px] block text-slate-400" title="Click to edit cell inline">
                              {day.block5_ML_Project}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-cyan-500 opacity-0 group-hover:opacity-150 transition" />
                          </div>
                        )}
                      </td>

                      {/* Status indicator */}
                      <td className="p-3 text-center w-24">
                        {day.completed ? (
                          <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded font-bold font-mono">
                            COMPLETE
                          </span>
                        ) : day.isBacklog ? (
                          <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded font-bold font-mono">
                            BACKLOG
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold font-mono border border-slate-700/60">
                            PENDING
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-center text-slate-500 py-3.5 border-t border-slate-800/80 font-mono uppercase bg-slate-950/25">
                Double-click or single-click any text cell to edit task definitions inline instantly.
              </p>
            </div>
          )}

          {/* 2. KANBAN BOARD VIEW (Drag & Drop Block System of active day) */}
          {activeDailyView === "kanban" && (
            <div className="space-y-4">
              {/* Day selector HUD */}
              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold font-mono text-slate-400 uppercase">Select Training Day Context:</span>
                <select 
                  className="bg-[#141520] border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none text-center font-mono font-bold"
                  value={kanbanSelectedDayNum}
                  onChange={(e) => setKanbanSelectedDayNum(parseInt(e.target.value))}
                >
                  {days.map(d => (
                    <option key={d.id} value={d.dayNumber}>Day {d.dayNumber}: {d.block1_DSA_Concept.slice(0, 30)}...</option>
                  ))}
                </select>
              </div>

              {/* Grid 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="kanban-grid-cols">
                
                {/* Column 1: TO DO */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "todo")}
                  className="bg-[#090a0f] border border-slate-850 p-4 rounded-xl flex flex-col min-h-[350px] space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                    <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400">TO DO</span>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.2 rounded font-mono text-slate-500">
                      {[1,2,3,4,5].filter(num => getBlockKanbanColumn(days.find(d => d.dayNumber === kanbanSelectedDayNum)!, num as 1|2|3|4|5) === "todo").length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
                    {[1,2,3,4,5].map((num) => {
                      const activeDay = days.find(d => d.dayNumber === kanbanSelectedDayNum)!;
                      if (getBlockKanbanColumn(activeDay, num as 1|2|3|4|5) !== "todo") return null;

                      let name = "";
                      let hours = "";
                      if (num === 1) { name = activeDay.block1_DSA_Concept; hours = "3 hrs"; }
                      else if (num === 2) { name = activeDay.block2_DSA_Problems; hours = "3 hrs"; }
                      else if (num === 3) { name = activeDay.block3_CF_Upsolve; hours = "2 hrs"; }
                      else if (num === 4) { name = activeDay.block4_ML_Theory; hours = "2 hrs"; }
                      else if (num === 5) { name = activeDay.block5_ML_Project; hours = "2 hrs"; }

                      return (
                        <div 
                          key={num}
                          draggable
                          onDragStart={(e) => handleDragStart(e, num)}
                          className="bg-[#14151f] hover:bg-[#181926] border border-slate-800 p-3.5 rounded-xl cursor-grab active:cursor-grabbing transition duration-150 relative group"
                        >
                          <span className="text-[8px] font-mono tracking-wider uppercase font-bold text-slate-500 block">Block {num} • {hours}</span>
                          <p className="text-xs font-semibold text-slate-200 leading-normal mt-1 break-words">{name}</p>
                          
                          <div className="flex justify-end gap-1.5 mt-3 pt-2.5 border-t border-slate-850 opacity-100 md:opacity-0 group-hover:opacity-100 transition duration-150">
                            <button 
                              onClick={() => handleMoveKanbanBlock(kanbanSelectedDayNum, num as 1|2|3|4|5, "doing")}
                              className="text-[9px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold hover:bg-cyan-505/20 transition cursor-pointer"
                            >
                              START focus
                            </button>
                            <button 
                              onClick={() => handleMoveKanbanBlock(kanbanSelectedDayNum, num as 1|2|3|4|5, "done")}
                              className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                            >
                              CHECK off
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS (Doing) */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "doing")}
                  className="bg-[#090a0f] border border-cyan-900/15 p-4 rounded-xl flex flex-col min-h-[350px] space-y-3 shadow-md shadow-cyan-500/[0.01]"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                    <span className="text-xs uppercase font-mono tracking-wider font-bold text-cyan-455">DOING / ACTIVE</span>
                    <span className="text-[10px] bg-cyan-950/20 border border-cyan-500/20 px-2 py-0.2 rounded font-mono text-cyan-400">
                      {[1,2,3,4,5].filter(num => getBlockKanbanColumn(days.find(d => d.dayNumber === kanbanSelectedDayNum)!, num as 1|2|3|4|5) === "doing").length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
                    {[1,2,3,4,5].map((num) => {
                      const activeDay = days.find(d => d.dayNumber === kanbanSelectedDayNum)!;
                      if (getBlockKanbanColumn(activeDay, num as 1|2|3|4|5) !== "doing") return null;

                      let name = "";
                      let hours = "";
                      if (num === 1) { name = activeDay.block1_DSA_Concept; hours = "3 hrs"; }
                      else if (num === 2) { name = activeDay.block2_DSA_Problems; hours = "3 hrs"; }
                      else if (num === 3) { name = activeDay.block3_CF_Upsolve; hours = "2 hrs"; }
                      else if (num === 4) { name = activeDay.block4_ML_Theory; hours = "2 hrs"; }
                      else if (num === 5) { name = activeDay.block5_ML_Project; hours = "2 hrs"; }

                      return (
                        <div 
                          key={num}
                          draggable
                          onDragStart={(e) => handleDragStart(e, num)}
                          className="bg-cyan-500/[0.02] border-l-4 border-l-cyan-500 border border-slate-800 p-3.5 rounded-xl cursor-grab active:cursor-grabbing transition duration-150 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono tracking-wider uppercase font-bold text-cyan-400">active Focus Block</span>
                            <span className="animate-ping h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          </div>
                          <p className="text-xs font-semibold text-slate-200 leading-normal mt-1.5 break-words">{name}</p>
                          
                          <div className="flex justify-end gap-1.5 mt-3 pt-2.5 border-t border-slate-800/60 transition duration-150">
                            <button 
                              onClick={() => handleMoveKanbanBlock(kanbanSelectedDayNum, num as 1|2|3|4|5, "todo")}
                              className="text-[9px] bg-slate-905 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold hover:bg-slate-800 hover:text-white transition cursor-pointer"
                            >
                              STOP
                            </button>
                            <button 
                              onClick={() => handleMoveKanbanBlock(kanbanSelectedDayNum, num as 1|2|3|4|5, "done")}
                              className="text-[9px] bg-emerald-505/20 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                            >
                              COMPLETE Log
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: COMPLETED */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "done")}
                  className="bg-[#090a0f] border border-slate-850 p-4 rounded-xl flex flex-col min-h-[350px] space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-805 pb-2 mb-1">
                    <span className="text-xs uppercase font-mono tracking-wider font-bold text-emerald-400">COMPLETED</span>
                    <span className="text-[10px] bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.2 rounded font-mono text-emerald-400">
                      {[1,2,3,4,5].filter(num => getBlockKanbanColumn(days.find(d => d.dayNumber === kanbanSelectedDayNum)!, num as 1|2|3|4|5) === "done").length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
                    {[1,2,3,4,5].map((num) => {
                      const activeDay = days.find(d => d.dayNumber === kanbanSelectedDayNum)!;
                      if (getBlockKanbanColumn(activeDay, num as 1|2|3|4|5) !== "done") return null;

                      let name = "";
                      let hours = "";
                      if (num === 1) { name = activeDay.block1_DSA_Concept; hours = "3 hrs"; }
                      else if (num === 2) { name = activeDay.block2_DSA_Problems; hours = "3 hrs"; }
                      else if (num === 3) { name = activeDay.block3_CF_Upsolve; hours = "2 hrs"; }
                      else if (num === 4) { name = activeDay.block4_ML_Theory; hours = "2 hrs"; }
                      else if (num === 5) { name = activeDay.block5_ML_Project; hours = "2 hrs"; }

                      return (
                        <div 
                          key={num}
                          draggable
                          onDragStart={(e) => handleDragStart(e, num)}
                          className="bg-emerald-500/[0.01] border border-emerald-500/15 border-dashed p-3.5 rounded-xl cursor-default opacity-60 hover:opacity-100 transition duration-150"
                        >
                          <span className="text-[8px] font-mono tracking-wider uppercase font-bold text-slate-500 block line-through">Block {num} • {hours} Completed</span>
                          <p className="text-xs font-semibold text-slate-350 leading-normal mt-1.5 line-through break-words">{name}</p>
                          <div className="flex justify-end mt-2">
                            <button 
                              onClick={() => handleMoveKanbanBlock(kanbanSelectedDayNum, num as 1|2|3|4|5, "todo")}
                              className="text-[8.5px] hover:text-rose-400 text-slate-500 font-mono underline cursor-pointer"
                            >
                              Re-open task
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
              
              <div className="bg-[#121320]/45 p-3.5 rounded-xl border border-slate-805 text-[10px] text-slate-450 leading-relaxed font-mono uppercase text-center">
                Drag cards from left/middle columns to target columns, or click core state regulators below cards to re-map.
              </div>
            </div>
          )}

          {/* 3. CALENDAR VIEW (Structured 30-Day Grid) */}
          {activeDailyView === "calendar" && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                {days.map((day) => {
                  const completedCount = 
                    (day.block1_completed ? 1 : 0) +
                    (day.block2_completed ? 1 : 0) +
                    (day.block3_completed ? 1 : 0) +
                    (day.block4_completed ? 1 : 0) +
                    (day.block5_completed ? 1 : 0);

                  const completionPercent = (completedCount / 5) * 100;

                  return (
                    <div 
                      key={day.id}
                      className={`p-3.5 rounded-xl border font-mono text-center transition flex flex-col justify-between min-h-[105px] select-none ${
                        day.completed 
                          ? "bg-cyan-505/[0.03] border-cyan-500/40 text-cyan-400" 
                          : day.isBacklog 
                            ? "bg-amber-500/[0.04] border-amber-500/35 text-amber-500" 
                            : "bg-[#0d0e14] border-slate-800 text-slate-350 hover:bg-[#12131e]/40 hover:border-slate-700 cursor-pointer"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs uppercase tracking-wider">Day {day.dayNumber}</span>
                        {day.completed && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>

                      <div className="my-2 text-[10px] leading-tight text-slate-400 truncate max-w-full">
                        {day.block1_DSA_Concept}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[8.5px] text-slate-500">
                          <span>{completedCount}/5</span>
                          <span>{Math.round(completionPercent)}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.2 rounded-full overflow-hidden border border-slate-800/40">
                          <div 
                            className={`h-full transition-all duration-300 ${day.completed ? "bg-cyan-400" : day.isBacklog ? "bg-amber-500" : "bg-indigo-500"}`} 
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. CLASSIC NOTION LIST (The standard curriculum rows) */}
          {activeDailyView === "list" && (
            <div className="space-y-3">
              {days.map((day) => {
                const completedCount = 
                  (day.block1_completed ? 1 : 0) +
                  (day.block2_completed ? 1 : 0) +
                  (day.block3_completed ? 1 : 0) +
                  (day.block4_completed ? 1 : 0) +
                  (day.block5_completed ? 1 : 0);

                return (
                  <div 
                    key={day.id} 
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-150 ${
                      day.completed 
                        ? "bg-cyan-500/[0.02] border-cyan-500/30" 
                        : day.isBacklog 
                          ? "bg-amber-500/[0.02] border border-amber-500/30 border-l-4 border-l-amber-550" 
                          : "bg-[#0c0d12] border-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="bg-[#141520] border border-slate-800 h-9 w-9 rounded-lg font-mono font-bold text-xs flex items-center justify-center text-slate-450 text-center shrink-0">
                        {day.dayNumber}
                      </div>
                      <div className="truncate flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{day.block1_DSA_Concept}</h4>
                          {day.isBacklog && (
                            <span className="text-[7.5px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.2 rounded font-mono uppercase font-bold shrink-0">
                              Lags
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wide truncate mt-0.5">{day.block4_ML_Theory}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 justify-between w-full sm:w-auto border-t sm:border-0 pt-2.5 sm:pt-0 border-slate-850">
                      <span className="text-[10px] text-slate-400 font-mono bg-[#141520] px-2 py-0.5 rounded border border-slate-800">
                        {completedCount}/5 blocks
                      </span>

                      {/* Direct checkoff status triggers */}
                      <div className="flex gap-1.5 font-mono text-[8.5px] font-bold uppercase shrink-0">
                        <button 
                          onClick={() => {
                            const updated = { ...day, completed: !day.completed };
                            if (updated.completed) {
                              updated.block1_completed = true;
                              updated.block2_completed = true;
                              updated.block3_completed = true;
                              updated.block4_completed = true;
                              updated.block5_completed = true;
                              updated.isBacklog = false;
                            } else {
                              updated.block1_completed = false;
                              updated.block2_completed = false;
                              updated.block3_completed = false;
                              updated.block4_completed = false;
                              updated.block5_completed = false;
                            }
                            onUpdateDay(updated);
                          }}
                          className={`px-3 py-1.5 rounded transition cursor-pointer ${
                            day.completed 
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25" 
                              : "bg-[#141520] hover:bg-slate-800 text-slate-400 border border-slate-800"
                          }`}
                        >
                          {day.completed ? "Checked OK" : "Skip/Mark Done"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Weekly Milestones View */}
      {activePage === "weekly" && (
        <div className="space-y-6" id="weekly-roadmap-workspace">
          {[
            {
              week: 1,
              title: "Foundation Blocks: Basics & Linear Alg",
              daysRange: [1, 7],
              focusScope: "Establish prefix matrices, basic two-pointer optimizations. Code simple OLS weights fits.",
              milestones: ["Derived Ordinary Least Squares matrix math", "Completed 15 Sliding-window problems", "Set up VS Code local simulator"]
            },
            {
              week: 2,
              title: "Intermediate Mechanics: Trees & Regularizations",
              daysRange: [8, 14],
              focusScope: "Review recursion limits on Binary Searches. Implement Ridge vs Lasso regression coefficients.",
              milestones: ["Integrated Codeforce live status profile handles", "Coded Ridge shrinkage penalty loops", "Resolved priority queues bottlenecks"]
            },
            {
              week: 3,
              title: "Advanced Loops: Priority Graphs & Momentum",
              daysRange: [15, 21],
              focusScope: "Construct priority min-heaps. Analyze Adam/SGD learning momentums.",
              milestones: ["Wrote Dijkstra graph traversing paths", "Checked off Gradient momentum formulations", "Built ML weights serialization buffers"]
            },
            {
              week: 4,
              title: "Production Ready: Segment & Transformers",
              daysRange: [22, 30],
              focusScope: "Query logarithmic interval tree boundaries. Code full self-attention key/query matrices.",
              milestones: ["Coded Segment Trees scratch matrices", "Calculated Multi-head transformer logits", "Participated in 2 Virtual Codeforces Round upsolves"]
            }
          ].map((weekData) => {
            // Calculate completion rate of days in this week
            const weekDays = days.filter(d => d.dayNumber >= weekData.daysRange[0] && d.dayNumber <= weekData.daysRange[1]);
            const completedCount = weekDays.filter(d => d.completed).length;
            const completionPercent = weekDays.length > 0 ? Math.round((completedCount / weekDays.length) * 100) : 0;

            return (
              <div key={weekData.week} className="bg-[#0c0d12] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Page Week • 0{weekData.week}</span>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                      <span>{weekData.title}</span>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-mono">
                        Days {weekData.daysRange[0]}-{weekData.daysRange[1]}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-xs font-mono text-slate-400">{completedCount} / {weekDays.length} Done</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/15">
                      {completionPercent}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Outline scope */}
                  <div className="bg-[#14151f] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[8.5px] tracking-wider uppercase font-mono text-indigo-400 font-bold block mb-1">Theoretical Focus Scope</span>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{weekData.focusScope}"
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-3 uppercase tracking-widest leading-none">
                      Checked off sequentially.
                    </span>
                  </div>

                  {/* Milestones status */}
                  <div className="bg-[#14151f] p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[8.5px] tracking-wider uppercase font-mono text-cyan-400 font-bold block">Accompanied Milestones checklist</span>
                    <div className="space-y-1.5">
                      {weekData.milestones.map((mil, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-slate-350">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{mil}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly Roadmap View */}
      {activePage === "monthly" && (
        <div className="bg-[#0c0d12] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6" id="monthly-roadmap-master">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-550 font-bold tracking-widest block">Month 01 Master Vision</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">30-Day Training Camp Roadmap</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Target objectives: Establish core foundations for DSA concepts and Machine Learning theory starting from simple regressions up to complex neural model architectures from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs text-slate-300">
            <div className="bg-[#14151f] p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-lg font-bold text-cyan-400 block mb-1">Phase 1</span>
              <p className="text-slate-400 text-[10.5px]">Days 1 - 10</p>
              <span className="mt-3 block font-bold text-slate-200">Prefix Sums & Linear Math</span>
            </div>
            <div className="bg-[#14151f] p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-lg font-bold text-indigo-400 block mb-1">Phase 2</span>
              <p className="text-slate-400 text-[10.5px]">Days 11 - 20</p>
              <span className="mt-3 block font-bold text-slate-200">Segment Trees & Ridge Math</span>
            </div>
            <div className="bg-[#14151f] p-4 rounded-xl border border-slate-805 text-center">
              <span className="text-lg font-bold text-emerald-400 block mb-1">Phase 3</span>
              <p className="text-slate-400 text-[10.5px]">Days 21 - 30</p>
              <span className="mt-3 block font-bold text-slate-200">Self-Attention & Contests</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
