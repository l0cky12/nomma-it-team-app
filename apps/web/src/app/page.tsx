import Link from "next/link";

export default function Home() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8">
      <h2 className="text-2xl font-semibold text-slate-900">Welcome</h2>
      <p className="mt-2 text-slate-600">Use the left navigation to access IT workflows.</p>
      <Link className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" href="/dashboard">
        Go to Dashboard
      </Link>
    </div>
  );
}
