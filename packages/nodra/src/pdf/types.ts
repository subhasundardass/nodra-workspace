import type { jsPDF } from "jspdf";

export type PdfColumn<T> = {
  header: string;
  key: keyof T & string;
  align?: "left" | "center" | "right";
  format?: (value: unknown, row: T) => string;
};

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
  subtitle?: string;
};

export type PdfOptions<T> = {
  title: string;
  subtitle?: string;
  company?: PdfCompanyDetails;
  columns: PdfColumn<T>[];
  rows: T[];
  filename?: string;
  footerText?: string;
  orientation?: "portrait" | "landscape";
  format?: string | number[];
};

export type PdfDocument = jsPDF;
