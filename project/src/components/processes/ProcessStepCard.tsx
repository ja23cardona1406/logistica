import React from 'react';
import { CheckCircle, AlertCircle, Circle } from 'lucide-react';
import { ProcessStep, ProcessStepExecution } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface ProcessStepCardProps {
  step: ProcessStep;
  stepExecution?: ProcessStepExecution;
  isActive: boolean;
  onComplete: () => void;
  onError: (description: string) => void;
}

const ProcessStepCard: React.FC<ProcessStepCardProps> = ({
  step,
  stepExecution,
  isActive,
  onComplete,
  onError,
}) => {
  const status = stepExecution?.status || 'pending';
  
  const statusIcons = {
    pending: <Circle size={24} className="text-gray-300" />,
    completed: <CheckCircle size={24} className="text-green-500" />,
    error: <AlertCircle size={24} className="text-red-500" />,
  };

  const handleReportError = () => {
    const errorDescription = window.prompt('Describe el error encontrado:');
    if (errorDescription) {
      onError(errorDescription);
    }
  };

  return (
    <Card
      className={`mb-4 border-l-4 transition-all duration-300 ${
        isActive 
          ? 'border-l-blue-500 transform scale-102 shadow-lg' 
          : status === 'completed'
            ? 'border-l-green-500'
            : status === 'error'
              ? 'border-l-red-500'
              : 'border-l-gray-300'
      }`}
    >
      <div className="flex items-start">
        <div className="mr-4 mt-1">
          {statusIcons[status]}
        </div>
        
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900">
            {step.order}. {step.title}
          </h4>
          
          <p className="mt-2 text-gray-600">
            {step.description}
          </p>
          
          {step.image_url && (
            <div className="mt-4">
              <img 
                src={step.image_url} 
                alt={step.title} 
                className="w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          )}
          
          {isActive && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button 
                onClick={onComplete}
                variant="success"
              >
                Completar paso
              </Button>
              
              <Button 
                onClick={handleReportError}
                variant="outline"
              >
                Reportar problema
              </Button>
            </div>
          )}
          
          {status === 'error' && stepExecution?.error_description && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800">
                Error reportado: {stepExecution.error_description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProcessStepCard;