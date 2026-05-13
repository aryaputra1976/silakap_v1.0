export type DmsBadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'dark';

export function getDmsStatusTone(status: string): DmsBadgeTone {
  if (status === 'VERIFIED' || status === 'ARCHIVED') {
    return 'success';
  }

  if (status === 'SUBMITTED') {
    return 'info';
  }

  if (status === 'REJECTED') {
    return 'danger';
  }

  if (status === 'UPLOADED') {
    return 'warning';
  }

  return 'neutral';
}
