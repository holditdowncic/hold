"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";

const supabaseUrl = "https://krqghaxflwyxwcapbedf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycWdoYXhmbHd5eHdjYXBiZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODQ3NTAsImV4cCI6MjA4NjU2MDc1MH0.example";

const categories = [
  { key: "community_father", title: "Community Father Figure" },
  { key: "everyday_hero", title: "Everyday Hero" },
  { key: "mentor_year", title: "Mentor of the Year" },
  { key: "resilient_man", title: "Resilient Man" },
  { key: "always_there", title: "The Man Who's Always There" },
  { key: "young_role_model", title: "Young Male Role Model" },
];

const ADMIN_PASSWORD = "Zaniah06!";

export default function AdminResultsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<Record<string, { name: string; count: number }[]>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: votes, error } = await supabase
        .from("votes")
        .select("category_key, nominee_name, reason");

      if (error) {
        console.error("Error fetching votes:", error);
        return;
      }

      // Count votes per category
      const categoryResults: Record<string, Map<string, number>> = {};
      
      votes?.forEach((vote) => {
        if (!categoryResults[vote.category_key]) {
          categoryResults[vote.category_key] = new Map();
        }
        const current = categoryResults[vote.category_key].get(vote.nominee_name) || 0;
        categoryResults[vote.category_key].set(vote.nominee_name, current + 1);
      });

      // Convert to sorted arrays
      const sortedResults: Record<string, { name: string; count: number }[]> = {};
      categories.forEach((cat) => {
        const catMap = categoryResults[cat.key] || new Map();
        sortedResults[cat.key] = Array.from(catMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
      });

      setResults(sortedResults);
      setTotalVotes(votes?.length || 0);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const downloadCSV = () => {
    let csv = "Category,Nominee,Votes\n";
    categories.forEach((cat) => {
      const catResults = results[cat.key] || [];
      catResults.forEach((result) => {
        csv += `"${cat.title}","${result.name}",${result.count}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roots-wings-results-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl"
        >
          <h1 className="text-2xl font-bold text-blue-900 mb-4 text-center">
            Admin Login
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Roots & Wings Voting Results
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Voting Results
          </h1>
          <p className="text-white text-lg mb-4">
            Roots & Wings Community Awards 2026
          </p>
          <div className="bg-yellow-400 text-blue-900 inline-block px-6 py-2 rounded-full font-bold">
            Total Votes: {totalVotes}
          </div>
          <div className="mt-4">
            <button
              onClick={downloadCSV}
              className="bg-white hover:bg-gray-100 text-blue-900 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Download CSV
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="ml-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center text-white">Loading results...</div>
        ) : (
          <div className="grid gap-6">
            {categories.map((category, idx) => {
              const catResults = results[category.key] || [];
              return (
                <motion.div
                  key={category.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-lg p-6 shadow-lg"
                >
                  <h2 className="text-xl font-bold text-blue-900 mb-4">
                    {category.title}
                  </h2>
                  {catResults.length === 0 ? (
                    <p className="text-gray-500">No votes yet</p>
                  ) : (
                    <div className="space-y-2">
                      {catResults.map((result, rank) => (
                        <div
                          key={result.name}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            rank === 0
                              ? "bg-yellow-100 border-2 border-yellow-400"
                              : rank === 1
                              ? "bg-gray-100"
                              : rank === 2
                              ? "bg-orange-50"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold w-8">
                              {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`}
                            </span>
                            <span className="font-semibold text-lg">{result.name}</span>
                            {rank === 0 && (
                              <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-2 py-1 rounded">
                                WINNER
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-blue-900 text-lg">
                            {result.count} {result.count === 1 ? "vote" : "votes"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-white/60 text-sm">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
