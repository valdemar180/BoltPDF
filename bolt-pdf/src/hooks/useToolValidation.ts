import { useCallback } from 'react';

interface UseToolValidationProps {
  currentFile: File | null;
  onError: (errorMessage: string) => void;
}

export function useToolValidation({ currentFile, onError }: UseToolValidationProps) {
  /**
   * Intercepta a ação pretendida, valida o contexto de arquivos e injeta erros no estado global.
   */
  const validateAction = useCallback(async (
    toolName: string, 
    actionCallback: () => Promise<void> | void
  ) => {
    // Regra de exceção: A mesclagem é validada internamente pelo App.tsx (pois checa a fila de múltiplos arquivos)
    if (toolName === "Mesclar PDF") {
      try {
        await actionCallback();
        return;
      } catch (error) {
        console.error(`Erro ao executar a ferramenta ${toolName}:`, error);
        onError(`Ocorreu um erro ao processar a ferramenta: ${toolName}.`);
        return;
      }
    }

    // Validação padrão para ferramentas que exigem arquivo individual imediato (Converter, Dividir, etc)
    if (!currentFile) {
      onError(`Por favor, adicione um arquivo antes de usar a ferramenta: ${toolName}.`);
      return;
    }

    try {
      // Executa com segurança aceitando funções síncronas ou promessas
      await actionCallback();
    } catch (error) {
      console.error(`Erro ao executar a ferramenta ${toolName}:`, error);
      onError(`Ocorreu um erro ao processar a ferramenta: ${toolName}.`);
    }
  }, [currentFile, onError]);

  return { validateAction };
}
