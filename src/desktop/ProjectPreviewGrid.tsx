import type { HomeProjectPreview } from '../data/portfolio';

interface Props {
  previews: readonly HomeProjectPreview[];
  onNavigate: (event: MouseEvent, route: string) => void;
}

export default function ProjectPreviewGrid({ previews, onNavigate }: Props) {
  return <section class="project-preview-region" aria-labelledby="selected-work-heading">
    <header class="archive-section-header">
      <p>[ SELECTED_WORK // 03 RECORDS ]</p>
      <h2 id="selected-work-heading">Selected Work</h2>
      <a href="/work" onClick={(event) => onNavigate(event, '/work')}>Open full archive →</a>
    </header>
    <ol class="project-preview-grid">
      {previews.map((preview) => <li key={preview.slug}>
        <a
          class="project-preview"
          href={`/work/${preview.slug}`}
          aria-label={`Open ${preview.name} project`}
          onClick={(event) => onNavigate(event, `/work/${preview.slug}`)}
        >
          <span class="project-preview__bar"><b>{preview.sequence} {preview.name}</b><span aria-hidden="true">↗</span></span>
          <img src={preview.imageSrc} alt={preview.imageAlt} width="320" height="112" />
          <strong>{preview.visualLabel}</strong>
          <span>{preview.signal}</span>
          <small>{preview.status}</small>
        </a>
      </li>)}
    </ol>
  </section>;
}
