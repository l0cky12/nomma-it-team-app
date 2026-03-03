"use client";

import { FormEvent, useState } from "react";
import { ReviewConfirm } from "./review-confirm";

type User = { id: string; name: string; email: string };

export function CheckoutForm({ users }: { users: User[] }) {
  const [assetTag, setAssetTag] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState(users[0]?.id ?? "");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [status, setStatus] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/workflows/devices/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetTag, assigneeUserId, expectedReturnDate: new Date(expectedReturnDate).toISOString(), notes, confirm: true }),
    });
    const json = await response.json();
    setStatus(response.ok ? "Checkout complete" : json.error ?? "Checkout failed");
    if (response.ok) {
      setAssetTag("");
      setNotes("");
      setShowReview(false);
    }
  };

  return (
    <form className="space-y-3 rounded-md border p-4" onSubmit={onSubmit}>
      <h3 className="font-semibold">Laptop Check-Out</h3>
      <input className="w-full rounded border p-2" placeholder="Asset tag" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} required />
      <select className="w-full rounded border p-2" value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)} required>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
        ))}
      </select>
      <input className="w-full rounded border p-2" type="datetime-local" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} required />
      <textarea className="w-full rounded border p-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {showReview && (
        <ReviewConfirm
          title="Laptop Check-Out"
          snapshot={{ "Asset Tag": assetTag, "Assignee": assigneeUserId, "Expected Return": expectedReturnDate || "N/A" }}
          systems={["NOMMA DB", "Snipe-IT", "Google (if mapped)"]}
        />
      )}

      <div className="flex gap-2">
        <button type="button" className="rounded bg-slate-600 px-3 py-2 text-white" onClick={() => setShowReview((v) => !v)}>
          {showReview ? "Hide Review" : "Review"}
        </button>
        <button type="submit" className="rounded bg-blue-700 px-3 py-2 text-white" disabled={!showReview}>Confirm</button>
      </div>
      {status && <p className="text-sm text-slate-700">{status}</p>}
    </form>
  );
}

export function CheckinForm() {
  const [assetTag, setAssetTag] = useState("");
  const [notes, setNotes] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [status, setStatus] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/workflows/devices/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetTag, notes, confirm: true }),
    });
    const json = await response.json();
    setStatus(response.ok ? "Check-in complete" : json.error ?? "Check-in failed");
    if (response.ok) {
      setAssetTag("");
      setNotes("");
      setShowReview(false);
    }
  };

  return (
    <form className="space-y-3 rounded-md border p-4" onSubmit={onSubmit}>
      <h3 className="font-semibold">Laptop Check-In</h3>
      <input className="w-full rounded border p-2" placeholder="Asset tag" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} required />
      <textarea className="w-full rounded border p-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {showReview && <ReviewConfirm title="Laptop Check-In" snapshot={{ "Asset Tag": assetTag }} systems={["NOMMA DB", "Snipe-IT", "Google (if mapped)"]} />}
      <div className="flex gap-2">
        <button type="button" className="rounded bg-slate-600 px-3 py-2 text-white" onClick={() => setShowReview((v) => !v)}>{showReview ? "Hide Review" : "Review"}</button>
        <button type="submit" className="rounded bg-emerald-700 px-3 py-2 text-white" disabled={!showReview}>Confirm</button>
      </div>
      {status && <p className="text-sm text-slate-700">{status}</p>}
    </form>
  );
}
