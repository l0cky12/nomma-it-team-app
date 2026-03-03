import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100" type="submit">
        Sign Out
      </button>
    </form>
  );
}
