import {
  Archive,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiConfig } from '@/config/api';

const stats = [
  { label: 'Approval pending', value: '0', icon: ShieldCheck },
  { label: 'Task berjalan', value: '0', icon: Inbox },
  { label: 'SLA merah', value: '0', icon: Clock },
  { label: 'Arsip final', value: '0', icon: Archive },
];

const workspaces = [
  { title: 'SIDATA', description: 'Master data ASN, unit organisasi, jabatan, golongan.', icon: Users },
  { title: 'SIAP', description: 'Case, workflow, task, SLA, timeline, dan audit.', icon: CheckCircle2 },
  { title: 'SIPENSIUN', description: 'Pilot layanan pensiun end-to-end.', icon: FileText },
  { title: 'SIANALITIK', description: 'Control room Kabid, workload, backlog, dan SLA.', icon: BarChart3 },
];

export function SilakapWorkspacePage() {
  return (
    <div className="container space-y-6">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle>SILAKAP Workspace</ToolbarPageTitle>
          <ToolbarDescription>Government Workforce Operating System</ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Badge variant="success" appearance="light">Phase 0</Badge>
          <Badge variant="outline">API: {apiConfig.baseUrl.replace(/^https?:\/\//, '')}</Badge>
        </ToolbarActions>
      </Toolbar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold text-mono">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Workspace Pertama</CardTitle>
              <CardDescription>Susunan awal mengikuti standar UI: case, task, dokumen, timeline, action.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {['Case Summary', 'Task Workspace', 'Document Workspace', 'Timeline', 'Action Panel'].map((item) => (
              <div key={item} className="rounded-md border border-border p-4">
                <div className="text-sm font-medium text-mono">{item}</div>
                <div className="mt-1 text-xs text-muted-foreground">Siap dihubungkan ke API roadmap.</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Domain Roadmap</CardTitle>
              <CardDescription>Modul utama yang sudah disiapkan route backend-nya.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {workspaces.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-mono">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
