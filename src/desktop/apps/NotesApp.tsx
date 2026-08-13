const notes = [
  'reliability is product work.',
  'explicit state boundaries.',
  'real artifacts before jargon.',
  'ship evidence.',
] as const;

export default function NotesApp() {
  return <div class="notes-app" data-notes><ul>{notes.map((note) => <li key={note}>&gt; {note}</li>)}</ul></div>;
}
