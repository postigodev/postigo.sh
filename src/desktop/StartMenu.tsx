interface Props { open: boolean; onNavigate: (event: MouseEvent, route: string) => void }
export default function StartMenu({ open, onNavigate }: Props) {
  if (!open) return null;
  return <nav class="start-menu" aria-label="Start menu"><strong>PIERO_OS</strong><a href="/">Home</a><a href="/work" onClick={(event) => onNavigate(event, '/work')}>Work</a><a href="/resume">Resume</a><a href="/about">About</a><a href="/contact">Contact</a></nav>;
}
