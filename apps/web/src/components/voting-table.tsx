"use client";

import { useState } from "react";

type FeatureRow = {
  id: string;
  name: string;
  category: string;
  myVote: number | null;
  avgPriority: number | null;
  voteCount: number;
  perRole: Record<string, number>;
};

export function VotingTable({ rows }: { rows: FeatureRow[] }) {
  const [message, setMessage] = useState("");

  const grouped = rows.reduce<Record<string, FeatureRow[]>>((acc, row) => {
    acc[row.category] ??= [];
    acc[row.category].push(row);
    return acc;
  }, {});

  const onVote = async (featureId: string, priority: number) => {
    const response = await fetch("/api/voting/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId, priority }),
    });
    setMessage(response.ok ? "Vote saved. Refresh to see latest aggregate." : "Failed to save vote");
  };

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([category, features]) => (
        <section key={category} className="rounded-md border border-slate-200 bg-white">
          <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-2 font-semibold">{category}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-2">Feature</th>
                <th className="px-3 py-2">My Vote</th>
                <th className="px-3 py-2">Average</th>
                <th className="px-3 py-2">Votes</th>
                <th className="px-3 py-2">Per-role</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{f.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          className={`rounded px-2 py-1 ${f.myVote === n ? "bg-slate-900 text-white" : "bg-slate-100"}`}
                          onClick={() => onVote(f.id, n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">{f.avgPriority ? f.avgPriority.toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">{f.voteCount}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    C: {f.perRole.CADET_HELPER ?? 0} | T: {f.perRole.TECHNICIAN ?? 0} | A: {f.perRole.ADMIN ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {message && <p className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}
