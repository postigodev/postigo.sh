import type { PublicIdentity } from '../../data/portfolio';

export default function ContactApp({ identity }: { identity: PublicIdentity }) {
  return <article class="document-app"><p>[CONTACT]</p><h1>Contact</h1><ul><li><a href={identity.links.email}>Email</a></li><li><a href={identity.links.github}>GitHub</a></li><li><a href={identity.links.linkedin}>LinkedIn</a></li></ul></article>;
}
