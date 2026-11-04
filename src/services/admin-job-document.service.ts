import PDFDocument from "pdfkit";
import { fetchAdminJobDetails, fetchAdminJobInvoice, fetchAdminJobPayment } from "./admin-job.service";

const renderPdf = (render: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);
  render(doc);
  doc.end();
});

const money = (currency: string, amount: number) => `${currency || "NGN"} ${Number(amount || 0).toLocaleString("en-NG")}`;

export const buildAdminJobInvoicePdf = async (jobId: string, invoiceId: string) => {
  const [job, invoice] = await Promise.all([fetchAdminJobDetails(jobId), fetchAdminJobInvoice(jobId, invoiceId)]);
  return renderPdf((doc) => {
    doc.font("Helvetica-Bold").fontSize(20).text("Emilist Job Invoice");
    doc.moveDown().fontSize(11).text(`Invoice: ${invoice.number}`);
    doc.font("Helvetica").text(`Job: ${job.title} (${String(job._id)})`);
    doc.text(`Issued: ${invoice.issuedAt ? new Date(invoice.issuedAt).toISOString() : "-"}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown().font("Helvetica-Bold").text(invoice.tag);
    doc.moveDown().fontSize(16).text(`Total: ${money(invoice.currency, invoice.subtotal)}`);
    if (invoice.note) doc.moveDown().font("Helvetica").fontSize(10).text(`Note: ${invoice.note}`);
  });
};

export const buildAdminJobPaymentReceiptPdf = async (jobId: string, paymentId: string) => {
  const [job, payment] = await Promise.all([fetchAdminJobDetails(jobId), fetchAdminJobPayment(jobId, paymentId)]);
  return renderPdf((doc) => {
    doc.font("Helvetica-Bold").fontSize(20).text("Emilist Payment Receipt");
    doc.moveDown().fontSize(11).text(`Reference: ${payment.reference || payment._id}`);
    doc.font("Helvetica").text(`Job: ${job.title} (${String(job._id)})`);
    doc.text(`Date: ${new Date(payment.dateCompleted || payment.createdAt).toISOString()}`);
    doc.text(`Status: ${payment.status}`);
    doc.text(`Payment method: ${payment.paymentMethod || "-"}`);
    doc.moveDown().font("Helvetica-Bold").fontSize(16).text(`Amount: ${money(payment.currency, payment.amount)}`);
  });
};
