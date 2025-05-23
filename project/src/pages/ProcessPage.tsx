import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProcessExecution, ProcessStep, ProcessStepExecution, Process } from '../types';
import api from '../lib/api';
import Button from '../components/ui/Button';
import ProcessStepCard from '../components/processes/ProcessStepCard';
import LoadingScreen from '../components/ui/LoadingScreen';

const ProcessPage: React.FC = () => {
  const { processId } = useParams<{ processId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processExecution, setProcessExecution] = useState<ProcessExecution | null>(null);
  const [process, setProcess] = useState<Process | null>(null);
  const [stepExecutions, setStepExecutions] = useState<ProcessStepExecution[]>([]);
  
  useEffect(() => {
    const fetchProcessData = async () => {
      if (!processId) return;
      
      try {
        setLoading(true);
        // Fetch process execution data
        const [executionRes, stepsRes] = await Promise.all([
          api.get<ProcessExecution>(`/api/processes/execution/${processId}`),
          api.get<ProcessStepExecution[]>(`/api/processes/execution/${processId}/steps`)
        ]);
        
        setProcessExecution(executionRes.data);
        setStepExecutions(stepsRes.data);
        
        // Fetch process details
        const processRes = await api.get<Process>(`/api/processes/${executionRes.data.process_id}`);
        setProcess(processRes.data);
      } catch (err) {
        console.error('Error fetching process data:', err);
        setError('No se pudo cargar la información del proceso. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProcessData();
  }, [processId]);
  
  const handleCompleteStep = async () => {
    if (!processExecution || !process) return;
    
    const currentStep = process.steps.find(
      step => step.order === processExecution.current_step
    );
    
    if (!currentStep) return;
    
    try {
      setLoading(true);
      // Complete the current step
      await api.post(`/api/processes/execution/${processId}/complete-step`, {
        step_id: currentStep.id
      });
      
      // Update local state
      const updatedStepExecutions = stepExecutions.map(se => 
        se.step_id === currentStep.id 
          ? { ...se, status: 'completed', completed_at: new Date().toISOString() } 
          : se
      );
      
      setStepExecutions(updatedStepExecutions);
      
      // Check if this was the last step
      if (processExecution.current_step === process.steps.length) {
        // Process is complete
        setProcessExecution({
          ...processExecution,
          status: 'completed',
          completed_at: new Date().toISOString()
        });
      } else {
        // Move to next step
        setProcessExecution({
          ...processExecution,
          current_step: processExecution.current_step + 1
        });
      }
    } catch (err) {
      console.error('Error completing step:', err);
      setError('No se pudo completar el paso. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReportError = async (errorDescription: string) => {
    if (!processExecution || !process) return;
    
    const currentStep = process.steps.find(
      step => step.order === processExecution.current_step
    );
    
    if (!currentStep) return;
    
    try {
      setLoading(true);
      // Report error for the current step
      await api.post(`/api/processes/execution/${processId}/report-error`, {
        step_id: currentStep.id,
        error_description: errorDescription
      });
      
      // Update local state
      const updatedStepExecutions = stepExecutions.map(se => 
        se.step_id === currentStep.id 
          ? { 
              ...se, 
              status: 'error', 
              error_description: errorDescription 
            } 
          : se
      );
      
      setStepExecutions(updatedStepExecutions);
      
      // Update process execution status
      setProcessExecution({
        ...processExecution,
        status: 'error'
      });
    } catch (err) {
      console.error('Error reporting problem:', err);
      setError('No se pudo reportar el problema. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFinishProcess = () => {
    navigate('/dashboard');
  };
  
  if (loading) {
    return <LoadingScreen message="Cargando proceso..." />;
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    );
  }
  
  if (!processExecution || !process) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Proceso no encontrado</h2>
        <p className="text-gray-600 mb-6">No se pudo encontrar la información del proceso solicitado.</p>
        <Button onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    );
  }
  
  const isProcessComplete = processExecution.status === 'completed';
  const isProcessError = processExecution.status === 'error';
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/dashboard')}
          className="mr-4"
        >
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {process.name}
        </h1>
      </div>
      
      {(isProcessComplete || isProcessError) && (
        <div className={`mb-6 p-4 rounded-md ${
          isProcessComplete ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center">
            {isProcessComplete ? (
              <CheckCircle size={24} className="text-green-500 mr-3" />
            ) : (
              <AlertTriangle size={24} className="text-red-500 mr-3" />
            )}
            <div>
              <h3 className={`font-semibold ${
                isProcessComplete ? 'text-green-800' : 'text-red-800'
              }`}>
                {isProcessComplete ? 'Proceso completado' : 'Proceso con errores'}
              </h3>
              <p className={`text-sm ${
                isProcessComplete ? 'text-green-600' : 'text-red-600'
              }`}>
                {isProcessComplete 
                  ? 'Todos los pasos han sido completados correctamente.' 
                  : 'Se han reportado errores en uno o más pasos del proceso.'}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              onClick={handleFinishProcess}
              variant={isProcessComplete ? 'success' : 'primary'}
            >
              {isProcessComplete ? 'Finalizar proceso' : 'Volver al dashboard'}
            </Button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Información del despacho</h2>
          <div className={`px-3 py-1 rounded-full text-sm ${
            processExecution.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : processExecution.status === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }`}>
            {processExecution.status === 'completed' 
              ? 'Completado' 
              : processExecution.status === 'error'
                ? 'Error'
                : 'En progreso'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID del despacho</p>
            <p className="font-medium">{processExecution.shipment_id}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Iniciado el</p>
            <p className="font-medium">
              {new Date(processExecution.started_at).toLocaleString()}
            </p>
          </div>
          
          {processExecution.completed_at && (
            <div>
              <p className="text-sm text-gray-500">Completado el</p>
              <p className="font-medium">
                {new Date(processExecution.completed_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Pasos del proceso</h2>
        
        <div className="space-y-4">
          {process.steps.map((step) => {
            const stepExecution = stepExecutions.find(se => se.step_id === step.id);
            const isActive = processExecution.current_step === step.order && 
                            processExecution.status === 'in_progress';
            
            return (
              <ProcessStepCard
                key={step.id}
                step={step}
                stepExecution={stepExecution}
                isActive={isActive}
                onComplete={handleCompleteStep}
                onError={handleReportError}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessPage;