import type { jsPDF } from "jspdf";

export type PdfMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PdfLayoutContext = {
  pdf: jsPDF;

  page: {
    width: number;
    height: number;
  };

  margins: PdfMargins;

  cursor: {
    x: number;
    y: number;
  };

  ensureSpace(height: number): void;
  addPage(): void;
  getAvailableWidth(): number;
  getAvailableHeight(): number;
};

const DEFAULT_MARGINS: PdfMargins = {
  top: 30,
  right: 14,
  bottom: 18,
  left: 14,
};

export function createLayoutContext(
  pdf: jsPDF,
  margins: Partial<PdfMargins> = {},
): PdfLayoutContext {
  const resolvedMargins: PdfMargins = {
    ...DEFAULT_MARGINS,
    ...margins,
  };

  const context: PdfLayoutContext = {
    pdf,

    page: {
      width: pdf.internal.pageSize.getWidth(),
      height: pdf.internal.pageSize.getHeight(),
    },

    margins: resolvedMargins,

    cursor: {
      x: resolvedMargins.left,
      y: resolvedMargins.top,
    },

    ensureSpace(height: number) {
      const availableBottom = context.page.height - context.margins.bottom;

      if (context.cursor.y + height > availableBottom) {
        context.addPage();
      }
    },

    addPage() {
      pdf.addPage();

      context.page.width = pdf.internal.pageSize.getWidth();
      context.page.height = pdf.internal.pageSize.getHeight();

      context.cursor.x = context.margins.left;
      context.cursor.y = context.margins.top;
    },

    getAvailableWidth() {
      return context.page.width - context.margins.left - context.margins.right;
    },

    getAvailableHeight() {
      return context.page.height - context.margins.top - context.margins.bottom;
    },
  };

  return context;
}

export function ensureSpace(context: PdfLayoutContext, height: number): void {
  context.ensureSpace(height);
}

export function addPage(context: PdfLayoutContext): void {
  context.addPage();
}

export function getAvailableWidth(context: PdfLayoutContext): number {
  return context.getAvailableWidth();
}

export function getAvailableHeight(context: PdfLayoutContext): number {
  return context.getAvailableHeight();
}
