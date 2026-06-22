import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import type { UserRole } from "@/types/database";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoader />;
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/** Guards a route subtree to specific roles; redirects elsewhere otherwise. */
export function RoleRoute({ allow, redirect = "/" }: { allow: UserRole[]; redirect?: string }) {
  const { role, status } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (!role || !allow.includes(role)) return <Navigate to={redirect} replace />;
  return <Outlet />;
}
