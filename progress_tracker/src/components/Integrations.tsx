import React, { useState, useEffect } from "react";
import {
  Code,
  BookOpen,
  Save,
  RefreshCw,
  Cpu
} from "lucide-react";

export default function Integrations() {

  const [cfHandle, setCfHandle] = useState("");
  const [lcHandle, setLcHandle] = useState("");

  const [cfStats, setCfStats] = useState<any>(null);
  const [lcStats, setLcStats] = useState<any>(null);

  const [cfLoading, setCfLoading] = useState(false);
  const [lcLoading, setLcLoading] = useState(false);

  const [error, setError] = useState("");

  // =========================
  // ✅ CODEFORCES FETCH
  // =========================
  const fetchCodeforces = async () => {
    if (!cfHandle) return;

    setCfLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://codeforces.com/api/user.info?handles=${cfHandle}`
      );
      const data = await res.json();

      if (data.status !== "OK") throw new Error("Invalid CF handle");

      const user = data.result[0];

      // Get submissions for solved count
      const subRes = await fetch(
        `https://codeforces.com/api/user.status?handle=${cfHandle}`
      );
      const subData = await subRes.json();

      const solvedSet = new Set();
      subData.result.forEach((s: any) => {
        if (s.verdict === "OK") {
          solvedSet.add(s.problem.name);
        }
      });

      setCfStats({
        rating: user.rating,
        rank: user.rank,
        solved: solvedSet.size
      });

    } catch (err) {
      setError("Codeforces fetch failed");
    }

    setCfLoading(false);
  };

  // =========================
  // ✅ LEETCODE FETCH (GraphQL)
  // =========================
  const fetchLeetCode = async () => {
    if (!lcHandle) return;

    setLcLoading(true);
    setError("");

    try {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
          `,
          variables: { username: lcHandle }
        })
      });

      const data = await res.json();

      const stats =
        data.data.matchedUser.submitStats.acSubmissionNum;

      const parsed = {
        easy: stats.find((s: any) => s.difficulty === "Easy")?.count || 0,
        medium: stats.find((s: any) => s.difficulty === "Medium")?.count || 0,
        hard: stats.find((s: any) => s.difficulty === "Hard")?.count || 0
      };

      setLcStats({
        ...parsed,
        totalSolved: parsed.easy + parsed.medium + parsed.hard
      });

    } catch (err) {
      setError("LeetCode fetch failed");
    }

    setLcLoading(false);
  };

  // =========================
  // 🔥 BUTTON HANDLER
  // =========================
  const handleFetch = () => {
    if (!cfHandle && !lcHandle) {
      setError("Enter at least one handle");
      return;
    }

    fetchCodeforces();
    fetchLeetCode();
  };

  return (
    <div className="space-y-6">

      <h2 className="text-lg font-bold text-cyan-400">
        Competitive Profiles
      </h2>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      {/* INPUTS */}
      <div className="space-y-4">

        <div className="p-4 bg-slate-900 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Code size={16} />
            Codeforces
          </div>

          <input
            value={cfHandle}
            onChange={(e) => setCfHandle(e.target.value)}
            placeholder="Handle"
            className="w-full p-2 bg-slate-800 rounded"
          />
        </div>

        <div className="p-4 bg-slate-900 rounded">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} />
            LeetCode
          </div>

          <input
            value={lcHandle}
            onChange={(e) => setLcHandle(e.target.value)}
            placeholder="Username"
            className="w-full p-2 bg-slate-800 rounded"
          />
        </div>

        <button
          onClick={handleFetch}
          className="w-full bg-purple-500 p-2 rounded flex justify-center items-center gap-2"
        >
          <RefreshCw size={14} />
          Fetch Stats
        </button>
      </div>

      {/* STATS */}
      <div className="space-y-4">

        <div className="p-4 bg-slate-900 rounded">
          <h3>Codeforces</h3>

          {cfLoading ? (
            <p>Loading...</p>
          ) : cfStats ? (
            <>
              <p>Rating: {cfStats.rating}</p>
              <p>Rank: {cfStats.rank}</p>
              <p>Solved: {cfStats.solved}</p>
            </>
          ) : (
            <p>No data</p>
          )}
        </div>

        <div className="p-4 bg-slate-900 rounded">
          <h3>LeetCode</h3>

          {lcLoading ? (
            <p>Loading...</p>
          ) : lcStats ? (
            <>
              <p>Total: {lcStats.totalSolved}</p>
              <p>Easy: {lcStats.easy}</p>
              <p>Medium: {lcStats.medium}</p>
              <p>Hard: {lcStats.hard}</p>
            </>
          ) : (
            <p>No data</p>
          )}
        </div>

      </div>
    </div>
  );
}
