import autoTable from "jspdf-autotable";

import { createPDF } from "nodra/pdf";
import type { PdfDocument } from "nodra/pdf";

import { addPdfHeader } from "@/lib/pdf/pdf-header";
import { formatDate } from "@/lib/format";

export type OfferReportPdfRow = {
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
  sale_type?: string;
  tf?: string;

  asking_rate: number;
  broker_type?: string;
  remarks?: string;
};

type GenerateOfferReportPdfOptions = {
  rows: OfferReportPdfRow[];
  fromDate?: string;
  toDate?: string;
};

const PAGE_MARGIN = 2;
const PAGE_BOTTOM_MARGIN = 2;

const BORDER_COLOR: [number, number, number] = [0, 0, 0];
const BORDER_WIDTH = 0.25;

const FOOTER_COLOR: [number, number, number] = [100, 100, 100];

const ASK_RATE_BACKGROUND: [number, number, number] = [255, 249, 219];
const ASK_RATE_TEXT: [number, number, number] = [120, 90, 20];

const FOOTER_NOTE =
  "CONFIDENTIAL - FOR INTERNAL OFFICE USE ONLY. NOT FOR EXTERNAL CIRCULATION OR SHARING.";

const formatNumber = (value: unknown) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_") || "Offer_Report";
}

function renderOfferReportPdf(
  pdf: PdfDocument,
  rows: OfferReportPdfRow[],
  fromDate?: string,
  toDate?: string,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const tableWidth = pageWidth - PAGE_MARGIN * 2;

  function addHeader() {
    return addPdfHeader(pdf, {
      title: "OFFER REPORT",
      documentNo: "OFFER REPORT",
      documentDate: formatDateRange(fromDate, toDate),
    });
  }

  const decoratedPages = new Set<number>();
  let pageContentTop = 0;

  function formatDateRange(fromDate?: string, toDate?: string) {
    const from = formatDate(fromDate);
    const to = formatDate(toDate);

    if (from && to) {
      return from === to ? from : `${from} - ${to}`;
    }

    return from || to || "";
  }

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
      "", // TATA - blank
      "", // HUL - blank
      formatNumber(row.asking_rate),
      "", // BROKER - blank
      "", // REMARKS - blank
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
        "TATA",
        "HUL",
        "ASK RATE",
        "BROKER",
        "REMARKS",
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

    // Total width: 283 mm (A4 landscape printable width).
    columnStyles: {
      0: { cellWidth: 18 }, // LOT NO.
      1: { cellWidth: 45, fontStyle: "bold" }, // MARK (+9 mm)
      2: { cellWidth: 13 }, // GRADE
      3: { cellWidth: 10 }, // BAGS
      4: { cellWidth: 11 }, // KGS
      5: { cellWidth: 15 }, // TOTAL KGS
      6: { cellWidth: 17 }, // ARR DT
      7: { cellWidth: 43 }, // APP / INF / LIQ
      8: { cellWidth: 14 }, // T/F
      9: { cellWidth: 12 }, // TATA
      10: { cellWidth: 12 }, // HUL
      11: { cellWidth: 17 }, // ASK RATE
      12: { cellWidth: 25 }, // BROKER
      13: { cellWidth: 40 }, // REMARKS (-9 mm)
    },
    didParseCell: (data) => {
      const isTotalRow =
        data.section === "body" && data.row.index === body.length - 1;

      // Total row.
      if (isTotalRow) {
        data.cell.styles.fillColor = [230, 230, 230];
        data.cell.styles.fontStyle = "bold";
      }

      // Asking Rate: bold, larger and highlighted.
      if (data.section === "body" && data.column.index === 11 && !isTotalRow) {
        data.cell.styles.fillColor = ASK_RATE_BACKGROUND;
        data.cell.styles.textColor = ASK_RATE_TEXT;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 8;
      }

      // Text-oriented columns.
      if (
        data.section === "body" &&
        [1, 7, 12, 13].includes(data.column.index)
      ) {
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

  // Footer: office-use note on the left and page number on the right.
  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);

    const footerY = pdf.internal.pageSize.getHeight() - 2;

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

export function generateOfferReportPdf(options: GenerateOfferReportPdfOptions) {
  const { rows, fromDate, toDate } = options;

  const pdf = createPDF({
    orientation: "landscape",
    format: "a4",
    render: (document: PdfDocument) =>
      renderOfferReportPdf(document, rows, fromDate, toDate),
  });

  pdf.save(`${sanitizeFilename("Offer Report")}.pdf`);

  return pdf;
}
