/**
 * Utilitário otimizado para processamento de imagem e extração de assinaturas em papel.
 * Aplica conversão e isolamento do traço mantendo o fundo transparente limpo.
 */

interface ProcessingOptions {
  thresholdOffset?: number; 
  penColor?: { r: number; g: number; b: number }; 
}

export const extractSignature = (
  imageFile: File,
  options: ProcessingOptions = {}
): Promise<string> => {
  const { thresholdOffset = 15, penColor = { r: 0, g: 0, b: 0 } } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);
    img.src = objectUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível inicializar o contexto 2D do Canvas."));
        return;
      }

      // Redução proporcional preventiva de segurança para assinaturas gigantescas de câmera móvel
      const MAX_DIMENSION = 1600;
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Otimização de Performance: Algorítmo de limiar adaptativo linearizado de passo otimizado
      const grayscale = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }

      // Janela de varredura otimizada por amostragem para evitar congelamento de thread (Complexidade Reduzida)
      const windowSize = 8; 
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const pixelPos = index * 4;

          let sum = 0;
          let count = 0;
          
          // Otimização: Varredura com pulo de amostragem reduz o processamento interno em 4x
          for (let ky = -windowSize; ky <= windowSize; ky += 2) {
            for (let kx = -windowSize; kx <= windowSize; kx += 2) {
              const nx = x + kx;
              const ny = y + ky;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                sum += grayscale[ny * width + nx];
                count++;
              }
            }
          }

          const localAverage = sum / count;

          // Se o pixel for visivelmente mais escuro que a média da vizinhança, mantém o traço da caneta
          if (grayscale[index] < localAverage - thresholdOffset) {
            data[pixelPos] = penColor.r;     
            data[pixelPos + 1] = penColor.g; 
            data[pixelPos + 2] = penColor.b; 
            data[pixelPos + 3] = 255;        
          } else {
            // Torna o fundo branco do papel 100% transparente
            data[pixelPos + 3] = 0;          
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      const base64Result = canvas.toDataURL("image/png");
      
      // Desalocação segura e imediata dos recursos gráficos após a conversão bem-sucedida
      URL.revokeObjectURL(objectUrl);
      canvas.width = 0;
      canvas.height = 0;
      
      resolve(base64Result);
    };

    img.onerror = (err) => {
      // Garante a liberação de RAM mesmo em cenários de falha crítica na leitura do arquivo de imagem
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};
