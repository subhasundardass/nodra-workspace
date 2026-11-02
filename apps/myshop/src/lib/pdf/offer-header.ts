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

const LEFT = 7;
const RIGHT = 7;
const TOP = 6;

const LOGO_WIDTH = 50;
const LOGO_HEIGHT = 9;

const DETAIL_FONT_SIZE = 7;
const TITLE_FONT_SIZE = 13;
const DATE_FONT_SIZE = 8;

// Vertical spacing (mm)
const HEADER_DIVIDER_GAP = 2;
const TITLE_GAP = 4;
const DATE_GAP = 3;
const BOTTOM_DIVIDER_GAP = 2;
const CONTENT_GAP = 3;

function formatPdfDate(value: string): string {
  // Preserve date-only values without timezone conversion.
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("/");
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

  const detailsWidth = pageWidth - LEFT - RIGHT - LOGO_WIDTH - 10;

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

  // if (company.phone) {
  //   pdf.text(`Phone: ${company.phone}`, rightX, companyY, {
  //     align: "right",
  //   });

  //   companyY += 3;
  // }

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

  const hasDate = Boolean(options.documentDate);

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

  // --------------------------------------------------
  // Bottom divider
  // --------------------------------------------------

  pdf.setDrawColor(175, 185, 195);
  pdf.setLineWidth(0.25);
  pdf.line(LEFT, bottomY, rightX, bottomY);

  // Starting position for the next PDF section
  return bottomY + CONTENT_GAP;
}
