import autoTable, { type CellHookData } from "jspdf-autotable";

import { createPDF } from "nodra/pdf";
import type { PdfDocument } from "nodra/pdf";

import { addPdfHeader } from "@/lib/pdf/offer-header";
import footerImage from "@/assets/offer-trust.png?inline";

export type OfferPdfRow = {
  factory: string;
  lotNo: string;
  brand: string;
  grade: string;
  bags: number;
  kgs: number;
  totalKg: number;
  askingRate: number;
  remarks: string;
};

type GenerateOfferPdfOptions = {
  offerName: string;
  offerDate?: string;
  rows: OfferPdfRow[];
};

type AutoTableDocument = PdfDocument & {
  lastAutoTable?: {
    finalY: number;
  };
};

const PAGE_MARGIN = 7;
const PAGE_BOTTOM_MARGIN = 34;
const FOOTER_IMAGE_HEIGHT = 24;

const TABLE_COLUMN_WIDTHS = [20, 40, 16, 12, 14, 18, 22, 54];

const PDF_BORDER_COLOR: [number, number, number] = [0, 0, 0];
const PDF_BORDER_WIDTH = 0.25;

const formatNumber = (value: unknown) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_") || "Offer";
}

function renderOfferPdf(
  pdf: PdfDocument,
  offerName: string,
  offerDate: string | undefined,
  rows: OfferPdfRow[],
): void {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const tableWidth = pageWidth - PAGE_MARGIN * 2;

  function addCompanyHeader() {
    return addPdfHeader(pdf, {
      title: "OFFER SHEET",
      documentNo: offerName,
      documentDate: offerDate,
    });
  }

  function addSalesContact(y: number) {
    pdf.setFillColor(232, 242, 232);
    pdf.rect(PAGE_MARGIN, y - 4, tableWidth, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(46, 95, 55);

    pdf.text(
      "Sales Queries: +91 99334 78888 (Sourav Sanghai) | +91 99338 62222 (Bidhan Barman)",
      pageWidth / 2,
      y + 1,
      { align: "center" },
    );

    return y + 6;
  }

  function addPdfFooter(pageNumber: number, totalPages: number) {
    const imageY = pageHeight - FOOTER_IMAGE_HEIGHT - 8;

    pdf.addImage(
      footerImage,
      "JPEG",
      PAGE_MARGIN,
      imageY,
      tableWidth,
      FOOTER_IMAGE_HEIGHT,
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);

    pdf.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - PAGE_MARGIN,
      pageHeight - 4,
      { align: "right" },
    );
  }

  const decoratedPages = new Set<number>();
  let pageContentTop = 0;

  function decorateCurrentPage(): number {
    const pageNumber = pdf.getNumberOfPages();

    if (decoratedPages.has(pageNumber)) {
      return pageContentTop;
    }

    const headerBottom = addCompanyHeader();
    const contactBottom = addSalesContact(headerBottom);

    decoratedPages.add(pageNumber);

    return contactBottom + 4;
  }

  let currentY = decorateCurrentPage();
  pageContentTop = currentY;

  // Group rows by factory.
  const factories = new Map<string, OfferPdfRow[]>();

  for (const row of rows) {
    const factory = row.factory?.trim() || "Unassigned Factory";
    const factoryRows = factories.get(factory) ?? [];

    factoryRows.push(row);
    factories.set(factory, factoryRows);
  }

  const sortedFactories = [...factories.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [factory, factoryRows] of sortedFactories) {
    const sortedRows = [...factoryRows].sort((a, b) =>
      a.lotNo.localeCompare(b.lotNo, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    // Factory title.
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    const titleLines = pdf.splitTextToSize(
      factory.toUpperCase(),
      tableWidth - 6,
    );

    const titleHeight = Math.max(8, titleLines.length * 4 + 2);
    const requiredSpace = titleHeight + 1 + 18;

    if (currentY + requiredSpace > pageHeight - PAGE_BOTTOM_MARGIN) {
      pdf.addPage();
      currentY = decorateCurrentPage();
    }

    pdf.setFillColor(255, 225, 225);
    pdf.setDrawColor(...PDF_BORDER_COLOR);
    pdf.setLineWidth(PDF_BORDER_WIDTH);

    pdf.rect(PAGE_MARGIN, currentY, tableWidth, titleHeight, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    pdf.text(titleLines, pageWidth / 2, currentY + 4, {
      align: "center",
      lineHeightFactor: 1.1,
    });

    const tableStartY = currentY + titleHeight + 1;

    // Build table body and track blank separator rows.
    const body: string[][] = [];
    const blankRowIndexes = new Set<number>();

    for (let i = 0; i < sortedRows.length; i++) {
      const row = sortedRows[i];
      if (!row) continue;

      const currentRow = [
        row.lotNo,
        row.brand.toUpperCase(),
        row.grade,
        formatNumber(row.bags),
        formatNumber(row.kgs),
        formatNumber(row.totalKg),
        formatNumber(row.askingRate),
        row.remarks,
      ];

      body.push(currentRow);

      const nextRow = sortedRows[i + 1];

      if (
        nextRow &&
        (row.brand ?? "").trim().toLowerCase() !==
          (nextRow.brand ?? "").trim().toLowerCase()
      ) {
        blankRowIndexes.add(body.length);
        body.push(Array(8).fill(""));
      }
    }

    autoTable(pdf, {
      head: [
        [
          "INVOICE NO.",
          "MARK",
          "GRADE",
          "BAGS",
          "KGS",
          "TOTAL KGS",
          "ASK.RATE",
          "Remarks",
        ],
      ],

      body,

      startY: tableStartY,
      tableWidth,

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 1.8,
        textColor: 0,
        lineColor: PDF_BORDER_COLOR,
        lineWidth: PDF_BORDER_WIDTH,
        halign: "center",
        valign: "middle",
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: [221, 235, 247],
        textColor: [31, 78, 121],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
        valign: "middle",
      },

      columnStyles: {
        0: { cellWidth: TABLE_COLUMN_WIDTHS[0] },
        1: {
          cellWidth: TABLE_COLUMN_WIDTHS[1],
          fontStyle: "bold",
        },
        2: { cellWidth: TABLE_COLUMN_WIDTHS[2] },
        3: { cellWidth: TABLE_COLUMN_WIDTHS[3] },
        4: { cellWidth: TABLE_COLUMN_WIDTHS[4] },
        5: { cellWidth: TABLE_COLUMN_WIDTHS[5] },
        6: { cellWidth: TABLE_COLUMN_WIDTHS[6] },
        7: { cellWidth: TABLE_COLUMN_WIDTHS[7] },
      },

      didParseCell: (data: CellHookData) => {
        if (data.section === "body" && blankRowIndexes.has(data.row.index)) {
          data.cell.styles.minCellHeight = 0.8;
          data.cell.styles.cellPadding = 0;
          data.cell.styles.lineWidth = 0.15;
          data.cell.styles.fillColor = [225, 240, 250];
        } else if (data.section === "body" && data.column.index === 6) {
          data.cell.styles.fillColor = [255, 249, 219];
          data.cell.styles.textColor = [120, 90, 20];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 9;
          data.cell.styles.halign = "center";
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

        const table = (pdf as AutoTableDocument).lastAutoTable;

        if (!table) return;

        pdf.setDrawColor(...PDF_BORDER_COLOR);
        pdf.setLineWidth(PDF_BORDER_WIDTH);

        pdf.rect(
          PAGE_MARGIN,
          tableStartY,
          tableWidth,
          table.finalY - tableStartY,
        );
      },
    });

    const table = (pdf as AutoTableDocument).lastAutoTable;

    currentY = (table?.finalY ?? tableStartY) + 7;
  }

  // Footer on every page.
  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    addPdfFooter(page, totalPages);
  }
}

export function generateOfferPdf(options: GenerateOfferPdfOptions) {
  const { offerName, offerDate, rows } = options;

  const pdf = createPDF({
    orientation: "portrait",
    format: "a4",
    render: (document: PdfDocument) =>
      renderOfferPdf(document, offerName, offerDate, rows),
  });

  pdf.save(`${sanitizeFilename(offerName)}-Offer.pdf`);

  return pdf;
}
