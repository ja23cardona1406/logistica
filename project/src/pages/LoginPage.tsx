import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User as UserIcon, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface LoginFormInputs {
  email: string;
  password: string;
}

const Spinner: React.FC<{ text?: string }> = ({ text = 'Cargando...' }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const { signIn, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);
  const hasNavigated = useRef(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();

  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const onSubmit = async (data: LoginFormInputs) => {
    if (submitting || authLoading || !mountedRef.current) return;

    try {
      setSubmitting(true);
      setError(null);
      await signIn(data.email, data.password);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  if (authLoading) return <Spinner text="Verificando autenticación..." />;
  if (isAuthenticated) return <Spinner text="Redirigiendo..." />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">REPREMUNDO</h1>
        <h2 className="mt-3 text-center text-xl font-semibold text-gray-600">
          Sistema de Gestión Aduanera
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              leftIcon={<UserIcon size={18} />}
              error={errors.email?.message}
              disabled={submitting || authLoading}
              {...register('email', {
                required: 'El correo es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo electrónico inválido',
                },
              })}
            />

            <Input
              label="Contraseña"
              type="password"
              leftIcon={<Lock size={18} />}
              error={errors.password?.message}
              disabled={submitting || authLoading}
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres',
                },
              })}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={submitting}
              disabled={submitting || authLoading}
            >
              {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
