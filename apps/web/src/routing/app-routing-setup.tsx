import { Route, Routes, Navigate } from 'react-router';
import { Layout1 } from '@/components/layouts/layout-1';
import { LoginPage } from '@/pages/auth/login-page';
import { DashboardPage } from '@/pages/workspace/dashboard-page';
import { SiapTasksPage } from '@/pages/workspace/siap-tasks-page';
import { SiarsipPage } from '@/pages/workspace/siarsip-page';
import { SidataAsnPage } from '@/pages/workspace/sidata-asn-page';
import { SipensiunDetailPage } from '@/pages/workspace/sipensiun-detail-page';
import { SipensiunListPage } from '@/pages/workspace/sipensiun-list-page';
import { ProtectedRoute } from './protected-route';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout1 />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sidata/asn" element={<SidataAsnPage />} />
          <Route path="/sipensiun" element={<SipensiunListPage />} />
          <Route path="/sipensiun/:id" element={<SipensiunDetailPage />} />
          <Route path="/siap/tasks" element={<SiapTasksPage />} />
          <Route path="/siarsip" element={<SiarsipPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
