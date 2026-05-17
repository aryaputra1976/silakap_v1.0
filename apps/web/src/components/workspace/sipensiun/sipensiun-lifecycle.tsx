import { CheckCircle2, Circle } from 'lucide-react';
import { getSipensiunJenisConfig } from '@/lib/sipensiun/sipensiun-data';

interface SipensiunLifecycleProps {
  jenisKey: string;
  /** Current state from backend, e.g. 'DRAFT', 'VERIFICATION', 'APPROVAL', 'COMPLETED' */
  currentState?: string;
}

export function SipensiunLifecycle({ jenisKey, currentState }: SipensiunLifecycleProps) {
  const config = getSipensiunJenisConfig(jenisKey);
  if (!config) return null;

  const steps = config.lifecycle;

  function isActive(stepIndex: number): boolean {
    if (!currentState) return false;
    const step = steps[stepIndex];
    return step.mapState.includes(currentState);
  }

  function isDone(stepIndex: number): boolean {
    if (!currentState) return false;
    const stateOrder = ['DRAFT', 'SUBMITTED', 'VERIFICATION', 'APPROVAL', 'COMPLETED'];
    const currentIdx = stateOrder.indexOf(currentState);
    if (currentIdx === -1) return false;

    const step = steps[stepIndex];
    const stepMinIdx = Math.min(
      ...step.mapState.map((s) => {
        const idx = stateOrder.indexOf(s);
        return idx === -1 ? 99 : idx;
      }),
    );
    return currentIdx > stepMinIdx;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-zinc-900">Alur Proses — {config.shortLabel}</p>
      <ol className="relative space-y-0">
        {steps.map((step, index) => {
          const done = isDone(index);
          const active = isActive(index);
          const isLast = index === steps.length - 1;

          return (
            <li key={index} className="relative flex gap-3 pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-zinc-300 bg-white text-zinc-400'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`mt-1 w-0.5 flex-1 ${done ? 'bg-emerald-300' : 'bg-zinc-200'}`}
                    style={{ minHeight: '2rem' }}
                  />
                )}
              </div>

              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <p
                  className={`text-sm font-medium leading-6 ${
                    done ? 'text-emerald-700' : active ? 'text-blue-700' : 'text-zinc-600'
                  }`}
                >
                  {step.label}
                  {active && (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Saat ini
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-zinc-500">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
