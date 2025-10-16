export function downloadFile(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(rows: Array<Record<string, any>>, filename = 'export.csv') {
  if (!rows?.length) return downloadFile(filename, '', 'text/csv');
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(','))
  ];
  downloadFile(filename, lines.join('\n'), 'text/csv');
}

export function exportJSON(data: any, filename = 'backup.json') {
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
}
