import React, { useState, useEffect, useRef } from "react";
import { Terminal, Bug, Play, CheckCircle, Clock, Save, Copy, FileCode, Cpu, Braces, Sparkles, Send } from "lucide-react";
import { StudySession, PlanDay } from "../types";

interface VSCodeTrackerProps {
  sessions: StudySession[];
  onLogSession: (minutes: number, blockType: any, notes: string, source: string) => void;
}

export default function VSCodeTracker({ sessions, onLogSession }: VSCodeTrackerProps) {
  const [activeFile, setActiveFile] = useState("train_ppo.py");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSeconds, setSimulationSeconds] = useState(0);
  const [linesWritten, setLinesWritten] = useState(140);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Initializing local telemetry heartbeat sync container...",
    "Telemetry hooked into port 3000.",
    "Watching active workspace directory: /workplace/30day-camp..."
  ]);
  const [simulatedCode, setSimulatedCode] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated code files content
  const codeFiles: { [filename: string]: string } = {
    "train_ppo.py": `import torch\nimport gym\nfrom actor_critic import PolicyNetwork\n\nenv = gym.make("LunarLander-v2")\npolicy = PolicyNetwork(env.observation_space.shape[0], env.action_space.n)\noptimizer = torch.optim.Adam(policy.parameters(), lr=3e-4)\n\n# Dynamic clipping ratio for PPO\neps_clip = 0.2\n\nfor epoch in range(100):\n    states, actions, rewards, log_probs = roll_out_trajectories(env, policy)\n    advantages = compute_advantages(rewards)\n    \n    # Update policy utilizing trust region surrogate loss\n    for _ in range(4):\n        new_log_probs, state_values = policy.evaluate(states, actions)\n        ratios = torch.exp(new_log_probs - log_probs)\n        surr1 = ratios * advantages\n        surr2 = torch.clamp(ratios, 1 - eps_clip, 1 + eps_clip) * advantages\n        policy_loss = -torch.min(surr1, surr2).mean()\n        \n        optimizer.zero_grad()\n        policy_loss.backward()\n        optimizer.step()\n        \n    print(f"Epoch {epoch} complete. Reward Average: {rewards.sum():.2f}")`,

    "dijkstra.cpp": `#include <iostream>\n#include <vector>\n#include <queue>\n\nusing namespace std;\n\nvector<int> dijkstra(int source, vector<vector<pair<int, int>>>& adj) {\n    int n = adj.size();\n    vector<int> dist(n, 1e9);\n    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;\n    \n    dist[source] = 0;\n    pq.push({0, source});\n    \n    while(!pq.empty()) {\n        auto [d, u] = pq.top();\n        pq.pop();\n        \n        if (d > dist[u]) continue;\n        \n        for (auto& edge : adj[u]) {\n            int v = edge.first;\n            int weight = edge.second;\n            if (dist[u] + weight < dist[v]) {\n                dist[v] = dist[u] + weight;\n                pq.push({dist[v], v});\n            }\n        }\n    }\n    return dist;\n}`,

    "regression_scratch.py": `import numpy as np\n\nclass CustomLinearRegression:\n    def __init__(self, learning_rate=0.01, epochs=1000):\n        self.lr = learning_rate\n        self.epochs = epochs\n        self.weights = None\n        self.bias = None\n        \n    def fit(self, X, y):\n        n_samples, n_features = X.shape\n        self.weights = np.zeros(n_features)\n        self.bias = 0.0\n        \n        # Gradient descent optimization\n        for epoch in range(self.epochs):\n            y_predicted = np.dot(X, self.weights) + self.bias\n            \n            dw = (1 / n_samples) * np.dot(X.T, (y_predicted - y))\n            db = (1 / n_samples) * np.sum(y_predicted - y)\n            \n            self.weights -= self.lr * dw\n            self.bias -= self.lr * db\n            \n    def predict(self, X):\n        return np.dot(X, self.weights) + self.bias`
  };

  // Set initial simulated code on active file shift
  useEffect(() => {
    setSimulatedCode(codeFiles[activeFile] || "");
  }, [activeFile]);

  // Telemetry Stopwatch Active
  useEffect(() => {
    if (isSimulating) {
      timerRef.current = setInterval(() => {
        setSimulationSeconds((prev) => {
          const nextSec = prev + 1;
          
          // Every 5 simulated seconds, add terminal updates and lines written
          if (nextSec % 4 === 0) {
            setLinesWritten(l => l + Math.floor(Math.random() * 4) + 1);
            const logs = [
              `[Heartbeat] Telemetry sync logged progress in ${activeFile}`,
              `[Vim] Written backup files successfully...`,
              `[PyTorch] Allocated 1.4GB cache memory for training loop...`,
              `[Terminal] Optimization running with loss shrinkage: ${(Math.random()*0.1).toFixed(4)}`
            ];
            setTerminalLogs(t => [...t.slice(-8), logs[Math.floor(Math.random() * logs.length)]]);
          }

          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, activeFile]);

  const handleToggleSimulation = () => {
    if (isSimulating) {
      // Toggle off & Log Session!
      const elapsedMinutes = Math.max(1, Math.round(simulationSeconds / 10)); // Accelerate logging (10s = 1m in app terms)
      
      const blockCategory = activeFile === "dijkstra.cpp" 
        ? "DSA Problems" 
        : activeFile === "train_ppo.py"
          ? "ML Implementation/Project"
          : "DSA Concepts";

      onLogSession(
        elapsedMinutes, 
        blockCategory as any,
        `Simulated coding focus inside active workspace, edited ${activeFile} (+${linesWritten - 140} lines).`,
        "VS Code Tracker"
      );

      // Add complete diagnostic alert
      setTerminalLogs(t => [
        ...t,
        `Telemetry Session saved. Synced ${elapsedMinutes} minutes to Study Database.`
      ]);
      setSimulationSeconds(0);
      setLinesWritten(140);
      setIsSimulating(false);
    } else {
      // Toggle on
      setIsSimulating(true);
      setTerminalLogs(t => [
        ...t,
        `Starting real-time VS Code observer on ${activeFile}...`,
        `Recording telemetry timestamps.`
      ]);
    }
  };

  const copyWebhookCommand = () => {
    navigator.clipboard.writeText(`curl -X POST https://30-day-master-tracker/api/telemetry -H "Content-Type: application/json" -d '{"activeMinutes": 45, "fileName": "${activeFile}", "lines": 58}'`);
    alert("Webhook testing command copied! You can run this payload to sync telemetry.");
  };

  return (
    <div className="space-y-6" id="vscode-tracker-root">
      {/* Introduction */}
      <div>
        <h2 className="text-lg font-bold font-display uppercase tracking-[0.15em] text-cyan-400 flex items-center space-x-2">
          <span>VS Code & ML Telemetry</span>
          <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/35 text-indigo-400 px-2 py-0.5 rounded font-mono">
            WEBSOCKET_UP
          </span>
        </h2>
        <p className="text-slate-400 text-xs">Simulate dynamic development telemetry, calculate written lines, or connect local coding indices to daily focus charts.</p>
      </div>

      {/* Grid: Editor Simulator vs Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual VS Code Mock (Cols 8) */}
        <div className="lg:col-span-8 bg-[#0a0a0f] border border-slate-850 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
          {/* Editor Header Bar */}
          <div className="bg-[#121319] px-4 py-2 flex items-center justify-between border-b border-black/80 select-none">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
              <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider ml-2 pl-2 border-l border-slate-800 font-bold">Observer Terminal</span>
            </div>
            
            {/* Simulation controls */}
            <div className="flex items-center space-x-2.5Color">
              {isSimulating && (
                <div className="flex items-center space-x-1.5 bg-red-950/60 border border-red-500/30 text-red-400 text-[10px] px-2 py-0.5 rounded font-mono animate-pulse uppercase font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" />
                  <span>Telemetry: {simulationSeconds}s (x60 SCALE)</span>
                </div>
              )}
              
              <button 
                onClick={handleToggleSimulation}
                className={`text-[9px] uppercase font-bold tracking-wider px-3.5 py-1 rounded transition flex items-center space-x-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)] ${
                  isSimulating 
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                }`}
              >
                <Play className="w-3 h-3 shrink-0" />
                <span>{isSimulating ? "Commit & Sync" : "Sync Local workspace"}</span>
              </button>
            </div>
          </div>

          {/* Sub menu explorer */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Folder Directory */}
            <div className="w-48 bg-[#0d0e14] p-3 text-slate-400 text-[11px] font-mono border-r border-slate-850/80 space-y-4 shrink-0 select-none">
              <div>
                <p className="text-slate-500 font-bold tracking-wider uppercase text-[9px] mb-2">CAMP_WORKSPACE</p>
                <div className="space-y-1">
                  <div 
                    onClick={() => !isSimulating && setActiveFile("train_ppo.py")}
                    className={`flex items-center space-x-1.5 px-2 py-1.5 rounded cursor-pointer transition ${
                      activeFile === "train_ppo.py" ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500" : "hover:bg-[#161720]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">train_ppo.py</span>
                  </div>
                  <div 
                    onClick={() => !isSimulating && setActiveFile("dijkstra.cpp")}
                    className={`flex items-center space-x-1.5 px-2 py-1.5 rounded cursor-pointer transition ${
                      activeFile === "dijkstra.cpp" ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500" : "hover:bg-[#161720]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">dijkstra.cpp</span>
                  </div>
                  <div 
                    onClick={() => !isSimulating && setActiveFile("regression_scratch.py")}
                    className={`flex items-center space-x-1.5 px-2 py-1.5 rounded cursor-pointer transition ${
                      activeFile === "regression_scratch.py" ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500" : "hover:bg-[#161720]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">linear_reg.py</span>
                  </div>
                </div>
              </div>

              {/* Status parameters */}
              <div className="pt-3 border-t border-slate-800/60 font-mono">
                <p className="text-slate-500 font-bold uppercase text-[9px] mb-1.5">TELEMETRY_STATUS</p>
                <div className="space-y-1 text-[10px] text-slate-400">
                  <p>Lines written: <span className="text-cyan-400 font-bold font-mono">{linesWritten + (isSimulating ? Math.floor(simulationSeconds / 3) : 0)}</span></p>
                  <p>Observatory: <span className="text-emerald-500 font-semibold">Active</span></p>
                  <p>Sync host: <span className="text-slate-500">port 3000</span></p>
                </div>
              </div>
            </div>

            {/* Main Code Viewport */}
            <div className="flex-1 flex flex-col bg-[#050508] overflow-hidden">
              {/* File tabs */}
              <div className="bg-[#0e0f14] flex border-b border-black font-mono text-[10px] select-none">
                <div className="bg-[#050508] text-slate-300 px-4 py-1.5 border-r border-[#0d0e14] flex items-center space-x-2 font-bold text-cyan-400">
                  <span>{activeFile}</span>
                </div>
              </div>

              {/* Text editor view */}
              <div className="flex-1 p-4 font-mono text-[11px] text-slate-300 overflow-y-auto leading-relaxed select-text bg-[#030305]">
                <pre className="whitespace-pre">{simulatedCode}</pre>
              </div>

              {/* Diagnostic terminal (Mock output console) */}
              <div className="h-40 bg-[#07070b] border-t border-slate-850 flex flex-col">
                <div className="bg-[#0e0f14]/80 px-4 py-1.5 flex items-center justify-between border-b border-black select-none">
                  <div className="flex items-center space-x-2 text-slate-400 text-[9px] uppercase tracking-wider font-mono font-bold">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Diagnostics output logs</span>
                  </div>
                </div>
                <div className="flex-1 p-3 font-mono text-[10px] text-cyan-400 overflow-y-auto space-y-1 bg-black/40">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-1.5">
                      <span className="text-slate-600 select-none">&gt;</span>
                      <p className="break-all text-slate-300">{log}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Instructions & AI Coaching triggers (Cols 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* telemetry secret access API instructions */}
          <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Telemetry webhook curl</span>
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Desktop shell scripts can pipe direct telemetry payload updates stream to the active database parameters by executing this curl webhook:
            </p>

            <div className="p-3 bg-[#07070a]/90 rounded-lg border border-slate-850 font-mono text-[9px] text-slate-300 break-words relative group">
              <button 
                onClick={copyWebhookCommand}
                title="Copy telemetry curl payload"
                className="absolute top-2.5 right-2.5 bg-slate-800/50 hover:bg-slate-700 border border-slate-800 p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
              >
                <Copy className="w-3 h-3" />
              </button>
              <span className="text-slate-500 block mb-1"># CLI dispatch study sync</span>
              curl -X POST https://ais-dev-5y6h/api/telemetry ...
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              * Local socket signals index folder sizes and checks commit changes to maintain daily statistics.
            </p>
          </div>

          {/* study metrics stats overview */}
          <div className="bg-[#0d0e14] border border-slate-800/60 rounded-xl p-5 shadow-xl space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Project Pattern Analyzer</span>
            </h4>
            
            <div className="bg-indigo-950/10 p-3.5 rounded-xl border border-indigo-500/20 text-xs text-indigo-300 space-y-2">
              <p className="font-bold flex items-center space-x-1.5 uppercase font-mono text-[10px] tracking-wider">
                <Braces className="w-3.5 h-3.5" />
                <span>Compiler guidelines</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li>Algorithms demand zero-alloc vector structures. Maximize speed for deep networks.</li>
                <li>Dijkstra prioritization remains optimal at O(E log V) bounds. Essential for CFupsolving.</li>
                <li>SGD backprops must track scaling derivatives to prevent vanishing gradient slopes.</li>
              </ul>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Synthesizing simulated focus durations lets the AI coach map optimal study patterns customized to your codebase habits.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
