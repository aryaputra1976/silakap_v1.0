import {
  DmsStatCards,
  type DmsStatSummary,
} from '@/components/workspace/dms/dms-stat-cards';

type DmsDocumentsSummaryProps = {
  summary: DmsStatSummary;
};

export function DmsDocumentsSummary({ summary }: DmsDocumentsSummaryProps) {
  return <DmsStatCards summary={summary} />;
}
