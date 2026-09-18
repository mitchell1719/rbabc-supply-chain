import { Injectable } from '@angular/core';

/**
 * Client-side export helpers, dependency-free: CSV opens directly in Excel,
 * and "PDF" uses the browser's native print-to-PDF against the print
 * stylesheet in styles.css (which already hides the shell and any element
 * marked .no-print) instead of pulling in a PDF-generation library.
 */
@Injectable({
  providedIn: 'root',
})
export class ExportService {
  /** Downloads `rows` as a CSV file that opens directly in Excel. */
  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const escape = (value: string | number): string => {
      const text = String(value ?? '');

      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const lines = [headers, ...rows].map((row) => row.map(escape).join(','));

    // A UTF-8 BOM so Excel renders ₱ and other non-ASCII characters correctly.
    const blob = new Blob(['﻿' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });

    this.downloadBlob(blob, `${filename}.csv`);
  }

  /** Opens the browser's print dialog, which can save as PDF; styles.css hides the shell and .no-print elements. */
  exportToPdf(): void {
    window.print();
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }
}
