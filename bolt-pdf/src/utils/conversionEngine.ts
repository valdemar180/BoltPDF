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

  // Sanitização estrita e normalização para evitar quebras por variações de caixa alta/baixa
  const normalizedMime = mimeType.trim().toLowerCase();

  // Tratamento robusto cobrindo extensões não oficiais comuns no ecossistema web
  if (normalizedMime === 'image/png') {
    embeddedImage = await pdfDoc.embedPng(imageBuffer);
  } else if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    embeddedImage = await pdfDoc.embedJpg(imageBuffer);
  } else {
    throw new Error('Formato de imagem inválido. Use apenas PNG ou JPG/JPEG.');
  }

  // Define o tamanho padrão da folha (A4: 595.28 x 841.89 pontos)
  const [a4Width, a4Height] = PageSizes.A4;
  const page = pdfDoc.addPage([a4Width, a4Height]);

  const imageWidth = embeddedImage.width;
  const imageHeight = embeddedImage.height;
  
  // Otimização gráfica: Impede que imagens pequenas sofram upscale e fiquem pixelizadas no A4
  const scale = Math.min(1.0, Math.min(a4Width / imageWidth, a4Height / imageHeight));

  const finalWidth = imageWidth * scale;
  const finalHeight = imageHeight * scale;

  // Centraliza a imagem na folha de forma simétrica com base no tamanho final calculado
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
