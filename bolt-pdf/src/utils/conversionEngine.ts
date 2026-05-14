import { PDFDocument, PageSizes } from 'pdf-lib';

/**
 * Converte um buffer de imagem local (PNG ou JPEG) em um documento PDF estruturado.
 * @param imageBuffer ArrayBuffer bruto contido na memória RAM do navegador.
 * @param mimeType Formato do arquivo extraído diretamente do tipo do arquivo (file.type).
 * @returns Promessa contendo o array de bytes (Uint8Array) do PDF pronto para salvamento.
 */
export async function convertImageToPdf(
  imageBuffer: ArrayBuffer, 
  mimeType: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let embeddedImage;

  if (mimeType === 'image/png') {
    embeddedImage = await pdfDoc.embedPng(imageBuffer);
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    embeddedImage = await pdfDoc.embedJpg(imageBuffer);
  } else {
    throw new Error('Formato de imagem inválido. Use apenas PNG ou JPG/JPEG.');
  }

  // Define o tamanho padrão da folha (A4: 595.28 x 841.89 pontos)
  const [a4Width, a4Height] = PageSizes.A4;
  const page = pdfDoc.addPage([a4Width, a4Height]);

  // Calcula as proporções para ajustar a imagem dentro dos limites da folha A4
  const imageWidth = embeddedImage.width;
  const imageHeight = embeddedImage.height;
  const scale = Math.min(a4Width / imageWidth, a4Height / imageHeight);

  const finalWidth = imageWidth * scale;
  const finalHeight = imageHeight * scale;

  // Centraliza a imagem na folha caso ela seja menor que o espaço total do A4
  const xPosition = (a4Width - finalWidth) / 2;
  const yPosition = (a4Height - finalHeight) / 2;

  page.drawImage(embeddedImage, {
    x: xPosition,
    y: yPosition,
    width: finalWidth,
    height: finalHeight,
  });

  return await pdfDoc.save();
}
