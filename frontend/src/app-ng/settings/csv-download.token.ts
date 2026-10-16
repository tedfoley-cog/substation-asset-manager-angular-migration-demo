import { InjectionToken } from '@angular/core';
import { downloadCsv } from './csv-download';

export type CsvDownload = (filename: string, text: string) => void;

// Lets the component spec observe the download without touching the DOM (TST-SETCMP-019).
export const CSV_DOWNLOAD = new InjectionToken<CsvDownload>('sam.downloadCsv', { providedIn: 'root', factory: () => downloadCsv });
