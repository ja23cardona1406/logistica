import React from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import AssistantChat from '../components/assistant/AssistantChat';
import Button from '../components/ui/Button';

const AssistantPage: React.FC = () => {
  const { hasActiveSession } = useSession();
  const navigate = useNavigate();

  if (!hasActiveSession) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sesión no iniciada</h2>
        <p className="text-gray-600 mb-6">
          Debes iniciar una sesión de trabajo para acceder al asistente virtual.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Asistente Virtual</h1>
      <AssistantChat />
    </div>
  );
};

export default AssistantPage;