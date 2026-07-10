import { useState } from 'react';
import { GripVertical, Clock, Power, Trash2 } from 'lucide-react';
import { getAssetUrl } from '../services/api';
import CustomDateTimePicker from './CustomDateTimePicker';

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
  const [showCalendar, setShowCalendar] = useState(false);
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
  const getScheduleBadge = () => {
    if (!m.scheduled_start) return null;
    const isFuture = new Date(m.scheduled_start) > new Date();
    const formattedDate = new Date(m.scheduled_start).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (isFuture) {
      return (
        <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
          <Clock className="w-3 h-3" />
          Agendado (Futuro): {formattedDate}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
          <Clock className="w-3 h-3" />
          Agendado (Ativo): {formattedDate}
        </span>
      );
    }
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border ${m.active ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-75'}`}>
      <GripVertical className="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing transition shrink-0" />

      <div className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0 relative select-none">
        {m.type === 'video' ? (
          <video src={getAssetUrl(m.url)} className="w-full h-full object-cover" draggable="false" />
        ) : (
          <img src={getAssetUrl(m.url)} className="w-full h-full object-cover" alt="" draggable="false" />
        )}
        <span className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-xs font-bold uppercase">
          {m.type}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-white">{m.original_name}</p>
        <p className="text-sm text-zinc-500">Ordem: {m.order}</p>
        {getScheduleBadge()}
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

        <div className="flex flex-col gap-1 bg-zinc-800/40 p-2 rounded-lg border border-zinc-700/50 relative">
          <span className="flex items-center gap-1 text-xs text-zinc-400 select-none">
            <Clock className="w-3 h-3" /> Início agendado
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCalendar(prev => !prev)}
              className={`flex items-center gap-1.5 bg-zinc-950/50 border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none transition-all cursor-pointer hover:bg-zinc-900/60 ${
                showCalendar ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-zinc-700/80 hover:border-zinc-500'
              }`}
            >
              {m.scheduled_start ? (
                <span className="text-blue-400 font-bold">
                  {new Date(m.scheduled_start).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-zinc-500">Selecionar data</span>
              )}
            </button>
            {m.scheduled_start && (
              <button
                type="button"
                onClick={clearSchedule}
                className="p-1 rounded text-zinc-400 hover:text-rose-450 hover:bg-rose-500/10 transition cursor-pointer"
                title="Remover agendamento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Popover Calendar */}
          {showCalendar && (
            <div className="absolute right-0 bottom-full mb-2 z-50">
              <CustomDateTimePicker
                value={m.scheduled_start}
                onChange={(dateStr) => {
                  onUpdate(m, { scheduled_start: dateStr });
                  setShowCalendar(false);
                }}
                onClose={() => setShowCalendar(false)}
              />
            </div>
          )}
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
