import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState, StatusBadge } from '@/components/workspace/ui';
import { useAuth } from '@/lib/auth/session';
import {
  canAccessRouteForRoles,
  getSafeRedirectPath,
} from '@/lib/rbac/route-access';

export function ProtectedRoute() {
  const location = useLocation();
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="p-6"><LoadingState label="Memeriksa sesi" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentPath = `${location.pathname}${location.search}`;

  if (!canAccessRouteForRoles(user.roles, currentPath)) {
    const redirectPath = getSafeRedirectPath(user.roles);

    if (redirectPath !== '/login' && location.pathname !== redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }

    return <ForbiddenState />;
  }

  return <Outlet />;
}

function ForbiddenState() {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-[#cfe1da] bg-white p-6 shadow-sm">
        <StatusBadge value="Akses Ditolak" tone="danger" />
        <h1 className="mt-4 text-xl font-semibold text-[#18343a]">
          Anda tidak memiliki akses ke halaman ini.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#51614c]">
          Sidebar dan route SILAKAP mengikuti role aktif pengguna. Hubungi admin
          BKPSDM jika akses kerja Anda perlu disesuaikan.
        </p>
      </div>
    </div>
  );
}
