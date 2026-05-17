/**
 * Utilitário original para processamento de imagem e extração de assinaturas em papel.
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
    img.src = URL.createObjectURL(imageFile);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Não foi possível inicializar o contexto 2D do Canvas."));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      const grayscale = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }

      const s2 = 8; 
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const pixelPos = index * 4;

          let sum = 0;
          let count = 0;
          
          for (let ky = -s2; ky <= s2; ky++) {
            for (let kx = -s2; kx <= s2; kx++) {
              const nx = x + kx;
              const ny = y + ky;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                sum += grayscale[ny * width + nx];
                count++;
              }
            }
          }

          const localAverage = sum / count;

          if (grayscale[index] < localAverage - thresholdOffset) {
            data[pixelPos] = penColor.r;     
            data[pixelPos + 1] = penColor.g; 
            data[pixelPos + 2] = penColor.b; 
            data[pixelPos + 3] = 255;        
          } else {
            data[pixelPos + 3] = 0;          
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      const base64Result = canvas.toDataURL("image/png");
      URL.revokeObjectURL(img.src);
      resolve(base64Result);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
};
