import { Clock } from 'lucide-react';

export default function Header({ syncing, onSync, timeLeft, onLogout }) {
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-between items-center bg-zinc-800 p-6 rounded-xl border border-zinc-700">
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
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
