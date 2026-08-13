import type { WorkRecord } from '../../data/portfolio';
interface Props { records: readonly WorkRecord[]; onNavigate: (event: MouseEvent, route: string) => void }
export default function WorkApp({ records, onNavigate }: Props) {
  return <div class="work-app"><header><p>[05 FLAGSHIP RECORDS]</p><h1>Selected Work</h1><p>Implementation order does not define portfolio ranking.</p></header><ol class="work-grid">{records.map((record, index) => <li><span>0{index + 1} / {record.signal}</span><h3>{record.name}</h3><p>{record.status}</p>{record.slug ? <a href={`/work/${record.slug}`} onClick={(event) => onNavigate(event, `/work/${record.slug}`)} aria-label={`Open ${record.name} project`}>Open record →</a> : <span class="record-pending">Case record follows</span>}</li>)}</ol></div>;
}
