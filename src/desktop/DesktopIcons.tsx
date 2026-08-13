import type { AppDefinition, AppId } from './types';
import AppIcon from './AppIcon';

type NavigateHandler = (event: MouseEvent, route: string) => void;
type LaunchHandler = (event: MouseEvent, id: AppId) => void;

interface Props {
  definitions: readonly AppDefinition[];
  onNavigate: NavigateHandler;
  onLaunch: LaunchHandler;
}

export default function DesktopIcons({ definitions, onNavigate, onLaunch }: Props) {
  return <nav class="desktop-icons" aria-label="Desktop shortcuts">{definitions.map((definition) => {
    const label = definition.desktopLabel ?? definition.title;
    const content = <><AppIcon name={definition.icon} /><span>{label}</span></>;
    return definition.route
      ? <a key={definition.id} class="desktop-icon" href={definition.route} onClick={(event) => onNavigate(event, definition.route!)}>{content}</a>
      : <button key={definition.id} class="desktop-icon desktop-icon--button" type="button" onClick={(event) => onLaunch(event, definition.id)}>{content}</button>;
  })}</nav>;
}
