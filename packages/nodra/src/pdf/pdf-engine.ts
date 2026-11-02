import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { addPdfHeader } from "./pdf-header";
import { addPdfFooter } from "./pdf-footer";
import { addPdfTable } from "./pdf-table";
import { formatPdfValue } from "./pdf-formatters";

import type { PdfDocument, PdfOptions } from "./types";

export function createPDF<T>(options: PdfOptions<T>): PdfDocument {
  const pdf = new jsPDF({
    orientation: options.orientation ?? "portrait",
    unit: "mm",
    format: options.format ?? "a4",
  });

  if (options.groups?.length) {
    let currentY = 30;

    for (const group of options.groups) {
      // Keep the heading with its table when possible.
      if (currentY > pdf.internal.pageSize.getHeight() - 45) {
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(group.heading, 14, currentY + 5);

      const body = group.rows.map((row) => {
        const result: Record<string, string> = {};

        for (const column of options.columns) {
          const value = row[column.key];

          result[column.key] = column.format
            ? column.format(value, row)
            : formatPdfValue(value);
        }

        return result;
      });

      if (group.total) {
        body.push(
          Object.fromEntries(
            options.columns.map((column) => [
              column.key,
              formatPdfValue(group.total?.[column.key]),
            ]),
          ),
        );
      }

      autoTable(pdf, {
        columns: options.columns.map((column) => ({
          header: column.header,
          dataKey: column.key,
        })),
        body,
        startY: currentY + 9,
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
          options.columns
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

      currentY =
        (
          pdf as jsPDF & {
            lastAutoTable?: { finalY: number };
          }
        ).lastAutoTable?.finalY ?? currentY + 20;

      currentY += 12;
    }
  } else {
    addPdfTable(pdf, options.columns, options.rows ?? []);
  }

  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);

    addPdfHeader(pdf, {
      company: options.company,
      title: options.title,
      subtitle: options.subtitle,
    });

    addPdfFooter(pdf, page, options.footerText);
  }

  return pdf;
}

export function generatePDF<T>(options: PdfOptions<T>): PdfDocument {
  const pdf = createPDF(options);
  pdf.save(options.filename ?? "report.pdf");
  return pdf;
}
