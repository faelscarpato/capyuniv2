import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useSupabaseAuth } from '../../hooks/useAuth';
import { Icon } from '../ui/Icon';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setAuthOpen } = useUIStore();
  const { signUp, signIn, loading } = useSupabaseAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAuthOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccess('Conta criada! Verifique seu email para confirmar.');
      } else {
        await signIn(email, password);
        setAuthOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setAuthOpen(false)}
    >
      <div 
        className="w-full max-w-md bg-ide-activity border border-ide-border shadow-2xl rounded-lg p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </h2>
          <button onClick={() => setAuthOpen(false)} className="text-gray-400 hover:text-white">
            <Icon name="X" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-ide-input border border-ide-border rounded px-3 py-2 text-white"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-ide-input border border-ide-border rounded px-3 py-2 text-white"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          
          {success && (
            <div className="text-green-400 text-sm">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ide-accent hover:bg-ide-accent/80 disabled:opacity-50 text-white py-2 rounded transition-colors"
          >
            {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
            className="text-ide-secondary hover:text-white text-sm"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-ide-border text-center text-xs text-gray-500">
          Powered by Supabase
        </div>
      </div>
    </div>
  );
};