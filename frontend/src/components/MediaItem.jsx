import { GripVertical, Clock, Power, Trash2 } from 'lucide-react';
import { getAssetUrl } from '../services/api';

// Converts an ISO datetime string into the value format expected by <input type="datetime-local">
// ("YYYY-MM-DDTHH:mm"), using the browser's local timezone.
const toLocalInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function MediaItem({ m, onUpdate, onDelete }) {
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

  const handleScheduleChange = (e) => {
    const val = e.target.value; // "" when cleared
    onUpdate(m, { scheduled_start: val ? val : null });
  };

  const clearSchedule = () => onUpdate(m, { scheduled_start: null });

  const isScheduledFuture = m.scheduled_start && new Date(m.scheduled_start) > new Date();

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
        {isScheduledFuture && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Inicia em {new Date(m.scheduled_start).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
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

        <div className="flex flex-col gap-1 bg-zinc-800/40 p-2 rounded-lg border border-zinc-700/50">
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock className="w-3 h-3" /> Início agendado
          </span>
          <div className="flex items-center gap-1">
            <input
              type="datetime-local"
              value={toLocalInputValue(m.scheduled_start)}
              onChange={handleScheduleChange}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            />
            {m.scheduled_start && (
              <button
                onClick={clearSchedule}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition"
                title="Remover agendamento (exibir imediatamente)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

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
