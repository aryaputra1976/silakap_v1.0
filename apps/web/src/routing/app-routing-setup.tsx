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
import { SopDashboardPage } from '@/pages/workspace/sop-dashboard-page';
import { SopMapPage } from '@/pages/workspace/sop-map-page';
import { SopListPage } from '@/pages/workspace/sop-list-page';
import { SopDetailPage } from '@/pages/workspace/sop-detail-page';
import { SopMonitoringPage } from '@/pages/workspace/sop-monitoring-page';
import { SopDocumentVerificationPage } from '@/pages/workspace/sop-document-verification-page';
import { SopRealizationPage } from '@/pages/workspace/sop-realization-page';
import { SopRealizationDetailPage } from '@/pages/workspace/sop-realization-detail-page';
import { SopReportPage } from '@/pages/workspace/sop-report-page';
import { KinerjaBidangDashboardPage } from '@/pages/workspace/kinerja-bidang-dashboard-page';
import { KinerjaBidangSopPage } from '@/pages/workspace/kinerja-bidang-sop-page';
import { KinerjaBidangTargetsPage } from '@/pages/workspace/kinerja-bidang-targets-page';
import { KinerjaBidangRealizationsPage } from '@/pages/workspace/kinerja-bidang-realizations-page';
import { KinerjaBidangReportPage } from '@/pages/workspace/kinerja-bidang-report-page';
import { LayananKepegawaianPage } from '@/pages/workspace/layanan-kepegawaian-page';
import { LayananVerificationPage } from '@/pages/workspace/layanan-verification-page';
import { LayananSlaPage } from '@/pages/workspace/layanan-sla-page';
import { LayananDelayPage } from '@/pages/workspace/layanan-delay-page';
import { LayananSatisfactionPage } from '@/pages/workspace/layanan-satisfaction-page';
import { LayananReportPage } from '@/pages/workspace/layanan-report-page';
import { OpdDashboardPage } from '@/pages/workspace/opd-dashboard-page';
import { OpdDocumentUploadPage } from '@/pages/workspace/opd-document-upload-page';
import { OpdDocumentsPage } from '@/pages/workspace/opd-documents-page';
import { OpdLayananCreatePage } from '@/pages/workspace/opd-layanan-create-page';
import { OpdLayananPage } from '@/pages/workspace/opd-layanan-page';
import { OpdSidataPemutakhiranPage } from '@/pages/workspace/opd-sidata-pemutakhiran-page';
import { OpdSipensiunCreatePage } from '@/pages/workspace/opd-sipensiun-create-page';
import { OpdSipensiunPage } from '@/pages/workspace/opd-sipensiun-page';
import { OpdSubmissionDetailPage } from '@/pages/workspace/opd-submission-detail-page';
import SianalitikPage from '@/pages/workspace/sianalitik-page';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout1 />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* PORTAL OPD */}
          <Route path="/opd" element={<Navigate to="/opd/dashboard" replace />} />
          <Route path="/opd/dashboard" element={<OpdDashboardPage />} />
          <Route path="/opd/layanan" element={<OpdLayananPage />} />
          <Route path="/opd/layanan/ajukan" element={<OpdLayananCreatePage />} />
          <Route path="/opd/layanan/perbaikan" element={<OpdLayananPage mode="revision" />} />
          <Route path="/opd/layanan/riwayat" element={<OpdLayananPage mode="history" />} />
          <Route path="/opd/layanan/:id" element={<OpdSubmissionDetailPage />} />
          <Route path="/opd/sipensiun" element={<OpdSipensiunPage />} />
          <Route path="/opd/sipensiun/ajukan" element={<OpdSipensiunCreatePage />} />
          <Route path="/opd/sipensiun/status" element={<OpdSipensiunPage mode="status" />} />
          <Route path="/opd/sipensiun/perbaikan" element={<OpdSipensiunPage mode="revision" />} />
          <Route path="/opd/sipensiun/:id" element={<OpdSubmissionDetailPage />} />
          <Route path="/opd/sidata/pemutakhiran" element={<OpdSidataPemutakhiranPage />} />
          <Route path="/opd/sidata/status" element={<OpdSidataPemutakhiranPage mode="status" />} />
          <Route path="/opd/sidata/dokumen" element={<OpdSidataPemutakhiranPage mode="documents" />} />
          <Route path="/opd/dokumen" element={<OpdDocumentsPage />} />
          <Route path="/opd/dokumen/upload" element={<OpdDocumentUploadPage />} />
          <Route path="/opd/dokumen/perbaikan" element={<OpdDocumentsPage mode="revision" />} />

          {/* KINERJA BIDANG / SOP & RHK */}
          <Route path="/kinerja-bidang" element={<KinerjaBidangDashboardPage />} />
          <Route path="/kinerja-bidang/sop" element={<KinerjaBidangSopPage />} />
          <Route path="/kinerja-bidang/targets" element={<KinerjaBidangTargetsPage />} />
          <Route path="/kinerja-bidang/realizations" element={<KinerjaBidangRealizationsPage />} />
          <Route path="/kinerja-bidang/report" element={<KinerjaBidangReportPage />} />
          <Route path="/kinerja-bidang/sop/map" element={<SopMapPage />} />
          <Route path="/kinerja-bidang/sop/:id" element={<SopDetailPage />} />
          <Route path="/kinerja-bidang/dashboard-rhk" element={<SopDashboardPage />} />
          <Route path="/kinerja-bidang/sop-list" element={<SopListPage />} />
          <Route path="/kinerja-bidang/monitoring" element={<SopMonitoringPage />} />
          <Route path="/kinerja-bidang/realisasi" element={<SopRealizationPage />} />
          <Route path="/kinerja-bidang/realisasi/:id" element={<SopRealizationDetailPage />} />
          <Route path="/kinerja-bidang/laporan" element={<SopReportPage />} />

          {/* SIDATA ASN */}
          <Route path="/sidata/dashboard" element={<SidataDashboardPage />} />
          <Route path="/sidata/asn" element={<SidataAsnPage />} />
          <Route path="/sidata/asn/:id" element={<SidataAsnDetailPage />} />
          <Route path="/sidata/dms-data-kepegawaian" element={<SopDocumentVerificationPage />} />
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

          {/* SIANALITIK */}
          <Route path="/sianalitik" element={<SianalitikPage />} />

          {/* LAYANAN KEPEGAWAIAN */}
          <Route path="/layanan" element={<LayananKepegawaianPage />} />
          <Route path="/layanan/verifikasi" element={<LayananVerificationPage />} />
          <Route path="/layanan/sla" element={<LayananSlaPage />} />
          <Route path="/layanan/keterlambatan" element={<LayananDelayPage />} />
          <Route path="/layanan/kepuasan" element={<LayananSatisfactionPage />} />
          <Route path="/layanan/laporan" element={<LayananReportPage />} />

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
