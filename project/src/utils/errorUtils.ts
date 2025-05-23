// src/utils/errorUtils.ts

export interface ApiError {
  code?: string;
  message?: string;
  status?: number;
  response?: {
    data?: any;
    status?: number;
  };
}

/**
 * Verifica si un error es de conexión de red
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ERR_CONNECTION_REFUSED' ||
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('Failed to fetch')
  );
};

/**
 * Verifica si un error es de servidor (5xx)
 */
export const isServerError = (error: any): boolean => {
  return (
    error?.response?.status >= 500 ||
    error?.status >= 500
  );
};

/**
 * Verifica si un error es de cliente (4xx)
 */
export const isClientError = (error: any): boolean => {
  const status = error?.response?.status || error?.status;
  return status >= 400 && status < 500;
};

/**
 * Extrae un mensaje de error legible
 */
export const getErrorMessage = (error: any): string => {
  // Error de red
  if (isNetworkError(error)) {
    return 'No se puede conectar con el servidor. Verifica tu conexión a internet.';
  }

  // Error del servidor
  if (isServerError(error)) {
    return 'Error del servidor. Por favor, intenta más tarde.';
  }

  // Error de autenticación
  if (error?.response?.status === 401) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  }

  // Error de autorización
  if (error?.response?.status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }

  // Error de no encontrado
  if (error?.response?.status === 404) {
    return 'El recurso solicitado no fue encontrado.';
  }

  // Mensaje personalizado del servidor
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Mensaje del error
  if (error?.message) {
    return error.message;
  }

  // Mensaje por defecto
  return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
};

/**
 * Maneja errores de API de manera consistente
 */
export const handleApiError = (error: any): {
  isNetworkError: boolean;
  isServerError: boolean;
  message: string;
  shouldRetry: boolean;
} => {
  const networkError = isNetworkError(error);
  const serverError = isServerError(error);
  
  return {
    isNetworkError: networkError,
    isServerError: serverError,
    message: getErrorMessage(error),
    shouldRetry: networkError || serverError
  };
};

/**
 * Crea un error tipado para casos específicos
 */
export const createError = (message: string, code?: string, status?: number): ApiError => {
  return {
    message,
    code,
    status
  };
};

/**
 * Logs de error para debugging
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    context,
    message: error?.message,
    code: error?.code,
    status: error?.response?.status || error?.status,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  };
  
  console.error('Error logged:', errorInfo);
  
  // Aquí podrías enviar el error a un servicio de logging como Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   // Enviar a servicio de logging
  // }
};