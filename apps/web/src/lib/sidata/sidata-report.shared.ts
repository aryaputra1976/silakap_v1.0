export function getTodayLabel() {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function getExecutiveCondition(score: number) {
  if (score >= 90) {
    return 'baik';
  }

  if (score >= 70) {
    return 'perlu perhatian';
  }

  return 'berisiko';
}

export function getExecutiveRecommendation(score: number) {
  if (score >= 90) {
    return 'Kondisi data relatif baik. Tindak lanjut difokuskan pada pemeliharaan konsistensi referensi, monitoring batch baru, serta validasi berkala sebelum data digunakan untuk pelaporan dan layanan kepegawaian.';
  }

  if (score >= 70) {
    return 'Perlu dilakukan penyelesaian issue pada batch yang masih memiliki invalid, warning, needs review, atau unmapped. Prioritas perbaikan diarahkan pada pemutakhiran referensi dan remapping data ASN.';
  }

  return 'Perlu dilakukan prioritas perbaikan data secara intensif. Batch dengan issue tinggi harus ditinjau terlebih dahulu melalui menu Validasi Data dan Mapping Referensi sebelum dilakukan commit lanjutan ke data utama.';
}

export function getQualityTitle(score: number) {
  if (score >= 90) {
    return 'Kualitas data import baik';
  }

  if (score >= 70) {
    return 'Kualitas data perlu perhatian';
  }

  return 'Kualitas data berisiko';
}

export function getQualityDescription(score: number) {
  if (score >= 90) {
    return 'Mayoritas data import sudah valid dan siap digunakan sebagai dasar pemutakhiran SIDATA.';
  }

  if (score >= 70) {
    return 'Masih terdapat baris invalid, warning, needs review, atau unmapped yang perlu ditindaklanjuti.';
  }

  return 'Jumlah issue masih tinggi. Prioritaskan review mapping, perbaikan referensi, dan validasi ulang sebelum commit lanjutan.';
}
