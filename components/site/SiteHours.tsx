const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function toRecord(hours: unknown): Record<string, string> {
  if (!hours) return {};
  if (Array.isArray(hours)) {
    const rec: Record<string, string> = {};
    for (const item of hours as Array<{ day?: string; hours?: string }>) {
      if (item?.day) rec[item.day] = item.hours ?? '';
    }
    return rec;
  }
  return hours as Record<string, string>;
}

interface Props {
  hours: Record<string, string> | null;
}

export function SiteHours({ hours }: Props) {
  if (!hours) return null;
  const normalized = toRecord(hours);

  const rows = DAY_ORDER.flatMap((day) => {
    const key = Object.keys(normalized).find(
      (k) => k.toLowerCase() === day.toLowerCase()
    );
    if (!key) return [];
    return [{ day, value: normalized[key] }];
  });

  if (!rows.length) return null;

  return (
    <div className="space-y-1.5 mt-6">
      {rows.map(({ day, value }) => {
        const isClosed = typeof value === 'string' && value.toLowerCase() === 'closed';
        return (
          <div key={day} className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-text-light)]/10 last:border-0">
            <span className="text-sm font-medium text-[var(--color-text)]">{day}</span>
            <span className={`text-sm ${isClosed ? 'text-[var(--color-text-light)] italic' : 'text-[var(--color-text-light)]'}`}>
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
