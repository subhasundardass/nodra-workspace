import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type OfferPdfRow = {
  factory: string;
  lotNo: string;
  brand: string;
  grade: string;
  bags: number;
  kgs: number;
  totalKg: number;
  askingRate: number;
};

type GenerateOfferPdfOptions = {
  offerName: string;
  offerDate?: string;
  rows: OfferPdfRow[];
};

export function generateOfferPdf({
  offerName,
  offerDate,
  rows,
}: GenerateOfferPdfOptions) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(value);

  const factories = new Map<string, OfferPdfRow[]>();

  // Group offer rows by factory.
  for (const row of rows) {
    const factory = row.factory || "Unassigned Factory";

    if (!factories.has(factory)) {
      factories.set(factory, []);
    }

    factories.get(factory)!.push(row);
  }

  // Document heading.
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("TEA OFFER SHEET", 148.5, 15, { align: "center" });

  // Offer details.
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  pdf.text(`Offer No: ${offerName}`, 14, 25);
  pdf.text(`Offer Date: ${offerDate || "-"}`, 14, 31);

  let currentY = 40;

  for (const [factory, factoryRows] of factories) {
    const totalBags = factoryRows.reduce((sum, row) => sum + row.bags, 0);

    const totalKg = factoryRows.reduce((sum, row) => sum + row.totalKg, 0);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");

    if (currentY > 175) {
      pdf.addPage();
      currentY = 25;
    }

    pdf.text(`${factory}`, 14, currentY);
    currentY += 2;

    autoTable(pdf, {
      startY: currentY + 4,
      head: [
        [
          "Lot No.",
          "Brand",
          "Grade",
          "Bags",
          "Kgs",
          "Total Kg",
          "Asking Price",
        ],
      ],
      body: factoryRows.map((row) => [
        row.lotNo,
        row.brand,
        row.grade,
        formatNumber(row.bags),
        formatNumber(row.kgs),
        formatNumber(row.totalKg),
        formatNumber(row.askingRate),
      ]),
      foot: [
        [
          "Factory Total",
          "",
          "",
          formatNumber(totalBags),
          "",
          formatNumber(totalKg),
          "",
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: 0,
        lineColor: [190, 190, 190],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [235, 235, 235],
        textColor: 0,
        fontStyle: "bold",
        lineColor: [190, 190, 190],
        lineWidth: 0.15,
      },
      footStyles: {
        fillColor: 255,
        textColor: 0,
        fontStyle: "bold",
        lineColor: [190, 190, 190],
        lineWidth: 0.15,
      },
      margin: {
        top: 7,
        right: 7,
        bottom: 7,
        left: 7,
      },
    });

    const table = (
      pdf as jsPDF & {
        lastAutoTable?: { finalY: number };
      }
    ).lastAutoTable;

    currentY = (table?.finalY ?? currentY + 20) + 12;
  }

  // Download the PDF.
  pdf.save(`${offerName}-Offer.pdf`);
}
