import { useEffect, useState } from 'preact/hooks';

const formatTime = (date: Date) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);

export default function Clock() {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => setLabel(formatTime(new Date()));
    update();
    const id = window.setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);
  return <time class="taskbar-clock" aria-label={label ? `Local time ${label}` : 'Local time'}>{label}</time>;
}
