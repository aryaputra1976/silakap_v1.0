import { Route, Routes, Navigate } from 'react-router';
import { Layout1 } from '@/components/layouts/layout-1';
import { SilakapWorkspacePage } from '@/pages/silakap-workspace/page';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<Layout1 />}>
        <Route path="/" element={<SilakapWorkspacePage />} />
        <Route path="/workspace" element={<SilakapWorkspacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
