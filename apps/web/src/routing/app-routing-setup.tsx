import { Route, Routes, Navigate } from 'react-router';
import { Layout1 } from '@/components/layouts/layout-1';
import { LoginPage } from '@/pages/auth/login-page';
import { DashboardPage } from '@/pages/workspace/dashboard-page';
import { SiapTasksPage } from '@/pages/workspace/siap-tasks-page';
import { SiapWorklogsPage } from '@/pages/workspace/siap-worklogs-page';
import { SiapWorklogTeamPage } from '@/pages/workspace/siap-worklog-team-page';
import { SiarsipPage } from '@/pages/workspace/siarsip-page';
import { SidataAsnPage } from '@/pages/workspace/sidata-asn-page';
import { SidataAsnDetailPage } from '@/pages/workspace/sidata-asn-detail-page';
import { SidataDashboardPage } from '@/pages/workspace/sidata-dashboard-page';
import { SidataValidasiPage } from '@/pages/workspace/sidata-validasi-page';
import { SidataPemutakhiranPage } from '@/pages/workspace/sidata-pemutakhiran-page';
import { SidataImportSiasnPage } from '@/pages/workspace/sidata-import-siasn-page';
import { SidataImportExcelPage } from '@/pages/workspace/sidata-import-excel-page';
import { SidataImportReferensiPage } from '@/pages/workspace/sidata-import-referensi-page';
import { SidataImportMappingReferensiPage } from '@/pages/workspace/sidata-import-mapping-referensi-page';
import { SidataImportRiwayatPage } from '@/pages/workspace/sidata-import-riwayat-page';
import { SidataImportLogSinkronisasiPage } from '@/pages/workspace/sidata-import-log-sinkronisasi-page';
import { SidataRekonsiliasiPage } from '@/pages/workspace/sidata-rekonsiliasi-page';
import { SidataReferensiPage } from '@/pages/workspace/sidata-referensi-page';
import { SidataDokumenPage } from '@/pages/workspace/sidata-dokumen-page';
import { SidataLaporanPage } from '@/pages/workspace/sidata-laporan-page';
import { SipensiunDetailPage } from '@/pages/workspace/sipensiun-detail-page';
import { SipensiunListPage } from '@/pages/workspace/sipensiun-list-page';
import { ProtectedRoute } from './protected-route';
import { SiapWorklogDashboardPage } from '@/pages/workspace/siap-worklog-dashboard-page';
import { SiapWorklogExecutivePage } from '@/pages/workspace/siap-worklog-executive-page';
import { DmsDashboardPage } from '@/pages/workspace/dms-dashboard-page';
import { DmsDocumentsPage } from '@/pages/workspace/dms-documents-page';
import { DmsDocumentDetailPage } from '@/pages/workspace/dms-document-detail-page';
import { DmsUploadPage } from '@/pages/workspace/dms-upload-page';
import { DmsVerificationPage } from '@/pages/workspace/dms-verification-page';
import { DmsReportsPage } from '@/pages/workspace/dms-reports-page';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout1 />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* SIDATA ASN */}
          <Route path="/sidata/dashboard" element={<SidataDashboardPage />} />
          <Route path="/sidata/asn" element={<SidataAsnPage />} />
          <Route path="/sidata/asn/:id" element={<SidataAsnDetailPage />} />
          <Route path="/sidata/validasi" element={<SidataValidasiPage />} />
          <Route path="/sidata/pemutakhiran" element={<SidataPemutakhiranPage />} />
          <Route path="/sidata/import/siasn" element={<SidataImportSiasnPage />} />
          <Route path="/sidata/import/excel" element={<SidataImportExcelPage />} />
          <Route path="/sidata/import/referensi" element={<SidataImportReferensiPage />} />
          <Route path="/sidata/import/mapping-referensi" element={<SidataImportMappingReferensiPage />} />
          <Route path="/sidata/import/riwayat" element={<SidataImportRiwayatPage />} />
          <Route path="/sidata/import/log-sinkronisasi" element={<SidataImportLogSinkronisasiPage />} />
          <Route path="/sidata/rekonsiliasi" element={<SidataRekonsiliasiPage />} />
          <Route path="/sidata/referensi" element={<SidataReferensiPage />} />
          <Route path="/sidata/dokumen" element={<SidataDokumenPage />} />
          <Route path="/sidata/laporan" element={<SidataLaporanPage />} />

          {/* DMS */}
          <Route path="/dms" element={<DmsDashboardPage />} />
          <Route path="/dms/documents" element={<DmsDocumentsPage />} />
          <Route path="/dms/documents/:id" element={<DmsDocumentDetailPage />} />
          <Route path="/dms/upload" element={<DmsUploadPage />} />
          <Route path="/dms/verification" element={<DmsVerificationPage />} />
          <Route path="/dms/reports" element={<DmsReportsPage />} />

          {/* SIPENSIUN */}
          <Route path="/sipensiun" element={<SipensiunListPage />} />
          <Route path="/sipensiun/:id" element={<SipensiunDetailPage />} />

          {/* SIAP */}
          <Route path="/siap/tasks" element={<SiapTasksPage />} />
          <Route path="/siap/worklogs" element={<SiapWorklogsPage />} />
          <Route path="/siap/worklogs/team" element={<SiapWorklogTeamPage />} />
          <Route path="/siap/worklogs/dashboard" element={<SiapWorklogDashboardPage />} />
          <Route path="/siap/worklogs/executive" element={<SiapWorklogExecutivePage />} />

          <Route path="/siarsip" element={<SiarsipPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
