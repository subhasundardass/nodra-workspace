import type { jsPDF } from "jspdf";
import type { PdfHeaderOptions } from "./types";

export function addPdfHeader(pdf: jsPDF, options: PdfHeaderOptions): void {
  const pageWidth = pdf.internal.pageSize.getWidth();

  const left = 14;
  const right = pageWidth - 14;

  const company = options.company;

  let y = 14;

  // Company logo
  if (company?.logo) {
    pdf.addImage(company.logo, "PNG", left, 8, 25, 20);
  }

  const textLeft = company?.logo ? 44 : left;

  // Company name
  if (company?.name) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(company.name, textLeft, y);
    y += 6;
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  // Address
  if (company?.address) {
    pdf.text(company.address, textLeft, y);
    y += 4;
  }

  // Contact details
  const contact = [company?.phone, company?.email, company?.website]
    .filter(Boolean)
    .join(" | ");

  if (contact) {
    pdf.text(contact, textLeft, y);
    y += 4;
  }

  // GSTIN
  if (company?.gstin) {
    pdf.text(`GSTIN: ${company.gstin}`, textLeft, y);
  }

  // Report title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);

  pdf.text(options.title, right, 14, {
    align: "right",
  });

  if (options.subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    pdf.text(options.subtitle, right, 20, {
      align: "right",
    });
  }

  pdf.setDrawColor(180, 180, 180);
  pdf.line(left, 32, right, 32);
}
