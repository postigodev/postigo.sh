import { staticGitHubFallback, type GitHubActivityKind } from '../data/presence';
import { isGitHubActivityView, usePresenceEndpoint } from '../presence/usePresence';

const icons: Record<GitHubActivityKind, string> = {
  push: '/images/icons/push.svg',
  'pull-request': '/images/icons/pr_comment.svg',
  issue: '/images/icons/issue.svg',
  comment: '/images/icons/comment.svg',
  review: '/images/icons/edit.svg',
  release: '/images/icons/release.svg',
  'repository-created': '/images/icons/folder.svg',
  'repository-public': '/images/icons/public_repo.svg',
  fork: '/images/icons/fork.svg',
  star: '/images/icons/heart.svg',
};

export function relativeGitHubTime(createdAt: string, now = Date.now()): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 1_000));
  if (elapsedSeconds < 60) return 'now';
  if (elapsedSeconds < 3_600) return `${Math.floor(elapsedSeconds / 60)}m`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3_600)}h`;
  return `${Math.floor(elapsedSeconds / 86_400)}d`;
}

export default function GitHubWidget() {
  const view = usePresenceEndpoint('/api/github-activity', staticGitHubFallback, isGitHubActivityView);

  return <div class="github-widget" data-github-widget>
    {view.state === 'ready' && view.entries.length > 0
      ? <ol class="github-activity-feed">
          {view.entries.map((activity) => <li class="github-event-row" key={activity.id}>
            <a class="github-event" href={activity.url} target="_blank" rel="noreferrer" aria-label={`Open ${activity.phrase} ${activity.target} on GitHub`}>
              <span class="github-event__icon" aria-hidden="true"><img src={icons[activity.kind]} alt="" /></span>
              <span class="github-event__copy">
                <span class="github-event__line"><strong>{activity.phrase}</strong>{' '}<span class="github-event__target">{activity.target}</span></span>
                {activity.detail && <span class="github-event__detail">{activity.detail}</span>}
              </span>
              <time class="github-event__time" dateTime={activity.createdAt} title={new Date(activity.createdAt).toLocaleString()}>{relativeGitHubTime(activity.createdAt)}</time>
            </a>
          </li>)}
        </ol>
      : view.state === 'ready'
        ? <p class="github-activity-empty">No recent supported public activity.</p>
        : <div class="github-activity-unavailable">
            <img src="/images/icons/alert-triangle.svg" width="18" height="18" alt="" />
            <p>GitHub activity temporarily unavailable.</p>
          </div>}

    <div class="github-footer">
      <span class="github-footer__profile">
        <img class="github-mark" src="/images/icons/github.svg" width="16" height="16" alt="" />
        <a class="github-handle" href={view.profileUrl} target="_blank" rel="noreferrer">@{view.login}</a>
      </span>
      <a class="github-more" href="https://github.com/postigodev?tab=overview" target="_blank" rel="noreferrer">more on github →</a>
    </div>
  </div>;
}
