"use client";

import { FormEvent, useState } from "react";
import { ReviewConfirm } from "./review-confirm";

type Technician = { id: string; name: string; email: string };
type Ticket = { id: string; status: string; asset: { assetTag: string } };

export function CreateRepairForm({ technicians }: { technicians: Technician[] }) {
  const [assetTag, setAssetTag] = useState("");
  const [issue, setIssue] = useState("");
  const [technicianId, setTechnicianId] = useState(technicians[0]?.id ?? "");
  const [eta, setEta] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [status, setStatus] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/workflows/repairs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetTag, issue, technicianId, eta: eta ? new Date(eta).toISOString() : undefined, confirm: true }),
    });
    const json = await response.json();
    setStatus(response.ok ? "Repair ticket created" : json.error ?? "Failed");
  };

  return (
    <form className="space-y-3 rounded-md border p-4" onSubmit={submit}>
      <h3 className="font-semibold">Create Repair Ticket</h3>
      <input className="w-full rounded border p-2" placeholder="Asset tag" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} required />
      <textarea className="w-full rounded border p-2" placeholder="Issue description" value={issue} onChange={(e) => setIssue(e.target.value)} required />
      <select className="w-full rounded border p-2" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
        {technicians.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
      </select>
      <input className="w-full rounded border p-2" type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} />
      {showReview && <ReviewConfirm title="Create Repair Ticket" snapshot={{ "Asset Tag": assetTag, Technician: technicianId }} systems={["NOMMA DB", "Snipe-IT"]} />}
      <div className="flex gap-2">
        <button type="button" className="rounded bg-slate-600 px-3 py-2 text-white" onClick={() => setShowReview((v) => !v)}>{showReview ? "Hide Review" : "Review"}</button>
        <button type="submit" className="rounded bg-blue-700 px-3 py-2 text-white" disabled={!showReview}>Confirm</button>
      </div>
      {status && <p className="text-sm">{status}</p>}
    </form>
  );
}

export function UpdateRepairForm({ tickets }: { tickets: Ticket[] }) {
  const [ticketId, setTicketId] = useState(tickets[0]?.id ?? "");
  const [status, setStatus] = useState("DIAGNOSED");
  const [note, setNote] = useState("");
  const [review, setReview] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/workflows/repairs/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status, note, confirm: true }),
    });
    const json = await response.json();
    setMessage(response.ok ? "Status updated" : json.error ?? "Failed");
  };

  return (
    <form className="space-y-3 rounded-md border p-4" onSubmit={submit}>
      <h3 className="font-semibold">Update Repair Status</h3>
      <select className="w-full rounded border p-2" value={ticketId} onChange={(e) => setTicketId(e.target.value)}>
        {tickets.map((t) => <option key={t.id} value={t.id}>{t.asset.assetTag} - {t.status}</option>)}
      </select>
      <select className="w-full rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="RECEIVED">RECEIVED</option>
        <option value="DIAGNOSED">DIAGNOSED</option>
        <option value="IN_REPAIR">IN_REPAIR</option>
        <option value="READY">READY</option>
        <option value="RETURNED">RETURNED</option>
      </select>
      <input className="w-full rounded border p-2" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      {review && <ReviewConfirm title="Update Repair Status" snapshot={{ Ticket: ticketId, Status: status }} systems={["NOMMA DB", "Snipe-IT"]} />}
      <div className="flex gap-2">
        <button type="button" className="rounded bg-slate-600 px-3 py-2 text-white" onClick={() => setReview((v) => !v)}>{review ? "Hide Review" : "Review"}</button>
        <button type="submit" className="rounded bg-emerald-700 px-3 py-2 text-white" disabled={!review}>Confirm</button>
      </div>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
