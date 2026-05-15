import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/session';
import { toAbsoluteUrl } from '@/lib/helpers';
import { ErrorAlert } from '@/components/workspace/ui';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-dvh bg-[#dfe9f1] px-4 py-4 text-[#1f2c3d] sm:px-6 lg:h-dvh lg:overflow-hidden lg:px-10">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1370px] items-center gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[1fr_0.96fr] xl:gap-10">
        <section className="flex min-h-[560px] flex-col bg-[#edf4f9]/75 p-5 shadow-[24px_24px_80px_rgba(78,107,128,0.16)] lg:h-[calc(100dvh-2rem)] lg:min-h-0">
          <div className="flex h-9 items-center rounded-full bg-white/72 px-4 text-sm font-medium text-[#245d7f] shadow-[inset_8px_8px_18px_rgba(151,174,190,0.12),inset_-8px_-8px_18px_rgba(255,255,255,0.92)]">
            <span className="mr-2 size-2.5 rounded-full bg-gradient-to-br from-[#61cce1] to-[#2589b6]" />
            Portal Layanan ASN
          </div>

          <div className="mt-4 bg-[#e7eff5] p-4">
            <img
              alt="BKPSDM Kabupaten Tolitoli"
              className="h-[170px] w-full rounded-2xl object-cover object-left-top shadow-[0_16px_30px_rgba(74,106,130,0.16)]"
              src={toAbsoluteUrl('/media/bkpsdm/landing.png')}
            />
          </div>

          <div className="mt-5 max-w-[560px]">
            <h1 className="text-3xl font-semibold leading-tight tracking-normal text-[#2a7d99] sm:text-[2.25rem]">
              Sistem Informasi Layanan Kepegawaian Terintegrasi dan Akuntabel
            </h1>
          </div>

          <div className="mt-auto pt-5">
            <p className="max-w-[610px] text-sm leading-6 text-[#547fa1]">
              Mendukung proses administrasi ASN yang tertib, cepat, dan
              profesional dalam satu portal layanan digital.
            </p>
          </div>
        </section>

        <main className="flex min-h-[560px] items-center justify-center bg-[#edf4f9]/70 px-5 py-6 shadow-[24px_24px_80px_rgba(78,107,128,0.16)] sm:px-8 lg:h-[calc(100dvh-2rem)] lg:min-h-0">
          <form className="w-full max-w-[520px]" onSubmit={handleSubmit}>
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#e3edf5] shadow-[14px_14px_28px_rgba(150,174,193,0.3),-14px_-14px_28px_rgba(255,255,255,0.72)]">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-white/95 p-2 shadow-[inset_4px_4px_10px_rgba(150,174,193,0.12),inset_-4px_-4px_10px_rgba(255,255,255,0.9)]">
                <img
                  alt="Logo BKPSDM"
                  className="size-full object-contain"
                  src={toAbsoluteUrl('/media/bkpsdm/logo-bkpsdm.png')}
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-[2rem] font-bold leading-none tracking-normal text-[#1d2838]">
                Login SILAKAP
              </h2>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.32em] text-[#6688a6]">
                Sistem Layanan ASN
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              {error ? <ErrorAlert message={error} /> : null}

              <label className="grid gap-2 text-base font-medium text-[#3c7593]">
                Username
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-6 top-1/2 size-5 -translate-y-1/2 text-[#7894aa]" />
                  <input
                    className="h-14 w-full rounded-full border-0 bg-[#e7f0f7] px-8 pl-16 text-base font-medium text-[#233447] shadow-[inset_12px_12px_24px_rgba(153,176,193,0.22),inset_-12px_-12px_24px_rgba(255,255,255,0.72)] outline-none placeholder:text-[#8b9ab6] focus:ring-4 focus:ring-[#39b5d2]/25"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="grid gap-2 text-base font-medium text-[#3c7593]">
                Password
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-6 top-1/2 size-5 -translate-y-1/2 text-[#7894aa]" />
                  <input
                    className="h-14 w-full rounded-full border-0 bg-[#e7f0f7] px-14 pl-16 text-base font-medium text-[#233447] shadow-[inset_12px_12px_24px_rgba(153,176,193,0.22),inset_-12px_-12px_24px_rgba(255,255,255,0.72)] outline-none placeholder:text-[#8b9ab6] focus:ring-4 focus:ring-[#39b5d2]/25"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                  />
                  <button
                    aria-label={
                      showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                    }
                    className="absolute right-5 top-1/2 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[#7894aa] transition hover:bg-white/55 hover:text-[#2f6686]"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </label>

              <button
                className="mt-1 inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[#5fc9df] to-[#2aa7c8] text-base font-bold text-[#102131] shadow-[0_18px_28px_rgba(52,158,192,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submitting}
                type="submit"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>

              <button
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-[#edf5fb] text-base font-medium text-[#2f6686] shadow-[12px_12px_24px_rgba(153,176,193,0.22),-12px_-12px_24px_rgba(255,255,255,0.76)] transition hover:text-[#1f8aae]"
                type="button"
              >
                Register
              </button>

              <p className="text-center text-sm text-[#6b8298]">
                Lupa password? Hubungi administrator.
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
