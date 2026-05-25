import { apiClient } from './client';

export type LayananSopConfigItem = {
  key: string;
  code: string;
  title: string;
  shortLabel: string;
  description: string;
  rhkCodes: string[];
  sortOrder: number;
  updatedAt: string;
};

export async function fetchLayananSopConfigs(): Promise<LayananSopConfigItem[]> {
  const res = await apiClient.get<LayananSopConfigItem[]>('/layanan-kepegawaian/sop-configs');
  return res;
}
