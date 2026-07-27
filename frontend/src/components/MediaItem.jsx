import { useState } from 'react';
import { GripVertical, Clock, Power, Trash2, Loader2 } from 'lucide-react';
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
  const [pendingAction, setPendingAction] = useState(null); // 'active', 'delete', 'duration', 'schedule'

  const runAction = async (action, fn) => {
    if (pendingAction) return;
    setPendingAction(action);
    try {
      await fn();
    } finally {
      setPendingAction(null);
    }
  };

  const handleDurationChange = (e) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    runAction('duration', () => onUpdate(m, { duration: val }));
  };

  const handleVideoCheckboxChange = (e) => {
    const playFull = e.target.checked;
    runAction('duration', () => onUpdate(m, { duration: playFull ? 0 : 10 }));
  };

  const toggleActive = () => {
    runAction('active', () => onUpdate(m, { active: !m.active }));
  };

  const handleScheduleChange = (dateStr) => {
    runAction('schedule', () => onUpdate(m, { scheduled_start: dateStr ? dateStr : null }));
  };

  const clearSchedule = () => {
    runAction('schedule', () => onUpdate(m, { scheduled_start: null }));
  };

  const handleDelete = () => {
    if (!window.confirm('Tem certeza que deseja apagar?')) return;
    runAction('delete', () => onDelete(m.id));
  };

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

  const isPending = pendingAction !== null;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
      isPending ? 'opacity-60 bg-zinc-900/40 border-zinc-800' : m.active ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-75'
    }`}>
      <GripVertical className={`text-zinc-500 hover:text-zinc-300 transition shrink-0 ${
        isPending ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-grab active:cursor-grabbing'
      }`} />

      <div className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0 relative select-none">
        {m.type === 'video' ? (
          m.thumbnail_url ? (
            <img src={getAssetUrl(m.thumbnail_url)} className="w-full h-full object-cover" alt={m.original_name} draggable="false" />
          ) : (
            <video src={getAssetUrl(m.url)} preload="metadata" className="w-full h-full object-cover" draggable="false" />
          )
        ) : (
          <img src={getAssetUrl(m.thumbnail_url || m.compressed_url || m.url)} className="w-full h-full object-cover" alt={m.original_name} draggable="false" />
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
                disabled={isPending}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-850 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 disabled:opacity-50"
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
                  disabled={isPending}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center font-semibold text-blue-400 focus:outline-none disabled:opacity-50"
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
              disabled={isPending}
              className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center font-semibold text-blue-400 focus:outline-none disabled:opacity-50"
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
              disabled={isPending}
              className={`flex items-center gap-1.5 bg-zinc-950/50 border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none transition-all cursor-pointer hover:bg-zinc-900/60 disabled:opacity-50 ${
                showCalendar ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-zinc-700/80 hover:border-zinc-500'
              }`}
            >
              {pendingAction === 'schedule' ? (
                <span className="flex items-center gap-1 text-blue-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Salvando...
                </span>
              ) : m.scheduled_start ? (
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
                disabled={isPending}
                className="p-1 rounded text-zinc-400 hover:text-rose-450 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
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
                  handleScheduleChange(dateStr);
                  setShowCalendar(false);
                }}
                onClose={() => setShowCalendar(false)}
              />
            </div>
          )}
        </div>

        <button
          onClick={toggleActive}
          disabled={isPending}
          className={`p-2 rounded-full transition disabled:opacity-50 cursor-pointer ${
            m.active ? 'text-green-500 hover:bg-green-500/10' : 'text-zinc-500 hover:bg-zinc-500/10'
          }`}
          title={m.active ? "Desativar" : "Ativar"}
        >
          {pendingAction === 'active' ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <Power className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 cursor-pointer"
          title="Apagar"
        >
          {pendingAction === 'delete' ? (
            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
