'use client';

import { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface PeriodValue {
  startDate: string; // ISO string
  endDate: string;   // ISO string
  label: string;     // "Este Mes", "Hoje", etc
}

interface PeriodFilterProps {
  value: PeriodValue;
  onChange: (period: PeriodValue) => void;
}

type PresetKey = 'today' | 'thisWeek' | 'thisMonth' | 'last7' | 'last30' | 'lastMonth' | 'quarter' | 'year' | 'custom';

interface Preset {
  key: PresetKey;
  label: string;
  getRange: () => { startDate: Date; endDate: Date };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

const presets: Preset[] = [
  {
    key: 'today',
    label: 'Hoje',
    getRange: () => {
      const now = new Date();
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    },
  },
  {
    key: 'thisWeek',
    label: 'Esta Semana',
    getRange: () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: startOfDay(monday), endDate: endOfDay(sunday) };
    },
  },
  {
    key: 'thisMonth',
    label: 'Este Mes',
    getRange: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    },
  },
  {
    key: 'last7',
    label: 'Ultimos 7 dias',
    getRange: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { startDate: startOfDay(start), endDate: endOfDay(now) };
    },
  },
  {
    key: 'last30',
    label: 'Ultimos 30 dias',
    getRange: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { startDate: startOfDay(start), endDate: endOfDay(now) };
    },
  },
  {
    key: 'lastMonth',
    label: 'Mes Anterior',
    getRange: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    },
  },
  {
    key: 'quarter',
    label: 'Trimestre Atual',
    getRange: () => {
      const now = new Date();
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      return {
        startDate: new Date(now.getFullYear(), quarterStart, 1),
        endDate: new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59),
      };
    },
  },
  {
    key: 'year',
    label: 'Ano Atual',
    getRange: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    },
  },
];

function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getRange();
    setActivePreset(preset.key);
    onChange({
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      label: preset.label,
    });
    if (preset.key !== 'custom') {
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart + 'T00:00:00');
      const end = new Date(customEnd + 'T23:59:59');
      if (start <= end) {
        setActivePreset('custom');
        onChange({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          label: 'Personalizado',
        });
        setIsOpen(false);
      }
    }
  };

  const periodDisplay = useMemo(() => {
    return `${formatDateBR(value.startDate)} - ${formatDateBR(value.endDate)}`;
  }, [value.startDate, value.endDate]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
      >
        <Calendar className="h-4 w-4" />
        <span>{value.label}</span>
        <span className="text-zinc-500">|</span>
        <span className="text-zinc-400 text-xs">{periodDisplay}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-zinc-700 bg-zinc-800 p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset)}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    activePreset === preset.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-700 pt-4">
              <p className="text-xs text-zinc-400 mb-2">Periodo Personalizado</p>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-white"
                />
                <span className="text-zinc-500 text-sm">ate</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-white"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function getDefaultPeriod(): PeriodValue {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    label: 'Este Mes',
  };
}
