interface Props { onNavigate: (event: MouseEvent, route: string) => void }
export default function DesktopIcons({ onNavigate }: Props) {
  return <nav class="desktop-icons" aria-label="Desktop shortcuts">
    <a href="/work" onClick={(event) => onNavigate(event, '/work')}><span aria-hidden="true">📁</span>Work</a>
    <a href="/resume"><span aria-hidden="true">📄</span>Resume</a>
    <a href="/about"><span aria-hidden="true">🗒</span>About</a>
    <a href="/contact"><span aria-hidden="true">✉</span>Contact</a>
  </nav>;
}
