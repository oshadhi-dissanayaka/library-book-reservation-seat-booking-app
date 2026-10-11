// Keep university booking dates/times independent of the phone's timezone.
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Colombo',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function getLibraryClock(now = new Date()) {
  const parts = Object.fromEntries(formatter.formatToParts(now).map(({ type, value }) => [type, value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function hasTimeBlockStarted(date: string, block: string, now = new Date()): boolean {
  const current = getLibraryClock(now);
  if (date !== current.date) return date < current.date;
  const match = /^(\d{2}):(\d{2})\s(AM|PM)/.exec(block);
  if (!match) return true;
  const start = (Number(match[1]) % 12) * 60 + Number(match[2]) + (match[3] === 'PM' ? 720 : 0);
  return start <= current.minutes;
}
