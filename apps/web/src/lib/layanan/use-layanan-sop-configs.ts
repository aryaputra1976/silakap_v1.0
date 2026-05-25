import { useEffect, useState } from 'react';
import { fetchLayananSopConfigs } from '@/lib/api/layanan-sop-config';
import {
  LAYANAN_SOP_LIST,
  type LayananSopConfig,
} from './layanan-data';

type SopConfigState = {
  sops: LayananSopConfig[];
  loading: boolean;
};

/**
 * Loads SOP config from the API (title/shortLabel/description/rhkCodes are DB-driven).
 * Merges with hardcoded list for lifecycle/pageRoute/dmsQuery — falls back to
 * hardcoded list entirely if the API call fails.
 */
export function useLayananSopConfigs(): SopConfigState {
  const [state, setState] = useState<SopConfigState>({
    sops: LAYANAN_SOP_LIST,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    fetchLayananSopConfigs()
      .then((items) => {
        if (cancelled) return;

        const merged: LayananSopConfig[] = LAYANAN_SOP_LIST.map((local) => {
          const remote = items.find((r) => r.key === local.key);
          if (!remote) return local;

          return {
            ...local,
            title: remote.title,
            shortLabel: remote.shortLabel,
            description: remote.description,
            rhkCodes: remote.rhkCodes,
          };
        });

        setState({ sops: merged, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ sops: LAYANAN_SOP_LIST, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
