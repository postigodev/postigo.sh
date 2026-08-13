import { privacyContent } from '../../data/siteContent';

interface Props { onNavigate: (event: MouseEvent, route: string) => void }

export default function PrivacyApp({ onNavigate }: Props) {
  return <article class="document-app"><p>{privacyContent.eyebrow}</p><h1>{privacyContent.title}</h1>{privacyContent.paragraphs.map((paragraph, index) => <p key={paragraph}>{paragraph}{index === 2 && <> Questions can be sent through <a href="/contact" onClick={(event) => onNavigate(event, '/contact')}>Contact</a>.</>}</p>)}</article>;
}
