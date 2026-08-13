import type { GitHubSnapshotView } from '../data/presence';

export default function GitHubSnapshotPanel({ view }: { view: GitHubSnapshotView }) {
  return <section class="network-panel" data-network-panel aria-labelledby="network-heading">
    <header class="panel-label"><h2 id="network-heading">network.online</h2></header>
    <div class="github-profile">
      <span class="github-avatar-frame" aria-hidden="true">
        <span>PP</span>
        <img src={view.avatarUrl} alt="" width="48" height="48" onError={(event) => { event.currentTarget.hidden = true; }} />
      </span>
      <div>
        <a href={view.profileUrl} target="_blank" rel="noreferrer">@{view.login}</a>
        <p>PUBLIC GITHUB SNAPSHOT</p>
      </div>
    </div>
    {view.state === 'ready' ? <dl class="github-stats">
      <div><dt>repositories</dt><dd>{view.publicRepos} repos</dd></div>
      <div><dt>audience</dt><dd>{view.followers} followers</dd></div>
      <div><dt>recognition</dt><dd>{view.stars} stars</dd></div>
      <div><dt>languages</dt><dd>{view.languages.join(' · ')}</dd></div>
    </dl> : <p class="network-fallback">PROFILE_LINK_AVAILABLE</p>}
  </section>;
}
