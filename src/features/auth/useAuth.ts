import { useAuthStore, canManage, roleIs } from "@/stores/authStore";
import type { UserRole } from "@/types/database";

export function useAuth() {
  const { status, session, profile } = useAuthStore();
  const role = profile?.role;
  return {
    status,
    session,
    profile,
    role,
    userId: session?.user.id,
    isAuthenticated: status === "authenticated",
    canManageFinance: canManage(role),
    canManageInvoices: canManage(role),
    canManageProjects: canManage(role),
    isOwner: role === "owner",
    can: (...allowed: UserRole[]) => roleIs(role, ...allowed),
    /**
     * Who may edit a project: owners/co-owners always; otherwise only the
     * assigned members or the project manager (mirrors RLS).
     */
    canEditProject: (project: { assigned_to: string[]; project_manager: string | null }) => {
      if (canManage(role)) return true;
      const uid = session?.user.id;
      if (!uid) return false;
      return project.assigned_to.includes(uid) || project.project_manager === uid;
    },
  };
}
