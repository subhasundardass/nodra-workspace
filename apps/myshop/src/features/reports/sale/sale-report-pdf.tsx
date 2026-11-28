import autoTable from "jspdf-autotable";

import { createPDF } from "nodra/pdf";
import type { PdfDocument } from "nodra/pdf";

import { addPdfHeader } from "@/lib/pdf/pdf-header";
import { formatDate } from "@/lib/format";

export type SaleReportPdfRow = {
  lot_no: string;
  brand: string;
  grade: string;
  bags: number;
  net_kg_per_bag: number;
  total_kgs: number;
  arrival_date?: string;

  // TeaTesting
  appearance?: string;
  infusion?: string;
  liquor?: string;

  // SaleBook
  tf?: string;
  sale_type?: string;
  rate: number;
  broker_name?: string;
};

type GenerateSaleReportPdfOptions = {
  rows: SaleReportPdfRow[];
  fromDate?: string;
  toDate?: string;
  factory?: string;
};

const PAGE_MARGIN = 2;
const PAGE_BOTTOM_MARGIN = 9;

const BORDER_COLOR: [number, number, number] = [0, 0, 0];
const BORDER_WIDTH = 0.25;

const FOOTER_COLOR: [number, number, number] = [100, 100, 100];

const RATE_BACKGROUND: [number, number, number] = [255, 249, 219];
const RATE_TEXT: [number, number, number] = [120, 90, 20];

const SUMMARY_BACKGROUND: [number, number, number] = [248, 250, 252];
const SUMMARY_BORDER: [number, number, number] = [190, 198, 206];
const SUMMARY_TEXT: [number, number, number] = [35, 45, 55];

const FOOTER_NOTE =
  "CONFIDENTIAL - FOR INTERNAL OFFICE USE ONLY. NOT FOR EXTERNAL CIRCULATION OR SHARING.";

const formatNumber = (value: unknown) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const formatAmount = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_") || "Sale_Report";
}

function renderSaleReportPdf(
  pdf: PdfDocument,
  rows: SaleReportPdfRow[],
  fromDate?: string,
  toDate?: string,
  factory?: string,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const tableWidth = pageWidth - PAGE_MARGIN * 2;

  function formatDateRange(fromDate?: string, toDate?: string) {
    const from = formatDate(fromDate);
    const to = formatDate(toDate);

    if (from && to) {
      return from === to ? from : `${from} - ${to}`;
    }

    return from || to || "";
  }

  function addHeader() {
    const title =
      factory && factory !== "All"
        ? `SALE REPORT : ${factory.toUpperCase()}`
        : "SALE REPORT";

    return addPdfHeader(pdf, {
      title,
      documentNo: title,
      documentDate: formatDateRange(fromDate, toDate),
    });
  }

  const decoratedPages = new Set<number>();
  let pageContentTop = 0;

  function decorateCurrentPage() {
    const pageNumber = pdf.getNumberOfPages();

    if (decoratedPages.has(pageNumber)) {
      return pageContentTop;
    }

    const headerBottom = addHeader();

    decoratedPages.add(pageNumber);

    return headerBottom + 1;
  }

  const currentY = decorateCurrentPage();
  pageContentTop = currentY;

  // Sort by Lot No.
  const sortedRows = [...rows].sort((a, b) =>
    (a.lot_no ?? "").localeCompare(b.lot_no ?? "", undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  // Prepare table rows.
  const body = sortedRows.map((row) => {
    const appInfLiq = [row.appearance, row.infusion, row.liquor]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(" / ");

    return [
      row.lot_no ?? "",
      (row.brand ?? "").toUpperCase(),
      row.grade ?? "",
      formatNumber(row.bags),
      formatNumber(row.net_kg_per_bag),
      formatNumber(row.total_kgs),
      formatDate(row.arrival_date) ?? "",
      appInfLiq,
      row.tf ?? "",
      row.sale_type ?? "",
      formatNumber(row.rate),
      row.broker_name ?? "",
    ];
  });

  const totalBags = sortedRows.reduce(
    (sum, row) => sum + Number(row.bags || 0),
    0,
  );

  const totalKgs = sortedRows.reduce(
    (sum, row) => sum + Number(row.total_kgs || 0),
    0,
  );

  // Total row.
  body.push([
    "",
    "",
    "TOTAL",
    formatNumber(totalBags),
    "",
    formatNumber(totalKgs),
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  autoTable(pdf, {
    head: [
      [
        "LOT NO.",
        "MARK",
        "GRADE",
        "BAGS",
        "KGS",
        "TOTAL KGS",
        "ARR DT",
        "APP / INF / LIQ",
        "T/F",
        "TYPE",
        "RATE",
        "BROKER",
      ],
    ],

    body,
    startY: currentY,
    tableWidth,
    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 1.5,
      textColor: 0,
      lineColor: BORDER_COLOR,
      lineWidth: BORDER_WIDTH,
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: [230, 237, 243],
      textColor: [25, 45, 65],
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
      valign: "middle",
      lineColor: BORDER_COLOR,
      lineWidth: BORDER_WIDTH,
    },

    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 60, fontStyle: "bold" },
      2: { cellWidth: 13 },
      3: { cellWidth: 10 },
      4: { cellWidth: 11 },
      5: { cellWidth: 15 },
      6: { cellWidth: 17 },
      7: { cellWidth: 63 },
      8: { cellWidth: 12 },
      9: { cellWidth: 16 },
      10: { cellWidth: 23 },
      11: { cellWidth: 35 },
    },

    didParseCell: (data) => {
      const isTotalRow =
        data.section === "body" && data.row.index === body.length - 1;

      if (isTotalRow) {
        data.cell.styles.fillColor = [230, 230, 230];
        data.cell.styles.fontStyle = "bold";
      }

      // Highlight Rate.
      if (data.section === "body" && data.column.index === 10 && !isTotalRow) {
        data.cell.styles.fillColor = RATE_BACKGROUND;
        data.cell.styles.textColor = RATE_TEXT;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 8;
      }

      // Left-align text columns.
      if (data.section === "body" && [1, 7, 11].includes(data.column.index)) {
        data.cell.styles.halign = "left";
      }
    },

    margin: {
      top: pageContentTop,
      right: PAGE_MARGIN,
      bottom: PAGE_BOTTOM_MARGIN,
      left: PAGE_MARGIN,
    },

    showHead: "everyPage",
    rowPageBreak: "avoid",

    didDrawPage: () => {
      decorateCurrentPage();
    },
  });

  // --------------------------------------------------
  // Calculate Bid and Advance totals
  // --------------------------------------------------

  const bidRows = sortedRows.filter(
    (row) => row.sale_type?.trim().toLowerCase() === "bid",
  );

  const advanceRows = sortedRows.filter(
    (row) => row.sale_type?.trim().toLowerCase() === "advance",
  );

  const totalBid = bidRows.reduce(
    (sum, row) => sum + Number(row.total_kgs || 0) * Number(row.rate || 0),
    0,
  );

  const totalAdvance = advanceRows.reduce(
    (sum, row) => sum + Number(row.total_kgs || 0) * Number(row.rate || 0),
    0,
  );

  const tableFinalY =
    (
      pdf as PdfDocument & {
        lastAutoTable?: { finalY: number };
      }
    ).lastAutoTable?.finalY ?? currentY;

  // --------------------------------------------------
  // Bottom section: Summary left, signatures right
  // --------------------------------------------------

  const sectionGap = 8;
  const sectionHeight = 34;

  let sectionY = tableFinalY + sectionGap;

  // Keep the entire bottom section together.
  if (sectionY + sectionHeight > pageHeight - 12) {
    pdf.addPage();
    sectionY = decorateCurrentPage();
  }

  // Summary panel on the left.
  const panelX = PAGE_MARGIN + 5;
  const panelY = sectionY;
  const panelWidth = 100;
  const panelHeight = 32;

  pdf.setFillColor(...SUMMARY_BACKGROUND);
  pdf.setDrawColor(...SUMMARY_BORDER);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(panelX, panelY, panelWidth, panelHeight, 1.5, 1.5, "FD");

  // Summary heading.
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...SUMMARY_TEXT);

  pdf.text("SALE SUMMARY", panelX + 5, panelY + 7);

  // Divider below heading.
  pdf.setDrawColor(...SUMMARY_BORDER);
  pdf.setLineWidth(0.2);
  pdf.line(panelX + 5, panelY + 10, panelX + panelWidth - 5, panelY + 10);

  // Bid and Advance values.
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...SUMMARY_TEXT);

  pdf.text("Total Bid", panelX + 5, panelY + 18);
  pdf.text(
    `${formatAmount(totalBid)} (${bidRows.length})`,
    panelX + panelWidth - 5,
    panelY + 18,
    { align: "right" },
  );

  pdf.text("Total Advance", panelX + 5, panelY + 26);
  pdf.text(
    `${formatAmount(totalAdvance)} (${advanceRows.length})`,
    panelX + panelWidth - 5,
    panelY + 26,
    { align: "right" },
  );

  // --------------------------------------------------
  // Signatures on the right
  // --------------------------------------------------

  const signatureAreaX = panelX + panelWidth + 12;
  const signatureAreaWidth = pageWidth - PAGE_MARGIN - signatureAreaX;

  const signatureSlotWidth = signatureAreaWidth / 2;
  const signatureLineWidth = Math.min(65, signatureSlotWidth - 12);

  const firstSignatureCenter = signatureAreaX + signatureSlotWidth / 2;
  const secondSignatureCenter = signatureAreaX + signatureSlotWidth * 1.5;

  const signatureLineY = panelY + 21;
  const signatureLabelY = signatureLineY + 6;

  // Signature lines
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.35);

  pdf.line(
    firstSignatureCenter - signatureLineWidth / 2,
    signatureLineY,
    firstSignatureCenter + signatureLineWidth / 2,
    signatureLineY,
  );

  pdf.line(
    secondSignatureCenter - signatureLineWidth / 2,
    signatureLineY,
    secondSignatureCenter + signatureLineWidth / 2,
    signatureLineY,
  );

  // Signature labels
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(0);

  pdf.text(
    "Signature of Sales Director",
    firstSignatureCenter,
    signatureLabelY,
    { align: "center" },
  );

  pdf.text("Signature of Sales Head", secondSignatureCenter, signatureLabelY, {
    align: "center",
  });

  // --------------------------------------------------
  // Footer on every page
  // --------------------------------------------------

  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);

    const footerY = pageHeight - 4;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...FOOTER_COLOR);

    pdf.text(FOOTER_NOTE, PAGE_MARGIN, footerY);

    pdf.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - PAGE_MARGIN,
      footerY,
      { align: "right" },
    );
  }
}

export function generateSaleReportPdf(options: GenerateSaleReportPdfOptions) {
  const { rows, fromDate, toDate, factory } = options;

  const pdf = createPDF({
    orientation: "landscape",
    format: "a4",
    render: (document: PdfDocument) =>
      renderSaleReportPdf(document, rows, fromDate, toDate, factory),
  });

  pdf.save(`${sanitizeFilename("Sale Report")}.pdf`);

  return pdf;
}
