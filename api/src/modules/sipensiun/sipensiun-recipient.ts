export type PensiunRecipientCategory = 'BKN_PUSAT' | 'BKN_REGIONAL';

export type PensiunRecipient = {
  recipientName: string;
  recipientCity: string;
  category: PensiunRecipientCategory;
  needsReview: boolean;
};

const golonganRanks: Record<string, number> = {
  'I/A': 1,
  'I/B': 2,
  'I/C': 3,
  'I/D': 4,
  'II/A': 5,
  'II/B': 6,
  'II/C': 7,
  'II/D': 8,
  'III/A': 9,
  'III/B': 10,
  'III/C': 11,
  'III/D': 12,
  'IV/A': 13,
  'IV/B': 14,
  'IV/C': 15,
  'IV/D': 16,
  'IV/E': 17,
};

export function resolvePensiunRecipient(
  golonganNama?: string | null,
): PensiunRecipient {
  const rank = parseGolonganRank(golonganNama);

  if (rank === null) {
    return {
      recipientName: 'Kepala Kanreg IV BKN',
      recipientCity: 'Makassar',
      category: 'BKN_REGIONAL',
      needsReview: true,
    };
  }

  if (rank >= golonganRanks['IV/B']) {
    return {
      recipientName: 'Kepala BKN',
      recipientCity: 'Jakarta',
      category: 'BKN_PUSAT',
      needsReview: false,
    };
  }

  return {
    recipientName: 'Kepala Kanreg IV BKN',
    recipientCity: 'Makassar',
    category: 'BKN_REGIONAL',
    needsReview: false,
  };
}

function parseGolonganRank(golonganNama?: string | null) {
  const normalized = golonganNama?.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/\b(I{1,3}|IV)\/?([A-E])\b/);

  if (!match) {
    return null;
  }

  const key = `${match[1]}/${match[2]}`;
  return golonganRanks[key] ?? null;
}
