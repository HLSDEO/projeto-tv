import { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomDateTimePicker({ value, onChange, onClose }) {
  const parseInitialValue = (val) => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseInitialValue(value);

  const [selectedDay, setSelectedDay] = useState(() => value ? initialDate.getDate() : null);
  const [selectedMonth, setSelectedMonth] = useState(() => initialDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(() => initialDate.getFullYear());
  const [hours, setHours] = useState(() => initialDate.getHours());
  const [minutes, setMinutes] = useState(() => initialDate.getMinutes());

  const [viewMonth, setViewMonth] = useState(selectedMonth);
  const [viewYear, setViewYear] = useState(selectedYear);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setSelectedMonth(viewMonth);
    setSelectedYear(viewYear);
  };

  const handleSave = () => {
    if (selectedDay === null) return;
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay, hours, minutes);
    onChange(finalDate.toISOString());
  };

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
  const daysArray = [];

  // Padding start of month
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const isDaySelected = (day) => {
    return (
      selectedDay === day &&
      selectedMonth === viewMonth &&
      selectedYear === viewYear
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <div className="bg-zinc-950/95 border border-zinc-700/80 backdrop-blur-md rounded-xl p-4 shadow-2xl w-64 select-none animate-fade-in text-white">
      {/* Header Month / Year */}
      <div className="flex justify-between items-center mb-3">
        <button 
          type="button" 
          onClick={handlePrevMonth} 
          className="p-1 rounded hover:bg-zinc-800 transition text-zinc-400 hover:text-white cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-xs text-zinc-200">
          {months[viewMonth]} {viewYear}
        </span>
        <button 
          type="button" 
          onClick={handleNextMonth} 
          className="p-1 rounded hover:bg-zinc-800 transition text-zinc-400 hover:text-white cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-zinc-550 font-bold text-[10px] mb-2">
        {daysOfWeek.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3">
        {daysArray.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }
          const selected = isDaySelected(day);
          const current = isToday(day);
          return (
            <button
              type="button"
              key={`day-${day}`}
              onClick={() => handleDaySelect(day)}
              className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center font-medium transition cursor-pointer ${
                selected 
                  ? 'bg-blue-600 text-white font-bold' 
                  : current 
                  ? 'bg-zinc-800/80 text-blue-400 border border-blue-500/30' 
                  : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time Selector */}
      <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mb-3">
        <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-zinc-500" /> Horário
        </span>
        <div className="flex items-center gap-1 text-zinc-400">
          <input
            type="number"
            value={String(hours).padStart(2, '0')}
            onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
            className="w-10 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-xs font-semibold text-white focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min="0"
            max="23"
          />
          <span className="text-zinc-600">:</span>
          <input
            type="number"
            value={String(minutes).padStart(2, '0')}
            onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            className="w-10 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-xs font-semibold text-white focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min="0"
            max="59"
          />
        </div>
      </div>

      {/* Popover Footer Buttons */}
      <div className="flex gap-2 text-[11px] border-t border-zinc-800/80 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition cursor-pointer text-zinc-300"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={selectedDay === null}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-550 disabled:bg-zinc-900 disabled:text-zinc-650 rounded-lg font-semibold transition cursor-pointer text-white font-bold"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
