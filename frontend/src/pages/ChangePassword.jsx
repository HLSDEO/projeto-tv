import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/authService';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      // Send secure reset call with JSON payload
      await api.put(`/api/admin/users/${username}/password`, {
        new_password: newPassword
      });

      // Update local storage and redirect
      localStorage.setItem('must_change_password', 'false');
      alert('Senha alterada com sucesso! Você será redirecionado para o painel.');
      navigate('/admin');
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err.response?.data?.detail || 'Erro ao alterar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="bg-zinc-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-zinc-700">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Primeiro Acesso</h2>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Por motivos de segurança, você precisa alterar a sua senha temporária para continuar.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-center text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Repita a nova senha"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="w-full bg-transparent hover:bg-zinc-700/50 text-zinc-400 hover:text-white py-2 px-4 rounded transition-colors text-sm font-medium border border-zinc-700"
            >
              Sair / Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
