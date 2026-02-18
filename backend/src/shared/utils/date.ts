export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTimeBR(date: Date): string {
  return date.toLocaleString('pt-BR');
}

export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export function getDateRangeFromPeriod(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = endOfDay(now);

  switch (period) {
    case 'today':
      return { start: startOfDay(now), end };
    case 'yesterday':
      return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    case 'last7days':
      return { start: startOfDay(subDays(now, 6)), end };
    case 'last30days':
      return { start: startOfDay(subDays(now, 29)), end };
    case 'thisMonth':
      return { start: startOfMonth(now), end };
    case 'lastMonth':
      return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    default:
      return { start: startOfDay(subDays(now, 29)), end };
  }
}
