import { useState, useCallback, useRef, useEffect } from "react";
import { extractSignature } from "../utils/signatureExtractor";

export const useSignatureHandler = () => {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Referência para rastrear e limpar URLs criadas, prevenindo vazamentos de memória na RAM
  const activeUrlRef = useRef<string | null>(null);

  // Limpeza preventiva em caso de desmonte inesperado do componente que consome o hook
  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);

  // Assinatura corrigida de 'File' para 'FileList' para sanar o erro de integração com o SignatureModal
  const processFile = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido (PNG ou JPG).");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Processamento pesado do motor de extração
      const extractedPngBase64 = await extractSignature(file, { thresholdOffset: 18 });
      
      // Limpeza de URL anterior se o usuário decidir trocar de foto antes de inserir no PDF
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }

      // Otimização de RAM: Se o motor retornar base64, podemos convertê-lo ou usá-lo com segurança controlada
      setSignatureImage(extractedPngBase64);
    } catch (err) {
      setError("Falha ao extrair a assinatura da imagem. Tente uma foto mais nítida.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearSignature = useCallback(() => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
    setSignatureImage(null);
    setError(null);
  }, []);

  return { signatureImage, isProcessing, error, processFile, clearSignature };
};
