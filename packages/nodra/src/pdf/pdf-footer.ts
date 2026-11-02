import type { jsPDF } from "jspdf";

export function addPdfFooter(
  pdf: jsPDF,
  pageNumber: number,
  footerText?: string,
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);

  if (footerText) {
    pdf.text(footerText, 14, pageHeight - 8);
  }

  pdf.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 8, {
    align: "right",
  });
}
