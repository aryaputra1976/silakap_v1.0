import { Navigate, Outlet } from 'react-router-dom';
import { LoadingState } from '@/components/workspace/ui';
import { useAuth } from '@/lib/auth/session';

export function ProtectedRoute() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="p-6"><LoadingState label="Memeriksa sesi" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
