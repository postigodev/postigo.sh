import type { ComponentChildren } from 'preact';
import type { HomeProjectPreview, PublicIdentity } from '../data/portfolio';
import type { GitHubSnapshotView } from '../data/presence';
import GitHubSnapshotPanel from './GitHubSnapshotPanel';
import ProjectPreviewGrid from './ProjectPreviewGrid';

interface Props {
  identity: PublicIdentity;
  previews: readonly HomeProjectPreview[];
  github: GitHubSnapshotView;
  identityWindow: ComponentChildren;
  playerWindow: ComponentChildren;
  notesWindow: ComponentChildren;
  taskbar: ComponentChildren;
  onNavigate: (event: MouseEvent, route: string) => void;
}

export default function HomeShell({ identity, previews, github, identityWindow, playerWindow, notesWindow, taskbar, onNavigate }: Props) {
  return <div class="home-shell" data-home-shell data-layout="columns">
    <header class="system-bar">
      <a class="system-brand" href="/">POSTIGO_OS_v2.0</a><span aria-hidden="true">🐐</span>
      <nav aria-label="Primary"><a href="/">Home</a><a href="/work" onClick={(event) => onNavigate(event, '/work')}>Work</a><a href="/resume">Resume</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
      <span class="system-mode">ARCHIVE</span>
    </header>
    <main class="home-grid">
      <aside class="home-rail" aria-label="Portfolio index">
        <div class="node-label">PIERO_0402</div>
        <p>{identity.primaryIdentity}</p>
        <div class="rail-goat" aria-hidden="true">🐐</div>
        <nav>
          <a href="/" aria-current="page">Identity</a>
          <a href="/work" onClick={(event) => onNavigate(event, '/work')}>Projects</a>
          <a href="/resume">Resume</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </aside>
      <div class="identity-region">{identityWindow}</div>
      <ProjectPreviewGrid previews={previews} onNavigate={onNavigate} />
      <div class="player-region">{playerWindow}</div>
      <div class="notes-region">{notesWindow}</div>
      <GitHubSnapshotPanel view={github} />
    </main>
    {taskbar}
  </div>;
}
