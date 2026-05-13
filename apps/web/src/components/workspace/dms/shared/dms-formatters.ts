type PeriodItem = {
  periodYear: number | null | undefined;
  periodMonth: number | null | undefined;
};

export function formatPeriod(item: PeriodItem): string {
  if (!item.periodYear && !item.periodMonth) {
    return '-';
  }

  if (item.periodMonth && item.periodYear) {
    return `${item.periodMonth}/${item.periodYear}`;
  }

  return String(item.periodYear ?? '-');
}
