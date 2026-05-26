import { GripVertical, Clock, Power, Trash2 } from 'lucide-react';
import { getAssetUrl } from '../services/api';

export default function MediaItem({ m, onUpdate, onDelete, baseURL }) {
  const handleDurationChange = (e) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    onUpdate(m, { duration: val });
  };

  const handleVideoCheckboxChange = (e) => {
    const playFull = e.target.checked;
    onUpdate(m, { duration: playFull ? 0 : 10 });
  };

  const toggleActive = () => {
    onUpdate(m, { active: !m.active });
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border ${m.active ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-75'}`}>
      <GripVertical className="text-zinc-600 cursor-grab" />
      
      <div className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0 relative">
        {m.type === 'video' ? (
          <video src={getAssetUrl(m.url)} className="w-full h-full object-cover" />
        ) : (
          <img src={getAssetUrl(m.url)} className="w-full h-full object-cover" alt="" />
        )}
        <span className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-xs font-bold uppercase">
          {m.type}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-white">{m.original_name}</p>
        <p className="text-sm text-zinc-500">Ordem: {m.order}</p>
      </div>

      <div className="flex items-center gap-6">
        {m.type === 'video' ? (
          <div className="flex items-center gap-4 bg-zinc-800/40 p-2 rounded-lg border border-zinc-700/50">
            <label className="flex items-center gap-2 cursor-pointer text-sm select-none text-zinc-300">
              <input
                type="checkbox"
                checked={m.duration === 0}
                onChange={handleVideoCheckboxChange}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-850 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
              />
              <span className="font-medium">Vídeo Completo</span>
            </label>
            
            {m.duration > 0 ? (
              <div className="flex items-center gap-2 border-l border-zinc-700 pl-4">
                <Clock className="w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  value={m.duration}
                  onChange={handleDurationChange}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center font-semibold text-blue-400 focus:outline-none"
                  min="1"
                />
                <span className="text-sm text-zinc-400">segundos</span>
              </div>
            ) : (
              <span className="text-xs font-semibold px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 ml-2">
                Tempo Automático
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-zinc-800/40 p-2 rounded-lg border border-zinc-700/50">
            <Clock className="w-4 h-4 text-zinc-400" />
            <input
              type="number"
              value={m.duration}
              onChange={handleDurationChange}
              className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center font-semibold text-blue-400 focus:outline-none"
              min="1"
            />
            <span className="text-sm text-zinc-400">segundos</span>
          </div>
        )}

        <button
          onClick={toggleActive}
          className={`p-2 rounded-full transition ${m.active ? 'text-green-500 hover:bg-green-500/10' : 'text-zinc-500 hover:bg-zinc-500/10'}`}
          title={m.active ? "Desativar" : "Ativar"}
        >
          <Power className="w-5 h-5" />
        </button>

        <button
          onClick={() => onDelete(m.id)}
          className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition"
          title="Apagar"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
