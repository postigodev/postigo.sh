export function capturePointerGesture(
  event: PointerEvent,
  onMove: (event: PointerEvent) => void,
  onEnd: () => void,
) {
  const owner = event.currentTarget as HTMLElement;
  const pointerId = event.pointerId;
  owner.setPointerCapture(pointerId);

  const finish = () => {
    owner.removeEventListener('pointermove', onMove);
    owner.removeEventListener('pointerup', finish);
    owner.removeEventListener('pointercancel', finish);
    if (owner.hasPointerCapture(pointerId)) owner.releasePointerCapture(pointerId);
    onEnd();
  };

  owner.addEventListener('pointermove', onMove);
  owner.addEventListener('pointerup', finish, { once: true });
  owner.addEventListener('pointercancel', finish, { once: true });
}
