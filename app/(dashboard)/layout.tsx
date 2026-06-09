import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { Toaster } from "sonner";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const name = session.user?.name ?? "Usuario";
  const email = session.user?.email ?? "";
  const initials = getInitials(name);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        flex: 1,
        width: 0,
        minWidth: 0,
      }}
    >
      <Sidebar user={{ name, email, initials }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Topbar user={{ name, initials }} hasNotif />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 22px",
            background: "var(--bg3)",
          }}
        >
          {children}
        </main>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{ style: { fontFamily: "var(--f)", fontSize: 13 } }}
        />
      </div>
    </div>
  );
}
