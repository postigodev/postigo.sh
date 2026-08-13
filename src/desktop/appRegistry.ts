import type { ProjectCase } from '../data/portfolio';
import type { AppDefinition, AppId, AppRegistry } from './types';

const coreApps: readonly AppDefinition[] = [
  { id: 'identity', title: 'Piero Postigo Rocchetti', icon: 'user', kind: 'identity', route: '/', defaultBounds: { x: 250, y: 72, width: 700, height: 470 }, minSize: { width: 420, height: 320 }, mobileMode: 'fullscreen', showOnDesktop: false, showInStart: false },
  { id: 'about', title: 'About Piero', icon: 'user', kind: 'about', route: '/about', defaultBounds: { x: 120, y: 70, width: 620, height: 460 }, minSize: { width: 360, height: 280 }, mobileMode: 'fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'About Piero', startLabel: 'About Piero' },
  { id: 'work', title: 'Selected work', icon: 'folder', kind: 'work', route: '/work', defaultBounds: { x: 180, y: 58, width: 840, height: 570 }, minSize: { width: 440, height: 320 }, mobileMode: 'fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'Projects', startLabel: 'Projects' },
  { id: 'resume', title: 'Resume', icon: 'document', kind: 'resume', route: '/resume', defaultBounds: { x: 230, y: 80, width: 650, height: 500 }, minSize: { width: 380, height: 300 }, mobileMode: 'fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'Resume.pdf', startLabel: 'Resume' },
  { id: 'contact', title: 'Contact', icon: 'mail', kind: 'contact', route: '/contact', defaultBounds: { x: 300, y: 110, width: 500, height: 340 }, minSize: { width: 340, height: 250 }, mobileMode: 'near-fullscreen', showOnDesktop: true, showInStart: true },
  { id: 'privacy', title: 'Privacy', icon: 'lock', kind: 'privacy', route: '/privacy', defaultBounds: { x: 260, y: 90, width: 660, height: 480 }, minSize: { width: 380, height: 300 }, mobileMode: 'fullscreen', showOnDesktop: false, showInStart: true },
  { id: 'network', title: 'Network online', icon: 'network', kind: 'network', defaultBounds: { x: 970, y: 300, width: 330, height: 300 }, minSize: { width: 300, height: 230 }, mobileMode: 'near-fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'Network', startLabel: 'Network' },
  { id: 'now-playing', title: 'Now playing', icon: 'music', kind: 'now-playing', defaultBounds: { x: 980, y: 70, width: 330, height: 220 }, minSize: { width: 300, height: 190 }, mobileMode: 'near-fullscreen', showOnDesktop: false, showInStart: true },
  { id: 'notes', title: 'Notes.txt', icon: 'notes', kind: 'notes', defaultBounds: { x: 920, y: 210, width: 360, height: 300 }, minSize: { width: 300, height: 220 }, mobileMode: 'near-fullscreen', showOnDesktop: false, showInStart: true },
];

export const nearColdBoot = ['identity'] as const satisfies readonly AppId[];

export function buildAppRegistry(projects: readonly ProjectCase[]): AppRegistry {
  const projectApps: AppDefinition[] = projects.map((project, index) => ({
    id: `project:${project.slug}`,
    title: project.name,
    icon: 'project',
    kind: 'project',
    route: `/work/${project.slug}`,
    projectSlug: project.slug,
    defaultBounds: { x: 220 + index * 22, y: 70 + index * 18, width: 780, height: 540 },
    minSize: { width: 460, height: 340 },
    mobileMode: 'fullscreen',
    showOnDesktop: false,
    showInStart: false,
  }));
  return new Map([...coreApps, ...projectApps].map((app) => [app.id, app]));
}
