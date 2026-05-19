/**
 * Genera un PDF mínimo (1 página, en memoria) para usar como comprobante de pago.
 * Evita binarios en el repo. No es un PDF "bonito": es válido a nivel de header
 * y suficiente para que el backend lo acepte (lo único que valida es el mime).
 */

const PDF_BYTES = Buffer.from(
  `%PDF-1.1
1 0 obj<< /Type/Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type/Pages /Count 1 /Kids[3 0 R] >>endobj
3 0 obj<< /Type/Page /Parent 2 0 R /MediaBox[0 0 200 200] >>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000055 00000 n
0000000101 00000 n
trailer<< /Size 4 /Root 1 0 R >>
startxref
160
%%EOF
`,
  'utf-8',
)

export const proofPdf = {
  name: 'comprobante-e2e.pdf',
  mimeType: 'application/pdf',
  buffer: PDF_BYTES,
}
