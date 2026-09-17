/**
 * Recharts-based chart display for dashboard widgets and notebook.
 * Wraps the notebook CellChart with a stable contract for pinned `item_data`.
 */
import { CellChart } from '../../pages/dashboard/notebook/NotebookChart';

export type ChartRendererInput = {
  chartMeta: { id: string; type: string; title: string; sub: string };
  chartData: Record<string, unknown>;
};

export function ChartRenderer({
  chart,
  compact,
}: {
  chart: ChartRendererInput;
  compact?: boolean;
}) {
  if (!chart?.chartMeta || !chart?.chartData) return null;
  return (
    <div className="h-full min-h-0 flex flex-col">
      <CellChart chartMeta={chart.chartMeta} chartData={chart.chartData} compact={compact} />
    </div>
  );
}
