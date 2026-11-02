import type { jsPDF } from "jspdf";
import { company as defaultCompany } from "@/config/company";

export type PdfCompanyDetails = {
  name?: string;
  logo?: string;
  address?: string;
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

export function addPdfHeader(pdf: jsPDF, options: PdfHeaderOptions): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const rightX = pageWidth - RIGHT;

  // Use global MyShop company details by default.
  const company = options.company ?? defaultCompany;

  // --------------------------------------------------
  // Logo - left side
  // --------------------------------------------------

  if (company.logo) {
    const imageProperties = pdf.getImageProperties(company.logo);
    const aspectRatio = imageProperties.width / imageProperties.height;

    const logoWidth = LOGO_WIDTH;
    const logoHeight = logoWidth / aspectRatio;

    pdf.addImage(company.logo, "PNG", LEFT, TOP, logoWidth, logoHeight);
  }

  // --------------------------------------------------
  // Company details - right side
  // --------------------------------------------------

  const detailsX = rightX;
  const detailsWidth = pageWidth - LEFT - RIGHT - LOGO_WIDTH - 10;

  let companyY = TOP + 1;

  // Enable if Company Name show in PDF
  // if (company.name) {
  //   pdf.setFont("helvetica", "bold");
  //   pdf.setFontSize(11);
  //   pdf.setTextColor(25, 45, 65);

  //   pdf.text(company.name, detailsX, companyY, {
  //     align: "right",
  //   });

  //   companyY += 4.5;
  // }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(DETAIL_FONT_SIZE);
  pdf.setTextColor(75, 75, 75);

  if (company.address) {
    const addressLines = pdf.splitTextToSize(company.address, detailsWidth);

    pdf.text(addressLines, detailsX, companyY, {
      align: "right",
    });

    companyY += addressLines.length * 3;
  }

  const contactDetails = [
    company.phone ? `Phone: ${company.phone}` : undefined,
    // company.email ? `Email: ${company.email}` : undefined,
    // company.website ? `Web: ${company.website}` : undefined,
    // company.gstin ? `GSTIN: ${company.gstin}` : undefined,
  ].filter((value): value is string => Boolean(value));

  for (const detail of contactDetails) {
    const lines = pdf.splitTextToSize(detail, detailsWidth);

    pdf.text(lines, detailsX, companyY, {
      align: "right",
    });

    companyY += lines.length * 3;
  }

  // --------------------------------------------------
  // Header divider
  // --------------------------------------------------

  const dividerY = Math.max(TOP + LOGO_HEIGHT, companyY) + 1;

  pdf.setDrawColor(175, 185, 195);
  pdf.setLineWidth(0.3);
  pdf.line(LEFT, dividerY, rightX, dividerY);

  // --------------------------------------------------
  // Document title
  // --------------------------------------------------

  const titleY = dividerY + 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(25, 45, 65);

  pdf.text(options.title.toUpperCase(), pageWidth / 2, titleY, {
    align: "center",
  });

  // --------------------------------------------------
  // Document number and date
  // --------------------------------------------------

  const infoY = titleY + 5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(65, 65, 65);

  if (options.documentNo) {
    pdf.text(`No: ${options.documentNo}`, LEFT, infoY);
  }

  if (options.documentDate) {
    pdf.text(`Date: ${options.documentDate}`, rightX, infoY, {
      align: "right",
    });
  }

  // --------------------------------------------------
  // Bottom divider
  // --------------------------------------------------

  const bottomY = infoY + 2;

  pdf.setDrawColor(175, 185, 195);
  pdf.setLineWidth(0.25);
  pdf.line(LEFT, bottomY, rightX, bottomY);

  return bottomY + 5;
}
