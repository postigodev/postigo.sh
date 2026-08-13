import type { WorkRecord } from '../../data/portfolio';

interface Props {
  records: readonly WorkRecord[];
  prominentRecords?: readonly WorkRecord[];
  projectSlugs?: ReadonlySet<string>;
  onNavigate: (event: MouseEvent, route: string) => void;
}

export default function WorkApp({ records, prominentRecords = [], projectSlugs, onNavigate }: Props) {
  const routable = projectSlugs ?? new Set(records.flatMap((record) => record.slug ? [record.slug] : []));
  const renderRecords = (items: readonly WorkRecord[], offset = 0) => <ol class="work-grid">{items.map((record, index) => <li key={record.id}><span>{String(index + offset + 1).padStart(2, '0')} / {record.signal}</span><h3>{record.name}</h3><p>{record.status}</p>{record.slug && routable.has(record.slug) ? <a class="os-button" href={`/work/${record.slug}`} onClick={(event) => onNavigate(event, `/work/${record.slug}`)} aria-label={`Open ${record.name} project`}>Open record →</a> : <span class="record-pending">Case record follows</span>}</li>)}</ol>;
  return <div class="work-app"><header><p>[05 FLAGSHIP RECORDS]</p><h1>Selected Work</h1><p>Implementation order does not define portfolio ranking.</p></header>{renderRecords(records)}{prominentRecords.length > 0 && <section class="additional-work"><h2>Additional featured work</h2>{renderRecords(prominentRecords, records.length)}</section>}</div>;
}
