// Web Worker for parsing large CSV files in a background thread
// This prevents the main thread from freezing during parsing

interface ParsedRow {
  [key: string]: string;
}

interface WorkerMessage {
  type: 'parse';
  csvText: string;
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  progress?: number;
  data?: ParsedRow[];
  error?: string;
  rowCount?: number;
}

function parseCSVChunked(csvText: string): ParsedRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: ParsedRow[] = [];
  const totalLines = lines.length;

  for (let i = 1; i < totalLines; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj: ParsedRow = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] || '';
    }
    data.push(obj);

    // Report progress every 10000 rows
    if (i % 10000 === 0) {
      const progress = Math.round((i / totalLines) * 100);
      self.postMessage({ type: 'progress', progress, rowCount: i } as WorkerResponse);
    }
  }

  return data;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, csvText } = event.data;

  if (type === 'parse') {
    try {
      const data = parseCSVChunked(csvText);
      self.postMessage({ type: 'complete', data, rowCount: data.length } as WorkerResponse);
    } catch (error) {
      self.postMessage({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown parsing error' 
      } as WorkerResponse);
    }
  }
};
