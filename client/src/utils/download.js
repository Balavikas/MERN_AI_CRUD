export function saveFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeCsvValue(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(records, columns) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const rows = records.map((record) => columns.map((column) => {
    const value = record[column.key];
    return escapeCsvValue(column.format ? column.format(value) : value);
  }).join(','));
  return [header, ...rows].join('\r\n');
}
