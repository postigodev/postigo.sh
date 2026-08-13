import { resumeContent } from '../../data/siteContent';

export default function ResumeApp() {
  return <article class="document-app"><p>{resumeContent.eyebrow}</p><h1>{resumeContent.title}</h1>{resumeContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>;
}
