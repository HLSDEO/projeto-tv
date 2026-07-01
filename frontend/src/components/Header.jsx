import { Clock, Users, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ syncing, onSync, timeLeft, onLogout, onOpenBirthdays }) {
  const location = useLocation();
  const username = localStorage.getItem('username');
  const isAdmin = username === 'admin';

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Painel Administrativo TV</h1>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-700/50 px-4 py-2 rounded border border-zinc-700 text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Próxima Sincronização: <span className="font-bold text-blue-400 font-mono">{formatTimeLeft()}</span></span>
          </div>
          <button 
            onClick={onSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 rounded font-semibold transition flex items-center gap-2 text-white"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar TV'}
          </button>
          <button 
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition text-white"
          >
            Ver TV
          </button>
          {onOpenBirthdays && (
            <button 
              onClick={onOpenBirthdays}
              className="px-4 py-2 bg-zinc-750 hover:bg-zinc-650 rounded font-medium transition border border-zinc-700 text-white flex items-center gap-1.5 cursor-pointer"
            >
              🎂 Aniversariantes
            </button>
          )}
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition text-white"
          >
            Sair
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-4 border-t border-zinc-700 pt-4">
          <Link
            to="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              location.pathname === '/admin'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            Mídias e Configurações
          </Link>
          <Link
            to="/admin/users"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              location.pathname === '/admin/users'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            Gerenciar Usuários
          </Link>
          <Link
            to="/admin/logs"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              location.pathname === '/admin/logs'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            Registros do Sistema (Logs)
          </Link>
        </div>
      )}
    </div>
  );
}
