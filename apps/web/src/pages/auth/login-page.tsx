import { useState, type FormEvent } from 'react';
import { Building2, Loader2, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/session';
import { ActionButton, ErrorAlert, Field, inputClass, StatusBadge } from '@/components/workspace/ui';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Login gagal diproses');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-zinc-100 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="hidden border-r border-zinc-800 bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Building2 className="size-6" />
            </div>
            <div>
              <div className="text-xl font-semibold">SILAKAP</div>
              <div className="text-sm text-zinc-400">BKPSDM Kabupaten Tolitoli</div>
            </div>
          </div>
          <div className="mt-12 max-w-xl">
            <StatusBadge value="ENTERPRISE WORKSPACE" tone="info" />
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal">
              Kendali layanan ASN, workflow, dan arsip dalam satu ruang kerja.
            </h1>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Login terhubung ke backend SILAKAP dengan proteksi JWT dan RBAC untuk operasional BKPSDM.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-zinc-300">
          {['SIDATA ASN', 'SIAP Workflow Engine', 'SIPENSIUN Pilot', 'SIARSIP Document Vault'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <ShieldCheck className="size-4 text-emerald-400" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <main className="flex items-center justify-center p-6">
        <form className="w-full max-w-md rounded-lg border border-border bg-white p-7 shadow-sm" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">Masuk Workspace</h2>
              <p className="text-sm text-muted-foreground">Gunakan akun backend SILAKAP.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {error ? <ErrorAlert message={error} /> : null}
            <Field label="Username">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  className={`${inputClass} w-full pl-10`}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  className={`${inputClass} w-full pl-10`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </div>
            </Field>
            <ActionButton disabled={submitting} icon={submitting ? Loader2 : ShieldCheck} type="submit">
              {submitting ? 'Memproses...' : 'Login'}
            </ActionButton>
          </div>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-muted-foreground">
            Default development: username <span className="font-semibold text-zinc-800">admin</span>, password{' '}
            <span className="font-semibold text-zinc-800">admin123</span>.
          </div>
        </form>
      </main>
    </div>
  );
}
