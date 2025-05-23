import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertTriangle, Wifi } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { NLPResponse } from '../../types';
import api from '../../lib/api';

const AssistantChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'assistant'; response?: NLPResponse }[]>([
    { 
      text: '¡Hola! Soy tu asistente virtual para ayudarte con los procesos de Repremundo. ¿En qué puedo ayudarte hoy?', 
      sender: 'assistant' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    setConnectionError(false);
    
    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    
    setIsLoading(true);
    
    try {
      // Send message to NLP service
      const response = await api.post<NLPResponse>('/api/assistant/query', {
        query: userMessage
      });
      
      const nlpResponse = response.data;
      
      // Add assistant response to chat
      setMessages(prev => [
        ...prev, 
        { 
          text: nlpResponse.answer || 'Lo siento, no puedo entender tu consulta en este momento.', 
          sender: 'assistant',
          response: nlpResponse
        }
      ]);
    } catch (error: any) {
      console.error('Error sending message to assistant:', error);
      
      let errorMessage = 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
      
      // Check if it's a connection error
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ERR_CONNECTION_REFUSED') {
        setConnectionError(true);
        errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión y que el servidor esté funcionando.';
      }
      
      setMessages(prev => [
        ...prev,
        {
          text: errorMessage,
          sender: 'assistant'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setConnectionError(false);
    setMessages(prev => [
      ...prev,
      {
        text: 'Conexión restablecida. ¿En qué puedo ayudarte?',
        sender: 'assistant'
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Bot size={24} className="mr-2" />
          <h2 className="text-lg font-semibold">Asistente Virtual</h2>
        </div>
        
        {connectionError && (
          <div className="flex items-center text-yellow-200">
            <AlertTriangle size={16} className="mr-1" />
            <span className="text-xs">Sin conexión</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p>{message.text}</p>
              
              {message.response?.imageUrl && (
                <div className="mt-2">
                  <img
                    src={message.response.imageUrl}
                    alt="Process image"
                    className="max-w-full h-auto rounded-md"
                  />
                </div>
              )}
              
              {message.response?.processId && message.response?.stepId && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      // Navigate to process step
                      console.log(`Navigate to process ${message.response?.processId}, step ${message.response?.stepId}`);
                    }}
                  >
                    Ver paso del proceso
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {connectionError && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center text-red-700 mb-2">
                <AlertTriangle size={16} className="mr-2" />
                <span className="font-medium">Error de conexión</span>
              </div>
              <p className="text-sm text-red-600 mb-3">
                No se puede conectar con el servidor del asistente.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                leftIcon={<Wifi size={14} />}
                className="w-full"
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={connectionError ? "Servidor no disponible..." : "Escribe tu pregunta aquí..."}
            className="flex-1"
            disabled={isLoading || connectionError}
          />
          <Button
            type="submit"
            variant="primary"
            className="ml-2"
            isLoading={isLoading}
            disabled={isLoading || !input.trim() || connectionError}
            leftIcon={<Send size={18} />}
          >
            Enviar
          </Button>
        </form>
        
        {connectionError && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Verifica que el servidor esté corriendo y tu conexión funcione correctamente
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantChat;