import type { AppIconName } from './types';

export default function AppIcon({ name }: { name: AppIconName }) {
  return <span class={`app-icon app-icon--${name}`} aria-hidden="true" />;
}
