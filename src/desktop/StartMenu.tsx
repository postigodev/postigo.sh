import type { AppDefinition, AppId } from './types';
import { useEffect, useRef } from 'preact/hooks';
import AppIcon from './AppIcon';

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
  const groups = [
    ['portfolio', 'Portfolio'],
    ['utilities', 'Utilities'],
    ['policy', 'Policy'],
  ] as const;
  return <nav ref={menuRef} class="start-menu" aria-label="Start menu" onKeyDown={(event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onDismiss();
    }
  }}>
    <div class="start-menu-rail" aria-hidden="true">Piero OS</div>
    <div class="start-menu-items">{groups.map(([group, label]) => {
      const items = definitions.filter((definition) => definition.startGroup === group);
      if (!items.length) return null;
      return <section class="start-menu-group" aria-label={label} key={group}>{items.map((definition) => {
        const content = <><span>{definition.startLabel ?? definition.title}</span><AppIcon name={definition.icon} /></>;
        return definition.route
          ? <a key={definition.id} href={definition.route} onClick={(event) => onNavigate(event, definition.route!)}>{content}</a>
          : <button key={definition.id} type="button" onClick={(event) => onLaunch(event, definition.id)}>{content}</button>;
      })}</section>;
    })}</div>
  </nav>;
}
