import { useCallback } from 'react';

interface UseToolValidationProps {
  currentFile: File | null;
  onError: (errorMessage: string) => void;
}

export function useToolValidation({ currentFile, onError }: UseToolValidationProps) {
  
  /**
   * Intercepta a ação pretendida, valida o contexto de arquivos e injeta erros no estado global.
   * Blindado contra funções síncronas/assíncronas e vazamentos de Promises.
   */
  const validateAction = useCallback(async (
    toolName: string, 
    actionCallback: () => Promise<void> | void
  ) => {
    // Normalização da String para evitar falhas por quebra de maiúsculas/minúsculas em refatorações de UI
    const normalizedToolName = toolName.trim().toLowerCase();

    // Regra de exceção: A mesclagem é validada internamente pelo App.tsx (pois checa a fila de múltiplos arquivos)
    if (normalizedToolName === "mesclar pdf") {
      try {
        // Envelopa a execução em um Promise.resolve para capturar rejeições mesmo se a função omitir o async
        await Promise.resolve(actionCallback());
        return;
      } catch (error) {
        console.error(`Erro crítico ao executar a ferramenta ${toolName}:`, error);
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
      // Garante a resolução estrita da Promessa e bloqueia o fluxo até a consolidação total
      await Promise.resolve(actionCallback());
    } catch (error) {
      console.error(`Erro crítico ao executar a ferramenta ${toolName}:`, error);
      onError(`Ocorreu um erro ao processar a ferramenta: ${toolName}.`);
    }
  }, [currentFile, onError]); // Mantido estável com salvaguardas de normalização

  return { validateAction };
}
