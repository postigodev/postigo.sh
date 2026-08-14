import type { ProjectCase, PublicArtifact } from '../../data/portfolio';

function ArtifactRow({ artifact }: { artifact: PublicArtifact }) {
  return <a class="evidence-row" data-evidence-row href={artifact.href} target="_blank" rel="noreferrer">
    <span class="evidence-title">{artifact.label}</span>
    <span class="evidence-meta">{[artifact.status, artifact.category].filter(Boolean).join(' · ')}</span>
    <span class="evidence-arrow" aria-hidden="true">↗</span>
  </a>;
}

export default function ProjectApp({ project }: { project: ProjectCase }) {
  const artifactMap = new Map<string, PublicArtifact>(project.artifacts.map((artifact) => [artifact.id, artifact]));
  const leadArtifact = project.leadMedia ? artifactMap.get(project.leadMedia.artifactId) : undefined;
  const sectionArtifactIds = new Set(project.sections.flatMap((section) => section.artifactIds));
  const sequenceArtifactIds = new Set(project.artifactSequence?.artifactIds ?? []);
  const sequenceArtifacts = (project.artifactSequence?.artifactIds ?? []).map((id) => artifactMap.get(id)).filter((artifact): artifact is PublicArtifact => Boolean(artifact));
  const ungroupedArtifacts = project.artifacts.filter((artifact) => artifact.id !== project.leadMedia?.artifactId && !sectionArtifactIds.has(artifact.id) && !sequenceArtifactIds.has(artifact.id));

  return <article class={`project-app project-app--${project.layout}`}>
    <header class="case-header">
      <p class="case-context">{[project.contextLabel, project.dateLabel].filter(Boolean).join(' · ')}</p>
      <h1>{project.name}</h1>
      {project.roleLabel && <p class="case-role">{project.roleLabel}</p>}
      <p class="case-summary">{project.summary}</p>
      <aside class="ownership-boundary" aria-label="Collaboration boundary">
        <strong>{project.ownershipLabel}</strong>
        <span>{project.ownership}</span>
      </aside>
    </header>

    {project.artifactSequence && sequenceArtifacts.length > 0 && <section class="artifact-sequence" data-artifact-sequence aria-labelledby={`${project.slug}-artifact-sequence`}>
      <p class="artifact-sequence__label" id={`${project.slug}-artifact-sequence`}>{project.artifactSequence.label}</p>
      <div class="artifact-sequence__grid">{sequenceArtifacts.map((artifact, index) => <figure class={`artifact-sequence__item artifact-sequence__item--${artifact.kind}`} data-sequence-artifact key={artifact.id}>
        <a class="artifact-sequence__media" href={artifact.href} aria-label={`Open ${artifact.label}`}>
          <img src={artifact.href} alt={artifact.imageAlt ?? artifact.label} loading={index === 0 ? undefined : 'lazy'} />
        </a>
        <figcaption><strong>{artifact.label}</strong><span>{artifact.caption}</span></figcaption>
      </figure>)}</div>
    </section>}

    {leadArtifact && project.leadMedia && <figure class="case-visual" data-case-visual>
      <img src={leadArtifact.href} alt={project.leadMedia.alt} />
      <figcaption>{leadArtifact.caption}</figcaption>
    </figure>}

    <div class="case-chapters">
      {project.sections.map((section, index) => {
        const artifacts = section.artifactIds.map((id) => artifactMap.get(id)).filter((artifact): artifact is PublicArtifact => Boolean(artifact));
        return <section class="case-chapter" data-case-chapter aria-labelledby={`${project.slug}-${section.id}`} key={section.id}>
          <p class="chapter-number">{String(index + 1).padStart(2, '0')}</p>
          <div class="chapter-copy">
            <h2 id={`${project.slug}-${section.id}`}>{section.title}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.highlights && <ul>{section.highlights.map((item) => <li key={item}>{item}</li>)}</ul>}
            {artifacts.length > 0 && <div class="evidence-rows">{artifacts.map((artifact) => <ArtifactRow artifact={artifact} key={artifact.id} />)}</div>}
          </div>
        </section>;
      })}
    </div>

    {project.layout === 'artifact-led' && ungroupedArtifacts.length > 0 && <section class="public-artifacts" aria-labelledby={`${project.slug}-public-artifacts`}>
      <h2 id={`${project.slug}-public-artifacts`}>Public artifacts</h2>
      <div class="artifact-list">{ungroupedArtifacts.map((artifact) => <a href={artifact.href} target={artifact.external ? '_blank' : undefined} rel={artifact.external ? 'noreferrer' : undefined} key={artifact.id}>
        <strong>{artifact.label}</strong>
        <span>{artifact.caption}</span>
        <span class="evidence-arrow" aria-hidden="true">↗</span>
      </a>)}</div>
    </section>}

    <a class="archive-action os-button" href={project.links.repository} target="_blank" rel="noreferrer">
      <span>[ GitHub ]</span>
      <strong>Source repository</strong>
      <span aria-hidden="true">↗</span>
    </a>
  </article>;
}
