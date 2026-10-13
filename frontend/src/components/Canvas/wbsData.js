export const WBS_STORAGE_KEY = 'flow-canvas:wbs:v2';
export const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export function makeInitialWbs(durationWeeks = 8) {
  const end = durationWeeks === 15 ? 15 : 8;
  return {
    nodes: [
      { id: 'plan', type: 'task', position: { x: 0, y: 0 }, data: { label: '요구사항 정리', stage: '기획', assignee: '미정', startWeek: 1, endWeek: 2, status: '대기' } },
      { id: 'gate-plan', type: 'gate', position: { x: 300, y: 0 }, data: { label: '기획 검토', stage: '기획', assignee: '미정', startWeek: 2, endWeek: 2, status: '대기' } },
      { id: 'build', type: 'task', position: { x: 600, y: 0 }, data: { label: '핵심 기능 구현', stage: '개발', assignee: '미정', startWeek: 3, endWeek: end - 2, status: '대기' } },
      { id: 'test', type: 'task', position: { x: 920, y: 0 }, data: { label: '통합 시험', stage: '검증', assignee: '미정', startWeek: end - 1, endWeek: end, status: '대기' } },
      { id: 'gate-end', type: 'gate', position: { x: 1220, y: 0 }, data: { label: '최종 검토', stage: '완료', assignee: '미정', startWeek: end, endWeek: end, status: '대기' } },
    ],
    edges: [
      { id: 'e1', source: 'plan', target: 'gate-plan', type: 'smoothstep' },
      { id: 'e2', source: 'gate-plan', target: 'build', type: 'smoothstep' },
      { id: 'e3', source: 'build', target: 'test', type: 'smoothstep' },
      { id: 'e4', source: 'test', target: 'gate-end', type: 'smoothstep' },
    ],
  };
}

const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v) => typeof v === 'string' && v.trim().length > 0;

export function validateWbs(value) {
  if (!object(value) || value.version !== 2 || !Array.isArray(value.nodes) || !Array.isArray(value.edges) || !object(value.viewport)) throw new Error('저장 형식 오류');
  const vp = value.viewport;
  if (![vp.x, vp.y, vp.zoom].every(Number.isFinite) || vp.zoom < 0.1 || vp.zoom > 3) throw new Error('뷰포트 오류');
  const ids = new Set();
  const nodes = value.nodes.map((n) => {
    if (!object(n) || !text(n.id) || ids.has(n.id) || !['task', 'gate'].includes(n.type) || !object(n.position) || !Number.isFinite(n.position.x) || !Number.isFinite(n.position.y) || !object(n.data)) throw new Error('노드 오류');
    const d = n.data;
    if (![d.label, d.stage, d.assignee].every(text) || !Number.isInteger(d.startWeek) || !Number.isInteger(d.endWeek) || d.startWeek < 1 || d.endWeek < d.startWeek || d.endWeek > 15 || !['대기', '진행', '완료'].includes(d.status)) throw new Error('WBS 정보 오류');
    ids.add(n.id);
    return { id: n.id, type: n.type, position: { x: n.position.x, y: n.position.y }, data: { label: d.label, stage: d.stage, assignee: d.assignee, startWeek: d.startWeek, endWeek: d.endWeek, status: d.status } };
  });
  const edgeIds = new Set();
  const edges = value.edges.map((e) => {
    if (!object(e) || !text(e.id) || edgeIds.has(e.id) || !ids.has(e.source) || !ids.has(e.target) || e.source === e.target) throw new Error('연결선 오류');
    edgeIds.add(e.id);
    return { id: e.id, source: e.source, target: e.target, type: 'smoothstep' };
  });
  return { nodes, edges, viewport: { x: vp.x, y: vp.y, zoom: vp.zoom } };
}

export function readWbs() {
  try {
    const raw = localStorage.getItem(WBS_STORAGE_KEY);
    if (raw === null) return { kind: 'missing' };
    return { kind: 'success', data: validateWbs(JSON.parse(raw)) };
  } catch {
    return { kind: 'error' };
  }
}
