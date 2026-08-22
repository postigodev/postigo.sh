export type MediaLogEntry =
  | {
      kind: 'film';
      activity: 'watched';
      title: string;
      year?: number;
      occurredAt: string;
      rating?: number;
      artworkUrl: string;
    }
  | {
      kind: 'game';
      activity: 'playing' | 'played';
      title: string;
      totalHours?: number;
      artworkUrl: string;
    }
  | {
      kind: 'book';
      activity: 'reading';
      title: string;
      author?: string;
      progressPercent?: number;
      artworkUrl: string;
    };

export interface MediaLogResponse {
  entries: MediaLogEntry[];
  observedAt: string;
}

