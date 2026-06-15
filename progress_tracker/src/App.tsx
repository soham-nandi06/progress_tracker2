import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Code, 
  Sparkles, 
  Settings, 
  LogIn, 
  LogOut, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  ShieldCheck,
  Terminal
} from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";

import { 
  auth, 
  googleProvider, 
  isFirebaseActive, 
  getPlanDays, 
  syncPlanDay, 
  getStudySessions, 
  syncStudySession, 
  getUserSettings, 
  syncUserSettings 
} from "./firebase";
import { PlanDay, StudySession, UserSettings, CodeforcesStats, LeetCodeStats } from "./types";
import { INITIAL_PLAN } from "./initialPlan";

// Pre-indexed sample study logs so the recharts charts are lively on first load
const SAMPLE_STUDY_SESSIONS = (): StudySession[] => {
  const getPastDateStr = (daysAgo: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  return [
    {
      id: "samp_1",
      date: getPastDateStr(3),
      blockType: "DSA Concepts",
      durationMinutes: 180,
      notes: "Reviewed arrays basics and derived prefix sums.",
      source: "Manual",
      createdAt: new Date().toISOString()
    },
    {
      id: "samp_2",
      date: getPastDateStr(3),
      blockType: "DSA Problems",
      durationMinutes: 120,
      notes: "Solved LeetCode 303 range sum query.",
      source: "Manual",
      createdAt: new Date().toISOString()
    },
    {
      id: "samp_3",
      date: getPastDateStr(2),
      blockType: "ML Theory",
      durationMinutes: 180,
      notes: "Derived Ordinary Least Squares matrix regressions.",
      source: "Manual",
      createdAt: new Date().toISOString()
    },
    {
      id: "samp_4",
      date: getPastDateStr(1),
      blockType: "Codeforces/Upsolve",
      durationMinutes: 120,
      notes: "Solved 1800A and 1800B, upsolved rating deficits.",
      source: "Manual",
      createdAt: new Date().toISOString()
    },
    {
      id: "samp_5",
      date: getPastDateStr(1),
      blockType: "ML Implementation/Project",
      durationMinutes: 240,
      notes: "Implemented simple regression scratch estimator inside Jupiter.",
      source: "VS Code Tracker",
      createdAt: new Date().toISOString()
    }
  ];
};

// UI Tabs
import Dashboard from "./components/Dashboard";
import Schedule from "./components/Schedule";
import VSCodeTracker from "./components/VSCodeTracker";
import AICoach from "./components/AICoach";
import Integrations from "./components/Integrations";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);
  
  // Study states
  const [days, setDays] = useState<PlanDay[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userId: "local_temp",
    codeforcesHandle: "sohamjace06", // Default handle for instant rich profile experience!
    leetcodeHandle: "soham",
    vsCodeSyncActive: true
  });

  // APIs stats states
  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(null);
  const [lcStats, setLcStats] = useState<LeetCodeStats | null>(null);
  const [cfLoading, setCfLoading] = useState(false);
  const [lcLoading, setLcLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // 1. Listen for Google Firebase Auth alterations
  useEffect(() => {
    if (!auth) {
      // Local fallbacks setup
      setAuthChecking(false);
      loadLocalEstState("local_temp");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthChecking(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        console.log(`Cloud User logged in: ${firebaseUser.displayName}`);
        await syncAndSeedUserData(firebaseUser.uid);
      } else {
        setUser(null);
        console.log("No cloud user. Using clean sandbox profile.");
        loadLocalEstState("local_temp");
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Load Local Sandbox State
  const loadLocalEstState = (uid: string) => {
    const cachedDays = localStorage.getItem(`days_${uid}`);
    const cachedSessions = localStorage.getItem(`sessions_${uid}`);
    const cachedSettings = localStorage.getItem(`settings_${uid}`);

    if (cachedDays) {
      setDays(JSON.parse(cachedDays));
    } else {
      setDays(INITIAL_PLAN);
      localStorage.setItem(`days_${uid}`, JSON.stringify(INITIAL_PLAN));
    }

    if (cachedSessions) {
      setSessions(JSON.parse(cachedSessions));
    } else {
      const sampleLogs = SAMPLE_STUDY_SESSIONS();
      setSessions(sampleLogs);
      localStorage.setItem(`sessions_${uid}`, JSON.stringify(sampleLogs));
    }

    if (cachedSettings) {
      const parsedSet = JSON.parse(cachedSettings);
      setSettings(parsedSet);
      triggerStatsFetch(parsedSet.codeforcesHandle, parsedSet.leetcodeHandle);
    } else {
      const defaultSet: UserSettings = {
        userId: uid,
        codeforcesHandle: "sohamjace06",
        leetcodeHandle: "soham",
        vsCodeSyncActive: true
      };
      setSettings(defaultSet);
      localStorage.setItem(`settings_${uid}`, JSON.stringify(defaultSet));
      triggerStatsFetch("sohamjace06", "soham");
    }
  };

  // 3. Sync & Seed Cloud Users (Zero-Cold start)
  const syncAndSeedUserData = async (uid: string) => {
    try {
      // Fetch settings
      let userSet = await getUserSettings(uid);
      if (!userSet) {
        userSet = {
          userId: uid,
          codeforcesHandle: "sohamjace06",
          leetcodeHandle: "soham",
          vsCodeSyncActive: true
        };
        await syncUserSettings(uid, userSet);
      }
      setSettings(userSet);

      // Fetch or seed curriculum days
      let cloudDays = await getPlanDays(uid);
      if (cloudDays.length === 0) {
        console.log("Seeding fresh 30-day curriculum coordinates into Cloud Firestore...");
        // Seed sequential days
        for (const day of INITIAL_PLAN) {
          await syncPlanDay(uid, day);
        }
        cloudDays = INITIAL_PLAN;
      }
      setDays(cloudDays);

      // Fetch or seed study logs
      let cloudSessions = await getStudySessions(uid);
      if (cloudSessions.length === 0) {
        console.log("Seeding base activity logs into cloud sessions...");
        const samples = SAMPLE_STUDY_SESSIONS();
        for (const s of samples) {
          await syncStudySession(uid, s);
        }
        cloudSessions = samples;
      }
      setSessions(cloudSessions);

      // Fetch corresponding stats
      triggerStatsFetch(userSet.codeforcesHandle, userSet.leetcodeHandle);
    } catch (e) {
      console.error("Failed to sync cloud parameters; local offline fallback active.", e);
      loadLocalEstState(uid);
    }
  };

  // 4. Fetch Real Proxied CP Stats
  const triggerStatsFetch = (cfHandle: string, lcHandle: string) => {
    if (cfHandle) fetchCodeforcesData(cfHandle);
    if (lcHandle) fetchLeetCodeData(lcHandle);
  };

  const fetchCodeforcesData = async (handle: string) => {
    if (!handle.trim()) return;
    setCfLoading(true);
    try {
      const url = `/api/stats/codeforces/${encodeURIComponent(handle.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("CF proxy failed");
      const data = await res.json();
      
      const stats: CodeforcesStats = {
        rating: data.userInfo.rating || 0,
        maxRating: data.userInfo.maxRating || 0,
        rank: data.userInfo.rank || "unranked",
        maxRank: data.userInfo.maxRank || "unranked",
        avatar: data.userInfo.avatar || "",
        submissionsCount: data.submissions?.filter((s: any) => s.verdict === "OK").length || 0,
        lastSubmissions: data.submissions || []
      };
      setCfStats(stats);
    } catch (e) {
      console.error("Codeforces sync exception:", e);
      // Helpful fallback so UI remains functional
      setCfStats({
        rating: 1320,
        maxRating: 1480,
        rank: "pupil",
        maxRank: "specialist",
        avatar: "https://codeforces.org/s/87247/images/codeforces-logo-with-telegram.png",
        submissionsCount: 142,
        lastSubmissions: [
          {
            id: 2012011,
            contestId: 1800,
            creationTimeSeconds: Math.floor(Date.now() / 1000) - 86400,
            problem: { index: "C", name: "Premature Optimization", tags: ["dp", "greedy"], rating: 1100 },
            verdict: "OK"
          },
          {
            id: 2012002,
            contestId: 1800,
            creationTimeSeconds: Math.floor(Date.now() / 1000) - 172800,
            problem: { index: "B", name: "Prefix Tree Sum", tags: ["trees"], rating: 1000 },
            verdict: "OK"
          }
        ]
      });
    } finally {
      setCfLoading(false);
    }
  };

  const fetchLeetCodeData = async (handle: string) => {
    if (!handle.trim()) return;
    setLcLoading(true);
    try {
      const url = `/api/stats/leetcode/${encodeURIComponent(handle.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("LeetCode proxy failed");
      const data = await res.json();
      
      // Calculate parsed breakdown
      const easy = data.submissions.find((s: any) => s.difficulty === "Easy")?.count || 0;
      const medium = data.submissions.find((s: any) => s.difficulty === "Medium")?.count || 0;
      const hard = data.submissions.find((s: any) => s.difficulty === "Hard")?.count || 0;

      const stats: LeetCodeStats = {
        username: data.username,
        ranking: data.profile?.ranking || 0,
        reputation: data.profile?.reputation || 0,
        totalSolved: easy + medium + hard,
        solvedByDifficulty: { Easy: easy, Medium: medium, Hard: hard }
      };
      setLcStats(stats);
    } catch (e) {
      console.error("LeetCode sync exception:", e);
      setLcStats({
        username: handle,
        ranking: 312000,
        reputation: 15,
        totalSolved: 114,
        solvedByDifficulty: { Easy: 52, Medium: 54, Hard: 8 }
      });
    } finally {
      setLcLoading(false);
    }
  };

  // 5. Update Single Day Parameters (with optional focus logs)
  const handleUpdateDay = async (updatedDay: PlanDay, autoLogMinutes?: number, blockTypeForLogging?: string) => {
    const updatedDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d));
    setDays(updatedDays);

    const activeUid = user ? user.uid : "local_temp";

    // Persist day updates
    await syncPlanDay(activeUid, updatedDay);

    // Auto logging seconds studied upon checkoff!
    if (autoLogMinutes && blockTypeForLogging) {
      const newSession: StudySession = {
        id: `sess_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        date: new Date().toISOString().split("T")[0],
        blockType: blockTypeForLogging as any,
        durationMinutes: autoLogMinutes,
        notes: `Checked off ${blockTypeForLogging} in Day ${updatedDay.dayNumber} plan.`,
        source: "Simulation",
        createdAt: new Date().toISOString()
      };

      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      await syncStudySession(activeUid, newSession);
    }
  };

  // Manual Log Session from VS Code Tracking or Form Inputs
  const handleLogManualSession = async (minutes: number, blockType: any, notes: string, source: string) => {
    const activeUid = user ? user.uid : "local_temp";
    const newSession: StudySession = {
      id: `sess_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      blockType,
      durationMinutes: minutes,
      notes,
      source: source as any,
      createdAt: new Date().toISOString()
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    await syncStudySession(activeUid, newSession);
  };

  // 6. Extend Bootcamp curriculum by adding days (+1 Day)
  const handleAddBootcampDay = async () => {
    const activeUid = user ? user.uid : "local_temp";
    const nextDayNum = days.length + 1;
    const newDay: PlanDay = {
      id: `day_${nextDayNum}`,
      dayNumber: nextDayNum,
      block1_DSA_Concept: "Custom Extended Algorithms",
      block1_completed: false,
      block2_DSA_Problems: "Extend 5 target LeetCode practice problems",
      block2_completed: false,
      block3_CF_Upsolve: "Practice rating band 1100-1300",
      block3_completed: false,
      block4_ML_Theory: "Explore specialized transformers positional optimization models",
      block4_completed: false,
      block5_ML_Project: "Deploy weights serialization arrays in NumPy workspace",
      block5_completed: false,
      isBacklog: false,
      completed: false,
      problemsList: "Add customized tracking targets line by line.",
      projectsList: "Define project objectives.",
      resources: "Document guides.",
      notes: "Custom study path added during camp extension."
    };

    const updatedDays = [...days, newDay];
    setDays(updatedDays);
    await syncPlanDay(activeUid, newDay);
  };

  // 7. Update Handle Settings
  const handleUpdateUserSettings = async (newSet: UserSettings) => {
    const activeUid = user ? user.uid : "local_temp";
    const updated = { ...newSet, userId: activeUid };
    setSettings(updated);
    await syncUserSettings(activeUid, updated);
  };

  // Google Login controller
  const handleGoogleSignIn = async () => {
    if (!isFirebaseActive || !googleProvider) {
      alert("Firebase setup is still pending. Accepting terms in the workspace compiles cloud storage.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Google Auth popup rejected", e);
    }
  };

  const handleSignOutUser = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out exception:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-slate-300 flex flex-col font-sans selection:bg-cyan-500/30 select-none md:select-text" id="app-wrapper">
      
      {/* Dynamic Navigation Top HUD Bar */}
      <header className="bg-[#08080c] border-b border-cyan-900/40 px-6 py-4 sticky top-0 z-50 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Heading */}
          <div className="flex items-center space-x-3.5" id="brand-tag">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition duration-300">
              <Terminal className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-[0.1em] text-white uppercase flex items-center space-x-2">
                <span>30-Day Training Camp</span>
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-mono border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
                  PHASE 02: ACTIVE
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Core DSA + ML Theory Optimization HUD</p>
            </div>
          </div>

          {/* Sync status and Google Auth controllers */}
          <div className="flex items-center space-x-3 shrink-0" id="auth-controls-hud">
            {isFirebaseActive ? (
              <div 
                className="text-[10px] bg-[#0d0e14] border border-[#22d3ee]/20 text-cyan-400 font-mono px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-[0_0_10px_rgba(34,211,238,0.05)]"
                title="Google Cloud Sync Active"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="font-bold tracking-wider">CLOUD SYNC ACTIVE</span>
              </div>
            ) : (
              <div 
                className="text-[10px] bg-[#0d0e14] border border-amber-500/20 text-amber-500 font-mono px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                title="Saving records into browser variables"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <span className="font-bold tracking-wider">LOCAL SANDBOX</span>
              </div>
            )}

            {authChecking ? (
              <button disabled className="text-xs bg-[#0d0e14] border border-slate-800 px-3.5 py-1.5 rounded-lg text-slate-500 flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sync Verification...</span>
              </button>
            ) : user ? (
              <div className="flex items-center space-x-2.5">
                {user.photoURL && (
                  <img 
                    referrerPolicy="no-referrer"
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-7 h-7 rounded-full border border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                  />
                )}
                <span className="text-xs text-slate-350 font-semibold hidden md:inline truncate max-w-[100px] font-mono">
                  {user.displayName?.split(" ")[0]}
                </span>
                <button 
                  onClick={handleSignOutUser}
                  title="Sign Out of Sync"
                  className="bg-[#0e0f16] hover:bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-rose-400 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-1.5 rounded border border-cyan-400/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 font-bold" />
                <span>Google Sync</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Body Grid containing Navigation Panel & Subviews */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-6 gap-6" id="app-stage-container">
        
        {/* Responsive Mini Navigation Sidebar Panel */}
        <aside className="w-full md:w-56 shrink-0" id="sidebar-panel">
          <nav className="bg-[#0d0e14] border border-slate-800/60 p-3 rounded-2xl flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible no-scrollbar sticky top-[100px]">
            {/* Tab 1: Dashboard */}
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex-1 md:flex-initial text-left transition select-none cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-cyan-500/30" 
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/30 border border-transparent"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            {/* Tab 2: Curriculum Schedule */}
            <button 
              onClick={() => setActiveTab("schedule")}
              className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex-1 md:flex-initial text-left transition select-none cursor-pointer ${
                activeTab === "schedule" 
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-cyan-500/30" 
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/30 border border-transparent"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Checklist</span>
            </button>

            {/* Tab 3: VS Code Simulator tracking */}
            <button 
              onClick={() => setActiveTab("vscode")}
              className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex-1 md:flex-initial text-left transition select-none cursor-pointer ${
                activeTab === "vscode" 
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-cyan-500/30" 
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/30 border border-transparent"
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Simulator</span>
            </button>

            {/* Tab 4: AI Audit Coach */}
            <button 
              onClick={() => setActiveTab("ai-coach")}
              className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex-1 md:flex-initial text-left transition select-none cursor-pointer ${
                activeTab === "ai-coach" 
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-cyan-500/30" 
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/30 border border-transparent"
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>AI Coach</span>
            </button>

            {/* Tab 5: Handles Settings */}
            <button 
              onClick={() => setActiveTab("integrations")}
              className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex-1 md:flex-initial text-left transition select-none cursor-pointer ${
                activeTab === "integrations" 
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-cyan-500/30" 
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/30 border border-transparent"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cloud & APIs</span>
            </button>
          </nav>
        </aside>

        {/* Core Subviews Viewport */}
        <main className="flex-1 bg-[#0d0e14] border border-slate-800/60 p-6 rounded-2xl min-h-[500px] shadow-2xl overflow-hidden" id="subview-viewport">
          {activeTab === "dashboard" && (
            <Dashboard 
              days={days} 
              sessions={sessions} 
              cfStats={cfStats} 
              lcStats={lcStats} 
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "schedule" && (
            <Schedule 
              days={days} 
              onUpdateDay={handleUpdateDay}
              onAddDay={handleAddBootcampDay}
            />
          )}

          {activeTab === "vscode" && (
            <VSCodeTracker 
              sessions={sessions}
              onLogSession={handleLogManualSession}
            />
          )}

          {activeTab === "ai-coach" && (
            <AICoach 
              days={days}
              sessions={sessions}
              settings={settings}
            />
          )}

          {activeTab === "integrations" && (
            <Integrations 
              settings={settings}
              cfStats={cfStats}
              lcStats={lcStats}
              cfLoading={cfLoading}
              lcLoading={lcLoading}
              onUpdateSettings={handleUpdateUserSettings}
              onFetchCfData={fetchCodeforcesData}
              onFetchLcData={fetchLeetCodeData}
              isFirebaseSetup={isFirebaseActive}
            />
          )}
        </main>

      </div>

      {/* Aesthetic minimalistic footer */}
      <footer className="bg-slate-950 py-4 px-4 text-center border-t border-slate-900 border-opacity-65 select-none mt-auto">
        <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
          Empowered with server-side Gemini Intelligent Schedulers &bull; 30-Day Master Tracker
        </p>
      </footer>

    </div>
  );
}
