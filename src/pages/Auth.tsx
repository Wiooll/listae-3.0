import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FaShoppingCart } from 'react-icons/fa';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isResetting) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: 'E-mail de redefinição enviado',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
        setIsResetting(false);
        return;
      }

      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/');
      toast({
        title: isLogin ? 'Login realizado com sucesso' : 'Conta criada com sucesso',
        description: isLogin ? 'Bem-vindo de volta!' : 'Por favor, verifique seu e-mail para confirmar sua conta.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
      });
    }
  };

  if (isResetting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181A20]">
        <div className="w-full max-w-sm bg-[#23263A] rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <div className="bg-[#7C3AED] rounded-full p-4 mb-6">
            <FaShoppingCart size={32} color="#fff" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Redefinir Senha
          </h2>
          <form onSubmit={handleSubmit} className="w-full space-y-4 mt-4">
            <input
              id="email"
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border-none bg-[#181A20] text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
            <Button
              type="submit"
              className="w-full bg-[#7C3AED] hover:bg-[#a78bfa] text-white font-bold py-3 rounded-md transition"
            >
              Enviar Link
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setIsResetting(false)}
            className="mt-2 text-xs text-[#a78bfa] hover:text-white transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20]">
      <div className="w-full max-w-sm bg-[#23263A] rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <div className="bg-[#7C3AED] rounded-full p-4 mb-6">
          <FaShoppingCart size={32} color="#fff" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isLogin ? 'Entrar no ListaÊ' : 'Criar uma conta'}
        </h2>
        <form onSubmit={handleSubmit} className="w-full space-y-4 mt-4">
          <input
            id="email"
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border-none bg-[#181A20] text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          {!isResetting && (
            <input
              id="password"
              type="password"
              required
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border-none bg-[#181A20] text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          )}
          {isLogin && !isResetting && (
            <button
              type="button"
              onClick={() => setIsResetting(true)}
              className="text-xs text-[#7C3AED] hover:underline text-right w-full"
            >
              Esqueceu sua senha?
            </button>
          )}
          <Button
            type="submit"
            className="w-full bg-[#7C3AED] hover:bg-[#a78bfa] text-white font-bold py-3 rounded-md transition"
          >
            {isResetting ? 'Enviar Link' : isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setIsResetting(false);
          }}
          className="mt-4 text-xs text-[#a78bfa] hover:text-white transition"
        >
          {isLogin
            ? 'Não tem uma conta? Cadastre-se'
            : 'Já tem uma conta? Entre'}
        </button>
        {isResetting && (
          <button
            type="button"
            onClick={() => setIsResetting(false)}
            className="mt-2 text-xs text-[#a78bfa] hover:text-white transition"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;
