import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "~/server/auth";
import AdminShell from "./_components/AdminShell";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");

  return (
    <AdminShell userEmail={session.user.email}>
      {children}
    </AdminShell>
  );
}
