import { jsPDF } from "jspdf";

import { addPdfHeader } from "./pdf-header";
import { addPdfFooter } from "./pdf-footer";
import { addPdfTable } from "./pdf-table";

import type { PdfDocument, PdfOptions } from "./types";

export function createPDF<T>(options: PdfOptions<T>): PdfDocument {
  const pdf = new jsPDF({
    orientation: options.orientation ?? "portrait",
    unit: "mm",
    format: options.format ?? "a4",
  });

  addPdfTable(pdf, options.columns, options.rows);

  // Draw the header and footer on every page.
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
