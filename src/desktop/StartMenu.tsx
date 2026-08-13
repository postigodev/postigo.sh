import type { AppDefinition, AppId } from './types';
import { useEffect, useRef } from 'preact/hooks';

interface Props {
  open: boolean;
  definitions: readonly AppDefinition[];
  onNavigate: (event: MouseEvent, route: string) => void;
  onLaunch: (event: MouseEvent, id: AppId) => void;
  onDismiss: () => void;
}

export default function StartMenu({ open, definitions, onNavigate, onLaunch, onDismiss }: Props) {
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open) requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('a, button')?.focus());
  }, [open]);
  if (!open) return null;
  return <nav ref={menuRef} class="start-menu" aria-label="Start menu" onKeyDown={(event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onDismiss();
    }
  }}>
    <strong><span aria-hidden="true">🐐</span> Piero OS</strong>
    {definitions.map((definition) => definition.route
      ? <a key={definition.id} href={definition.route} onClick={(event) => onNavigate(event, definition.route!)}>{definition.startLabel ?? definition.title}</a>
      : <button key={definition.id} type="button" onClick={(event) => onLaunch(event, definition.id)}>{definition.startLabel ?? definition.title}</button>)}
  </nav>;
}
