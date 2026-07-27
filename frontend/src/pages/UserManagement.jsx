import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import authService from '../services/authService';
import Header from '../components/Header';
import { UserPlus, Trash2, KeyRound, AlertTriangle, Loader2 } from 'lucide-react';

const getErrorMessage = (err, defaultMsg) => {
  const detail = err.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => d.msg).join(', ');
  }
  return defaultMsg;
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [resettingUser, setResettingUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null); // stores username being deleted

  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const usersList = await adminService.getUsers();
      setUsers(usersList);
    } catch (err) {
      if (err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      } else {
        setError('Falha ao buscar lista de usuários.');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setError('');
    setSuccess('');

    if (!usernameInput.trim() || usernameInput.length < 3) {
      setError('O nome do usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    if (!passwordInput || passwordInput.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsCreating(true);
    try {
      await adminService.createUser(usernameInput.trim(), passwordInput);
      setSuccess(`Usuário '${usernameInput}' criado com sucesso!`);
      setUsernameInput('');
      setPasswordInput('');
      await fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar usuário.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (usernameToDelete) => {
    if (deletingUser) return;
    setError('');
    setSuccess('');

    if (usernameToDelete === 'admin') {
      setError('A conta de administrador primária não pode ser excluída.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário '${usernameToDelete}'?`)) {
      return;
    }

    setDeletingUser(usernameToDelete);
    try {
      await adminService.deleteUser(usernameToDelete);
      setSuccess(`Usuário '${usernameToDelete}' excluído com sucesso.`);
      await fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao excluir usuário.'));
    } finally {
      setDeletingUser(null);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (isResetting) return;
    setError('');
    setSuccess('');
    setModalError('');

    if (!newPasswordInput || newPasswordInput.length < 6) {
      setModalError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsResetting(true);
    try {
      await adminService.resetPassword(resettingUser, newPasswordInput);
      setSuccess(`Senha do usuário '${resettingUser}' redefinida com sucesso!`);
      setResettingUser(null);
      setNewPasswordInput('');
    } catch (err) {
      setModalError(getErrorMessage(err, 'Erro ao redefinir senha.'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header onLogout={handleLogout} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form to create user */}
          <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 space-y-6 lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Novo Usuário
            </h2>

            {error && (
              <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-lg text-sm animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-600/10 border border-green-500/20 text-green-400 rounded-lg text-sm animate-fade-in">
                {success}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1">Nome de Usuário</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Mínimo 3 caracteres"
                  disabled={isCreating}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1">Senha</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isCreating}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Usuário</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: List of existing users */}
          <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 space-y-6 lg:col-span-2">
            <h2 className="text-xl font-bold">Usuários Cadastrados</h2>

            <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800 text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Perfil</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm">
                  {users.map((u) => (
                    <tr key={u.username} className="hover:bg-zinc-800/30">
                      <td className="px-6 py-4 font-semibold text-zinc-200">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.username === 'admin' 
                            ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' 
                            : 'bg-zinc-700/40 border border-zinc-650 text-zinc-400'
                        }`}>
                          {u.username === 'admin' ? 'Administrador' : 'Operador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setResettingUser(u.username);
                            setModalError('');
                          }}
                          disabled={deletingUser !== null || isResetting}
                          className="p-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 hover:border-blue-500/30 rounded transition flex items-center gap-1 text-xs font-medium cursor-pointer disabled:opacity-50"
                          title="Alterar Senha"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Senha
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.username)}
                            disabled={deletingUser !== null || isResetting}
                            className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/10 hover:border-red-500/30 rounded transition flex items-center gap-1 text-xs font-medium cursor-pointer disabled:opacity-50"
                            title="Excluir Usuário"
                          >
                            {deletingUser === u.username ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-zinc-500">
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold">Alterar Senha</h3>
              <p className="text-zinc-400 text-sm mt-1">
                Defina uma nova senha de acesso para o usuário <span className="font-bold text-zinc-200">'{resettingUser}'</span>.
              </p>
            </div>

            {modalError && (
              <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isResetting}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResettingUser(null);
                    setNewPasswordInput('');
                    setModalError('');
                  }}
                  disabled={isResetting}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-650 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 rounded-lg text-sm font-semibold transition text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResetting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
