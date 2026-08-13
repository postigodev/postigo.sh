import type { PublicIdentity } from '../../data/portfolio';

export default function AboutApp({ identity }: { identity: PublicIdentity }) {
  return <article class="document-app"><p>[ABOUT]</p><h1>{identity.name}</h1><p>{identity.thesis}</p></article>;
}
