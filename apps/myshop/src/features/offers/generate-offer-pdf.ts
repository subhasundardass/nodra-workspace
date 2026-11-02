import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { PdfColumn } from "nodra/pdf";
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

type AutoTableDocument = jsPDF & {
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

const offerPdfColumns: PdfColumn<OfferPdfRow>[] = [
  { header: "INVOICE NO.", key: "lotNo" },
  { header: "MARK", key: "brand" },
  { header: "GRADE", key: "grade" },
  { header: "BAGS", key: "bags", format: formatNumber },
  { header: "KGS", key: "kgs", format: formatNumber },
  { header: "TOTAL KGS", key: "totalKg", format: formatNumber },
  { header: "ASK.RATE", key: "askingRate", format: formatNumber },
  { header: "Remarks", key: "remarks" },
];

export function generateOfferPdf({
  offerName,
  offerDate,
  rows,
}: GenerateOfferPdfOptions) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const tableWidth = pageWidth - PAGE_MARGIN * 2;

  // Company header
  function addCompanyHeader() {
    return addPdfHeader(pdf, {
      title: "OFFER SHEET",
      documentNo: offerName,
      documentDate: offerDate,
    });
  }

  // Sales contact banner
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

  // Footer image and page number
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

  // Page decoration
  const decoratedPages = new Set<number>();
  let pageContentTop = 0;

  function decorateCurrentPage() {
    const pageNumber = pdf.getNumberOfPages();

    if (decoratedPages.has(pageNumber)) {
      return pageContentTop;
    }

    const headerBottom = addCompanyHeader();
    const contactBottom = addSalesContact(headerBottom);

    decoratedPages.add(pageNumber);

    return contactBottom + 4;
  }

  // Initial page
  let currentY = decorateCurrentPage();
  pageContentTop = currentY;

  // Group rows by factory
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

  // Render factory-wise sections

  for (const [factory, factoryRows] of sortedFactories) {
    // Sort lots in ascending natural order
    const sortedRows = [...factoryRows].sort((a, b) =>
      a.lotNo.localeCompare(b.lotNo, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    // Prepare factory title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    const titleLines = pdf.splitTextToSize(
      factory.toUpperCase(),
      tableWidth - 6,
    );

    const titleHeight = Math.max(8, titleLines.length * 4 + 2);

    // Reserve space for title, table header and first data row.
    const requiredSpace = titleHeight + 1 + 18;

    if (currentY + requiredSpace > pageHeight - PAGE_BOTTOM_MARGIN) {
      pdf.addPage();
      currentY = decorateCurrentPage();
    }

    // Factory title block
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

    // Main table starts below the factory title
    const tableStartY = currentY + titleHeight + 1;

    //--Blank row Index
    const blankRowIndexes = new Set<number>();
    let bodyRowIndex = 0;

    for (let i = 0; i < sortedRows.length; i++) {
      bodyRowIndex++;

      const nextRow = sortedRows[i + 1];

      if (
        nextRow &&
        (sortedRows[i]?.brand ?? "").trim().toLowerCase() !==
          (nextRow?.brand ?? "").trim().toLowerCase()
      ) {
        blankRowIndexes.add(bodyRowIndex);
        bodyRowIndex++;
      }
    }

    autoTable(pdf, {
      head: [offerPdfColumns.map((column) => column.header)],

      body: sortedRows.flatMap((row, index) => {
        const currentRow = offerPdfColumns.map((column) => {
          const value = row[column.key];

          if (column.format) {
            return column.format(value, row);
          }

          if (column.key === "brand") {
            return String(value ?? "").toUpperCase();
          }

          return String(value ?? "");
        });

        const nextRow = sortedRows[index + 1];

        // Add one blank row when the brand changes.
        if (
          nextRow &&
          row.brand.trim().toLowerCase() !== nextRow.brand.trim().toLowerCase()
        ) {
          return [currentRow, offerPdfColumns.map(() => "")];
        }

        return [currentRow];
      }),

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

      // Highlight asking rate cells
      didParseCell: (data) => {
        // Blank separator row takes priority.
        if (data.section === "body" && blankRowIndexes.has(data.row.index)) {
          data.cell.styles.minCellHeight = 0.8;
          data.cell.styles.cellPadding = 0;
          data.cell.styles.lineWidth = 0.15;
          data.cell.styles.fillColor = [225, 240, 250];
        }
        // Asking Rate column styling.
        else if (data.section === "body" && data.column.index === 6) {
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

      // Add company header and contact banner to automatic pages.
      didDrawPage: () => {
        decorateCurrentPage();

        const table = (pdf as AutoTableDocument).lastAutoTable;

        if (!table) return;

        pdf.setDrawColor(...PDF_BORDER_COLOR);
        pdf.setLineWidth(PDF_BORDER_WIDTH);

        // Outer table border
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

  // Footer image and page numbers on every page
  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    addPdfFooter(page, totalPages);
  }

  // Download PDF
  const safeFilename = offerName.replace(/[^a-zA-Z0-9-_]/g, "_") || "Offer";

  pdf.save(`${safeFilename}-Offer.pdf`);

  return pdf;
}
