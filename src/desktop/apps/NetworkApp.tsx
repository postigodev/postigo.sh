import type { GitHubSnapshotView } from '../../data/presence';

export default function NetworkApp({ view }: { view: GitHubSnapshotView }) {
  return <div class="network-app" data-network-content>
    <div class="github-profile">
      <span class="github-avatar-frame" aria-hidden="true"><span>PP</span><img src={view.avatarUrl} alt="" width="48" height="48" onError={(event) => { event.currentTarget.hidden = true; }} /></span>
      <div><a href={view.profileUrl} target="_blank" rel="noreferrer">@{view.login}</a><p>Public GitHub snapshot</p></div>
    </div>
    {view.state === 'ready'
      ? <dl class="github-stats"><div><dt>Repositories</dt><dd>{view.publicRepos} repos</dd></div><div><dt>Audience</dt><dd>{view.followers} followers</dd></div><div><dt>Recognition</dt><dd>{view.stars} stars</dd></div><div><dt>Languages</dt><dd>{view.languages.join(' · ')}</dd></div></dl>
      : <p class="network-fallback">Profile link available</p>}
  </div>;
}
