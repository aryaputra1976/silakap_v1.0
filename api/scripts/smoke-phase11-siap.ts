type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type LoginResult = {
  user: {
    id: string;
    username: string;
    name: string;
    roles: string[];
    unitKerjaId: string | null;
  };
  accessToken: string;
};

type WorklogResult = {
  id: string;
  status: string;
  title: string;
};

const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

const PASSWORD = process.env.PILOT_PASSWORD ?? 'pilot123';

const users = {
  kaban: 'pilot.kaban',
  kabid: 'pilot.kabid.ppik',
  staf: 'pilot.analis.pertama',
};

async function main() {
  console.log('Phase 11 SIAP smoke test');
  console.log('API:', API_BASE_URL);

  const kaban = await login(users.kaban);
  const kabid = await login(users.kabid);
  const staf = await login(users.staf);

  assert(kaban.user.roles.includes('KEPALA_BADAN'), 'Kaban role tidak sesuai');
  assert(kabid.user.roles.includes('KABID'), 'Kabid role tidak sesuai');
  assert(
    staf.user.roles.includes('ANALIS_PERTAMA'),
    'Staf role tidak sesuai',
  );

  console.log('Login multi-role sukses.');

  const created = await post<WorklogResult>(
    '/siap/worklogs',
    staf.accessToken,
    {
      workDate: new Date().toISOString().slice(0, 10),
      category: 'PILOT_TEST',
      title: `Pilot Phase 11 Worklog ${Date.now()}`,
      description:
        'Smoke test Phase 11: staf membuat buku kerja harian dari API.',
      output: '1 buku kerja smoke test dibuat',
      volume: 1,
      obstacle: 'Tidak ada',
    },
  );

  assert(created.status === 'DRAFT', 'Create worklog harus DRAFT');
  console.log('Create worklog sukses:', created.id);

  const submitted = await post<WorklogResult>(
    `/siap/worklogs/${created.id}/submit`,
    staf.accessToken,
  );

  assert(submitted.status === 'SUBMITTED', 'Submit worklog harus SUBMITTED');
  console.log('Submit worklog sukses:', submitted.status);

  const team = await get<{
    items: WorklogResult[];
    total: number;
  }>(`/siap/worklogs/team?status=SUBMITTED`, kabid.accessToken);

  assert(team.total >= 1, 'Team list Kabid harus menemukan worklog SUBMITTED');
  console.log('Team review list sukses. total:', team.total);

  const approved = await post<WorklogResult>(
    `/siap/worklogs/${created.id}/approve`,
    kabid.accessToken,
    {
      note: 'Smoke Phase 11: buku kerja disetujui.',
    },
  );

  assert(approved.status === 'APPROVED', 'Approve worklog harus APPROVED');
  console.log('Approve worklog sukses:', approved.status);

  const teamDashboard = await get<{
    summary: {
      totalStaff: number;
      totalWorklogsInPeriod: number;
      pendingReview: number;
    };
    byStaff: unknown[];
  }>('/siap/worklogs/dashboard/team', kabid.accessToken);

  assert(
    typeof teamDashboard.summary.totalStaff === 'number',
    'Dashboard Kabid tidak valid',
  );

  console.log('Dashboard Kabid sukses:', teamDashboard.summary);

  const executiveDashboard = await get<{
    summary: {
      totalStaff: number;
      totalWorklogsInPeriod: number;
    };
    byUnit: unknown[];
    executiveNotes: unknown;
  }>('/siap/worklogs/dashboard/executive', kaban.accessToken);

  assert(
    Array.isArray(executiveDashboard.byUnit),
    'Dashboard Kaban byUnit tidak valid',
  );

  console.log('Dashboard Kaban sukses:', executiveDashboard.summary);

  const csv = await download(
    '/siap/worklogs/export/excel',
    kabid.accessToken,
  );

  assert(csv.byteLength > 0, 'Export Excel/CSV kosong');
  console.log('Export Excel/CSV sukses. bytes:', csv.byteLength);

  const pdf = await download('/siap/worklogs/export/pdf', kabid.accessToken);

  assert(pdf.byteLength > 0, 'Export PDF kosong');
  console.log('Export PDF sukses. bytes:', pdf.byteLength);

  console.log('Phase 11 smoke test selesai: SUKSES');
}

async function login(username: string) {
  return post<LoginResult>('/auth/login', undefined, {
    username,
    password: PASSWORD,
  });
}

async function get<T>(path: string, token: string) {
  return request<T>(path, {
    method: 'GET',
    token,
  });
}

async function post<T>(path: string, token?: string, body?: unknown) {
  return request<T>(path, {
    method: 'POST',
    token,
    body,
  });
}

async function download(path: string, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Download gagal ${response.status}: ${text}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function request<T>(
  path: string,
  options: {
    method: 'GET' | 'POST';
    token?: string;
    body?: unknown;
  },
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Response bukan JSON ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T> | { message?: string };

  if (!response.ok) {
    throw new Error(
      'message' in payload && payload.message
        ? payload.message
        : `Request gagal ${response.status}`,
    );
  }

  if ('data' in payload) {
    return payload.data;
  }

  throw new Error('Format response API tidak valid');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error('Phase 11 smoke test GAGAL');
  console.error(error);
  process.exit(1);
});