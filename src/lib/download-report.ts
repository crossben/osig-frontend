// ============================================
// Report download helper
// ============================================

import { api } from '@/lib/api';

/** Fetch a generated report and trigger a browser download for it. */
export async function downloadReportFile(report: { id: string; name: string; format: string }) {
  const blob = await api.downloadReport(report.id);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.name}.${report.format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
