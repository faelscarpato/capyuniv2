export interface AIError {
  code: string;
  userMessage: string;
  suggestion?: string;
}

const AI_ERRORS: AIError[] = [
  {
    code: 'API_KEY_INVALID',
    userMessage: 'Chave de API inválida',
    suggestion: 'Verifique sua API Key nas configurações'
  },
  {
    code: 'API_KEY_MISSING',
    userMessage: 'Chave de API não configurada',
    suggestion: 'Adicione sua API Key no modal de configurações'
  },
  {
    code: 'QUOTA_EXCEEDED',
    userMessage: 'Cota da API excedida',
    suggestion: 'Limite de uso atingido. Verifique o console do Google AI Studio'
  },
  {
    code: 'RATE_LIMIT',
    userMessage: 'Many requests - rate limit',
    suggestion: 'Aguarde alguns segundos antes de fazer outra requisição'
  },
  {
    code: 'NETWORK_ERROR',
    userMessage: 'Erro de conexão',
    suggestion: 'Verifique sua conexão com a internet'
  },
  {
    code: 'TIMEOUT',
    userMessage: 'Tempo de requisição excedido',
    suggestion: 'Tente novamente ou use um modelo mais leve'
  },
  {
    code: 'MODEL_NOT_FOUND',
    userMessage: 'Modelo não encontrado',
    suggestion: 'Modelo inválido ou indisponível'
  },
  {
    code: 'CONTENT_FILTERED',
    userMessage: 'Conteúdo bloqueado por filtros de segurança',
    suggestion: 'Reduza ou modifique o prompt'
  },
  {
    code: 'RESPONSE_BLOCKED',
    userMessage: 'Resposta bloqueada por filtros de segurança',
    suggestion: 'Tente um prompt diferente'
  },
  {
    code: 'GENERATION_ERROR',
    userMessage: 'Erro ao gerar resposta',
    suggestion: 'Tente novamente'
  },
  {
    code: 'EMPTY_RESPONSE',
    userMessage: 'Resposta vazia da IA',
    suggestion: 'Tente um prompt mais específico'
  }
];

export const parseAIError = (error: unknown): AIError => {
  if (!error) {
    return { code: 'UNKNOWN', userMessage: 'Erro desconhecido' };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  for (const aiError of AI_ERRORS) {
    if (errorMessage.toLowerCase().includes(aiError.code.toLowerCase().replace(/_/g, ' '))) {
      return aiError;
    }
  }

  if (errorMessage.includes('400')) {
    return { code: 'BAD_REQUEST', userMessage: 'Requisição inválida', suggestion: 'Verifique os parâmetros' };
  }
  if (errorMessage.includes('401')) {
    return AI_ERRORS[0];
  }
  if (errorMessage.includes('403')) {
    return { code: 'FORBIDDEN', userMessage: 'Acesso proibido', suggestion: 'Verifique as permissões da API Key' };
  }
  if (errorMessage.includes('404')) {
    return AI_ERRORS[6];
  }
  if (errorMessage.includes('429')) {
    return AI_ERRORS[2];
  }
  if (errorMessage.includes('500')) {
    return { code: 'SERVER_ERROR', userMessage: 'Erro no servidor da IA', suggestion: 'Tente novamente mais tarde' };
  }
  if (errorMessage.includes('503')) {
    return { code: 'SERVICE_UNAVAILABLE', userMessage: 'Serviço indisponível', suggestion: 'Tente novamente mais tarde' };
  }
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
    return AI_ERRORS[4];
  }
  if (errorMessage.toLowerCase().includes('timeout')) {
    return AI_ERRORS[5];
  }
  if (errorMessage.toLowerCase().includes('quota')) {
    return AI_ERRORS[2];
  }
  if (errorMessage.toLowerCase().includes('rate limit')) {
    return AI_ERRORS[3];
  }
  if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('api_key')) {
    return AI_ERRORS[0];
  }

  return { code: 'UNKNOWN', userMessage: 'Erro na comunicação com IA' };
};

export const getUserFriendlyError = (error: unknown): string => {
  const parsed = parseAIError(error);
  return parsed.suggestion 
    ? `${parsed.userMessage}. ${parsed.suggestion}`
    : parsed.userMessage;
};