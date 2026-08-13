import type { ComponentChildren } from 'preact';

interface Props {
  id: string;
  children: ComponentChildren;
}

export default function WindowSlot({ id, children }: Props) {
  return <div class={`window-slot window-slot--${id}`} data-window-slot={id}>{children}</div>;
}
