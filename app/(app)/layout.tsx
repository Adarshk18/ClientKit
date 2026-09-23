import { AppNav } from "@/components/app-nav";
import { TrackAppSession } from "@/components/track";
import { requireWorkspace } from "@/lib/auth";
import { signedLogoUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  const logo = await signedLogoUrl(workspace.logo_url);
  return (
    <div className="min-h-dvh">
      <TrackAppSession />
      <AppNav workspaceName={workspace.name} logoSrc={logo} email={user.email ?? ""} />
      <main className="ck-page-pad mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
