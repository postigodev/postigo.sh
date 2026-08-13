import type { PublicIdentity } from '../../data/portfolio';
interface Props { identity: PublicIdentity; onNavigate: (event: MouseEvent, route: string) => void }
export default function IdentityApp({ identity, onNavigate }: Props) {
  return <div class="identity-app"><p class="system-label">[ PRIMARY_IDENTITY: SOFTWARE_ENGINEER ]</p><div class="goat" aria-hidden="true">🐐</div><h1>{identity.primaryIdentity}</h1><h3>{identity.descriptor}</h3><p>{identity.name}</p><p class="identity-thesis">{identity.thesis}</p><div class="identity-actions"><a class="primary-action" href="/work" onClick={(event) => onNavigate(event, '/work')}>Explore selected work</a><a href="/resume">View resume</a></div></div>;
}
