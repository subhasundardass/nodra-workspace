import type { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { PdfColumn } from "./types";
import { formatPdfValue } from "./pdf-formatters";

export function addPdfTable<T>(
  pdf: jsPDF,
  columns: PdfColumn<T>[],
  rows: T[],
): void {
  autoTable(pdf, {
    columns: columns.map((column) => ({
      header: column.header,
      dataKey: column.key,
    })),

    body: rows.map((row) => {
      const result: Record<string, string> = {};

      for (const column of columns) {
        const value = row[column.key];

        result[column.key] = column.format
          ? column.format(value, row)
          : formatPdfValue(value);
      }

      return result;
    }),

    startY: 30,
    theme: "grid",

    headStyles: {
      fontStyle: "bold",
      fontSize: 9,
    },

    bodyStyles: {
      fontSize: 8,
    },

    styles: {
      cellPadding: 3,
      overflow: "linebreak",
    },

    columnStyles: Object.fromEntries(
      columns
        .filter((column) => column.align)
        .map((column) => [column.key, { halign: column.align }]),
    ),

    margin: {
      top: 30,
      right: 14,
      bottom: 18,
      left: 14,
    },
  });
}
