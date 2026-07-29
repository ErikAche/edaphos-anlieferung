import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-black text-edaphos-green">
              EDAPHOS
            </span>
            <nav className="flex gap-4 text-sm font-medium text-neutral-600">
              <Link href="/admin" className="hover:text-edaphos-black">
                Übersicht
              </Link>
              <Link
                href="/admin/anlieferungen"
                className="hover:text-edaphos-black"
              >
                Anlieferungen
              </Link>
              <Link href="/admin/export" className="hover:text-edaphos-black">
                Export
              </Link>
              <Link
                href="/admin/einstellungen"
                className="hover:text-edaphos-black"
              >
                Einstellungen
              </Link>
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-neutral-500 hover:text-edaphos-black"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
