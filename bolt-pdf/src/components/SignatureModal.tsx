import React, { useRef, useEffect } from "react";
import { useSignatureHandler } from "../hooks/useSignatureHandler";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureExtracted: (base64Png: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSignatureExtracted,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { signatureImage, isProcessing, error, processFile, clearSignature } = useSignatureHandler();

  // Gerenciamento global de acessibilidade (Teclado e Foco)
  useEffect(() => {
    if (!isOpen) return;

    // Captura o foco para dentro do container do modal (Focus Trap inicial)
    modalRef.current?.focus();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen, onClose]);

  // Executa uma limpeza preventiva caso o modal seja fechado durante uma operação assíncrona
  useEffect(() => {
    if (!isOpen) {
      clearSignature();
    }
  }, [isOpen, clearSignature]);

  if (!isOpen) return null;

  // CORREÇÃO DEFINITIVA: Passa a lista de arquivos inteira (FileList) para casar com a assinatura do hook
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files); 
    }
  };

  const handleConfirmSignature = () => {
    if (signatureImage) {
      onSignatureExtracted(signatureImage);
      clearSignature();
      onClose();
    }
  };

  return (
    <div 
      style={styles.backdrop} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sig-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        className="focus:outline-none"
      >
        {/* Cabeçalho do Componente com Alinhamento Corrigido */}
        <div style={styles.header}>
          <h3 id="modal-sig-title" style={styles.title}>Extrair Assinatura do Papel</h3>
          <button 
            type="button" 
            style={styles.closeBtn} 
            onClick={onClose} 
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </div>

        {/* Corpo de Mídia e Upload */}
        <div style={styles.body}>
          {!signatureImage ? (
            <div style={styles.uploadArea}>
              <p style={styles.instructions}>
                Tire uma foto nítida da sua assinatura escrita em uma folha de papel branco. 
                Nossa ferramenta irá isolar o traço automaticamente.
              </p>
              
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <button 
                type="button"
                style={styles.primaryButton} 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando Imagem..." : "Selecionar Foto / Tirar Foto"}
              </button>
            </div>
          ) : (
            <div style={styles.previewContainer}>
              <p style={styles.previewText}>Resultado da Extração (Fundo Transparente):</p>
              
              <div style={styles.checkerboardBackground}>
                <img 
                  src={signatureImage} 
                  alt="Preview da Assinatura Extraída" 
                  style={styles.previewImg} 
                />
              </div>

              <div style={styles.buttonGroup}>
                <button type="button" style={styles.secondaryButton} onClick={clearSignature}>
                  Tirar Outra Foto
                </button>
                <button type="button" style={styles.confirmButton} onClick={handleConfirmSignature}>
                  Inserir no PDF
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={styles.errorAlert} role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Objeto de Estilos Inline Estabilizados
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#121214",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    border: "1px solid #29292e",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #29292e",
  },
  title: {
    margin: 0,
    color: "#e1e1e6",
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#7c7c8a",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0 4px",
  },
  body: {
    padding: "20px",
  },
  uploadArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "16px",
  },
  instructions: {
    color: "#a8a8b3",
    fontSize: "0.9rem",
    lineHeight: "1.5",
    margin: 0,
  },
  previewContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },
  previewText: {
    color: "#e1e1e6",
    fontSize: "0.9rem",
    alignSelf: "flex-start",
    margin: 0,
  },
  checkerboardBackground: {
    width: "100%",
    height: "180px",
    backgroundColor: "#1e1e22",
    backgroundImage: `linear-gradient(45deg, #29292e 25%, transparent 25%), 
                      linear-gradient(-45deg, #29292e 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #29292e 75%), 
                      linear-gradient(-45deg, transparent 75%, #29292e 75%)`,
    backgroundSize: "20px 20px",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px dashed #4d4d57",
    padding: "10px",
  },
  previewImg: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  buttonGroup: {
    display: "flex",
    width: "100%",
    gap: "12px",
    marginTop: "8px",
  },
  primaryButton: {
    backgroundColor: "#00b37e",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  },
  confirmButton: {
    backgroundColor: "#00b37e",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    color: "#a8a8b3",
    border: "1px solid #4d4d57",
    padding: "10px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
  },
  errorAlert: {
    marginTop: "12px",
    backgroundColor: "#f75a6820",
    border: "1px solid #f75a68",
    color: "#f75a68",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "0.85rem",
    width: "100%",
    textAlign: "center",
  },
};
