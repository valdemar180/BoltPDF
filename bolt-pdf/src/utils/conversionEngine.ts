import { PDFDocument } from 'pdf-lib';

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
  // Instancia um documento PDF vazio na memória do cliente
  const pdfDoc = await PDFDocument.create();
  let embeddedImage;

  // Renderiza e acopla a imagem com base no codec correto de compressão
  if (mimeType === 'image/png') {
    embeddedImage = await pdfDoc.embedPng(imageBuffer);
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    embeddedImage = await pdfDoc.embedJpg(imageBuffer);
  } else {
    throw new Error('Formato de imagem inválido. Use apenas PNG ou JPG/JPEG.');
  }

  // Captura a geometria geométrica da imagem original para manter a proporção
  const { width, height } = embeddedImage.scale(1);

  // Insere uma nova página com as dimensões idênticas às do arquivo original
  const page = pdfDoc.addPage([width, height]);

  // Desenha a imagem cobrindo toda a área vetorial do documento gerado
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  // Exporta a estrutura binária final do PDF compilado
  return await pdfDoc.save();
}
