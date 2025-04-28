
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-8 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Redefinir Senha</h2>
            <p className="text-sm text-muted-foreground mt-2">Digite seu e-mail para redefinir sua senha</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Enviar Link
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsResetting(false)} className="flex-1">
                Voltar
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{isLogin ? 'Entrar no ListaÊ' : 'Criar uma conta'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          {isLogin && (
            <button
              type="button"
              onClick={() => setIsResetting(true)}
              className="text-sm text-primary hover:underline"
            >
              Esqueceu sua senha?
            </button>
          )}
          <Button type="submit" className="w-full">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
