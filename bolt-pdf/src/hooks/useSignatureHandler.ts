import { useState, useCallback } from "react";
import { extractSignature } from "../utils/signatureExtractor";

export const useSignatureHandler = () => {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido (PNG ou JPG).");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const extractedPng = await extractSignature(file, { thresholdOffset: 18 });
      setSignatureImage(extractedPng);
    } catch (err) {
      setError("Falha ao extrair a assinatura da imagem. Tente uma foto mais nítida.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearSignature = useCallback(() => {
    setSignatureImage(null);
    setError(null);
  }, []);

  return { signatureImage, isProcessing, error, processFile, clearSignature };
};
