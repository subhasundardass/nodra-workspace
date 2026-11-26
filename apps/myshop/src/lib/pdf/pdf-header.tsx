import type { jsPDF } from "jspdf";
import { company as defaultCompany } from "@/config/company";

export type PdfCompanyDetails = {
  name?: string;
  logo?: string;
  address1?: string;
  address2?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
};

export type PdfHeaderOptions = {
  company?: PdfCompanyDetails;
  title: string;
  documentNo?: string;
  documentDate?: string;
};

const LEFT = 2;
const RIGHT = 2;
const TOP = 1;

const LOGO_WIDTH = 50;
const LOGO_HEIGHT = 9;

const DETAIL_FONT_SIZE = 7;
const TITLE_FONT_SIZE = 13;
const DATE_FONT_SIZE = 8;

// Compact vertical spacing (mm)
const HEADER_DIVIDER_GAP = 1;
const TITLE_GAP = 5;
const DATE_GAP = 2;
const BOTTOM_DIVIDER_GAP = 0;
const CONTENT_GAP = 1;

function formatSinglePdfDate(value: string): string {
  const trimmed = value.trim();

  // Preserve date-only values without timezone conversion.
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  // Already formatted as DD/MM/YYYY.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("/");
}

function formatPdfDate(value: string): string {
  const dateRange = value.split(" - ");

  if (dateRange.length === 2 && dateRange[0] && dateRange[1]) {
    const from = formatSinglePdfDate(dateRange[0]);
    const to = formatSinglePdfDate(dateRange[1]);

    return from === to ? from : `${from} - ${to}`;
  }

  return formatSinglePdfDate(value);
}

export function addPdfHeader(pdf: jsPDF, options: PdfHeaderOptions): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const rightX = pageWidth - RIGHT;

  const company = options.company ?? defaultCompany;

  // --------------------------------------------------
  // Logo
  // --------------------------------------------------

  let logoHeight = LOGO_HEIGHT;

  if (company.logo) {
    const imageProperties = pdf.getImageProperties(company.logo);
    const aspectRatio = imageProperties.width / imageProperties.height;

    logoHeight = LOGO_WIDTH / aspectRatio;

    pdf.addImage(company.logo, "PNG", LEFT, TOP, LOGO_WIDTH, logoHeight);
  }

  // --------------------------------------------------
  // Company details
  // --------------------------------------------------

  let companyY = TOP + 1;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(DETAIL_FONT_SIZE);
  pdf.setTextColor(75, 75, 75);

  const addressLines = [company.address1, company.address2].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  if (addressLines.length > 0) {
    pdf.text(addressLines, rightX, companyY, {
      align: "right",
      lineHeightFactor: 1.15,
    });

    companyY += addressLines.length * 3;
  }

  // --------------------------------------------------
  // Header divider
  // --------------------------------------------------

  const dividerY = Math.max(TOP + logoHeight, companyY) + HEADER_DIVIDER_GAP;

  pdf.setDrawColor(175, 185, 195);
  pdf.setLineWidth(0.3);
  pdf.line(LEFT, dividerY, rightX, dividerY);

  // --------------------------------------------------
  // Document title
  // --------------------------------------------------

  const titleY = dividerY + TITLE_GAP;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(TITLE_FONT_SIZE);
  pdf.setTextColor(25, 45, 65);

  pdf.text(options.title.toUpperCase(), pageWidth / 2, titleY, {
    align: "center",
  });

  // --------------------------------------------------
  // Document date
  // --------------------------------------------------

  let bottomY = titleY + BOTTOM_DIVIDER_GAP;

  if (options.documentDate) {
    const formattedDate = formatPdfDate(options.documentDate);
    const dateY = titleY + DATE_GAP;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(DATE_FONT_SIZE);
    pdf.setTextColor(65, 65, 65);

    pdf.text(`Date: ${formattedDate}`, rightX, dateY, {
      align: "right",
    });

    bottomY = dateY + BOTTOM_DIVIDER_GAP;
  }

  // No bottom divider below the title/date.

  return bottomY + CONTENT_GAP;
}
