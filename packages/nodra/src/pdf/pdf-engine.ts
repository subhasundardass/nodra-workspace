import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { addPdfHeader } from "./pdf-header";
import { addPdfFooter } from "./pdf-footer";
import { addPdfTable } from "./pdf-table";
import { formatPdfValue } from "./pdf-formatters";
import { createLayoutContext } from "./pdf-layout";

import type { PdfLayoutContext } from "./pdf-layout";
import type { PdfDocument, PdfOptions, PdfRenderOptions } from "./types";

export function createPDF<T>(options: PdfOptions<T>): PdfDocument;
export function createPDF(options: PdfRenderOptions): PdfDocument;

// Create and render a PDF document.
export function createPDF<T>(
  options: PdfOptions<T> | PdfRenderOptions,
): PdfDocument {
  const pdf = createPdfDocument({
    orientation: options.orientation,
    format: options.format,
  });

  if ("render" in options) {
    options.render(pdf);
    return pdf;
  }

  const context = createLayoutContext(pdf);
  renderSections(context, options);
  finalizePDF(pdf, options);

  return pdf;
}

// Create and download a PDF.
export function generatePDF<T>(options: PdfOptions<T>): PdfDocument {
  const pdf = createPDF(options);

  pdf.save(options.filename ?? "report.pdf");

  return pdf;
}

// Create a new jsPDF document.
export function createPdfDocument(
  options: Pick<PdfRenderOptions, "orientation" | "format">,
): PdfDocument {
  return new jsPDF({
    orientation: options.orientation ?? "portrait",
    unit: "mm",
    format: options.format ?? "a4",
  });
}

// Render standard tables and grouped sections.
export function renderSections<T>(
  context: PdfLayoutContext,
  options: PdfOptions<T>,
): void {
  const { pdf, margins, cursor } = context;
  const columns = options.columns ?? [];

  // Standard table.
  if (!options.groups?.length) {
    if (columns.length) {
      addPdfTable(pdf, columns, options.rows ?? []);
    }
    return;
  }

  // Grouped tables.
  for (const group of options.groups) {
    context.ensureSpace(45);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(group.heading, cursor.x, cursor.y + 5);

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

      startY: cursor.y + 9,

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
        top: margins.top,
        right: margins.right,
        bottom: margins.bottom,
        left: margins.left,
      },
    });

    const finalY = (
      pdf as PdfDocument & {
        lastAutoTable?: { finalY: number };
      }
    ).lastAutoTable?.finalY;

    cursor.y = (finalY ?? cursor.y + 20) + 12;
    cursor.x = margins.left;
  }
}

// Add standard header and footer to every page.
export function finalizePDF<T>(pdf: PdfDocument, options: PdfOptions<T>): void {
  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);

    addPdfHeader(pdf, {
      company: options.company,
      title: options.title ?? "",
      subtitle: options.subtitle,
    });

    addPdfFooter(pdf, page, options.footerText);
  }
}
