import PDFDocument from "pdfkit";
import { fetchAdminPayment } from "./admin-payment.service";

export const buildAdminPaymentPdf = async (transactionId: string): Promise<Buffer> => {
  const payment = await fetchAdminPayment(transactionId);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(20).text("Emilist Transaction Receipt");
    doc.moveDown().font("Helvetica").fontSize(11);
    doc.text(`Transaction ID: ${payment.transactionId}`);
    doc.text(`Date: ${new Date(payment.date).toISOString()}`);
    doc.text(`Direction: ${payment.direction}`);
    doc.text(`Status: ${payment.status}`);
    doc.text(`Counterparty: ${payment.counterparty || "-"}`);
    doc.text(`Payment method: ${payment.paymentMethod || "-"}`);
    doc.text(`Description: ${payment.description || "-"}`);
    doc.moveDown().font("Helvetica-Bold").fontSize(17);
    doc.text(`Amount: ${payment.currency} ${Number(payment.amount || 0).toLocaleString("en-NG")}`);
    doc.end();
  });
};
