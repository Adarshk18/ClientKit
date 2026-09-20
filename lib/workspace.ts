import { requireWorkspace } from "@/lib/auth";
import { logError } from "@/lib/logger";

export function assertWorkspaceOwns(
  resourceWorkspaceId: string,
  workspaceId: string,
): void {
  if (resourceWorkspaceId !== workspaceId) {
    const error = new Error("Not found");
    error.name = "NotFound";
    throw error;
  }
}

export async function ownerEmail(userId: string): Promise<string | null> {
  try {
    const { user } = await requireWorkspace();
    if (user.id !== userId) return user.email ?? null;
    return user.email ?? null;
  } catch (error) {
    logError("workspace.ownerEmail", error);
    return null;
  }
}
