"use client";

type Props = {
  title: string;
  snapshot: Record<string, string>;
  systems: string[];
};

export function ReviewConfirm({ title, snapshot, systems }: Props) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
      <h4 className="mb-2 font-semibold">Review & Confirm: {title}</h4>
      <ul className="mb-2 space-y-1">
        {Object.entries(snapshot).map(([key, value]) => (
          <li key={key}>
            <span className="font-medium">{key}:</span> {value}
          </li>
        ))}
      </ul>
      <p>
        Systems to update: <span className="font-medium">{systems.join(", ")}</span>
      </p>
    </div>
  );
}
