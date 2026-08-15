import { staticGitHubFallback } from '../data/presence';
import { isGitHubSnapshotView, usePresenceEndpoint } from '../desktop/usePresence';

export default function GitHubWidget() {
  const view = usePresenceEndpoint('/api/github-snapshot', staticGitHubFallback, isGitHubSnapshotView);

  return <div class="github-widget" data-github-widget>
    <div class="github-widget__profile">
      <span class="presence-label">profile</span>
      <a href={view.profileUrl} target="_blank" rel="noreferrer">@{view.login}</a>
    </div>
    {view.state === 'ready'
      ? <dl class="github-widget__stats">
          <div><dt>repositories</dt><dd>{view.publicRepos} repos</dd></div>
          <div><dt>followers</dt><dd>{view.followers}</dd></div>
          <div><dt>stars</dt><dd>{view.stars} stars</dd></div>
          <div><dt>languages</dt><dd>{view.languages.join(' · ') || 'No language summary'}</dd></div>
        </dl>
      : <p class="presence-empty">GitHub profile is available; live public stats are unavailable.</p>}
  </div>;
}
