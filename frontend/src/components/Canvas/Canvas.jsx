import { useCallback, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap, addEdge, useReactFlow, useViewport, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './Canvas.css';
import ProjectInitModal from './ProjectInitModal';
import TaskNode from './TaskNode';
import GateNode from './GateNode';
import { makeInitialWbs, readWbs, validateWbs, WBS_STORAGE_KEY, DEFAULT_VIEWPORT } from './wbsData';

const nodeTypes = { task: TaskNode, gate: GateNode };
const nodeOrigin = [0.5, 0.5];
const snapGrid = [20, 20];

function CanvasToolbar() {
  const { zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow();
  const { zoom } = useViewport();
  return <div className="canvas-toolbar" role="group" aria-label="뷰포트 도구">
    <button type="button" aria-label="축소" onClick={() => zoomOut({ duration: 200 })}>−</button>
    <span className="canvas-toolbar__zoom">{Math.round(zoom * 100)}%</span>
    <button type="button" aria-label="확대" onClick={() => zoomIn({ duration: 200 })}>+</button>
    <span className="canvas-toolbar__divider" />
    <button type="button" className="canvas-toolbar__text-button" onClick={() => fitView({ padding: 0.2, maxZoom: 1, duration: 300 })}>전체 보기</button>
    <button type="button" className="canvas-toolbar__text-button" onClick={() => setViewport({ ...getViewport(), zoom: 1 }, { duration: 200 })}>100%</button>
  </div>;
}

function NodeEditor({ node, maxWeek, onApply, onClose }) {
  const [draft, setDraft] = useState({ ...node.data });
  const [error, setError] = useState('');
  const update = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const data = { ...draft, label: draft.label.trim(), stage: draft.stage.trim(), assignee: draft.assignee.trim(), startWeek: Number(draft.startWeek), endWeek: Number(draft.endWeek) };
    if (!data.label || !data.stage || !data.assignee || !Number.isInteger(data.startWeek) || !Number.isInteger(data.endWeek) || data.startWeek < 1 || data.endWeek < data.startWeek || data.endWeek > maxWeek) {
      setError(`필수 정보를 입력하고 기간을 1~${maxWeek}주 범위로 지정해 주세요.`); return;
    }
    onApply(node.id, data);
  };
  return <aside className="node-editor" aria-label="WBS 정보 편집">
    <div className="node-editor-header"><strong>{node.type === 'gate' ? 'Gate' : '작업'} 정보 수정</strong><button type="button" aria-label="편집 닫기" onClick={onClose}>×</button></div>
    <small className="node-editor-id">ID: {node.id}</small>
    <form onSubmit={submit}>
      <label>작업명<input autoFocus value={draft.label} maxLength={80} required onChange={(e) => update('label', e.target.value)} /></label>
      <label>단계<input value={draft.stage} maxLength={40} required onChange={(e) => update('stage', e.target.value)} /></label>
      <label>담당자<input value={draft.assignee} maxLength={60} required onChange={(e) => update('assignee', e.target.value)} /></label>
      <div className="node-editor-weeks">
        <label>시작 주차<input type="number" min="1" max={maxWeek} value={draft.startWeek} required onChange={(e) => update('startWeek', e.target.value)} /></label>
        <label>종료 주차<input type="number" min="1" max={maxWeek} value={draft.endWeek} required onChange={(e) => update('endWeek', e.target.value)} /></label>
      </div>
      <label>상태<select value={draft.status} onChange={(e) => update('status', e.target.value)}><option>대기</option><option>진행</option><option>완료</option></select></label>
      {error && <p className="node-editor-error" role="alert">{error}</p>}
      <button className="canvas-add-button" type="submit">정보 적용</button>
    </form>
  </aside>;
}

function CanvasContent({ project }) {
  const [startup] = useState(readWbs);
  const [sample] = useState(() => makeInitialWbs(project.durationWeeks));
  const [nodes, setNodes, onNodesChange] = useNodesState(startup.kind === 'success' ? startup.data.nodes : sample.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(startup.kind === 'success' ? startup.data.edges : sample.edges);
  const [viewport, setViewport] = useState(startup.kind === 'success' ? startup.data.viewport : DEFAULT_VIEWPORT);
  const [status, setStatus] = useState(startup.kind === 'success' ? '기존 WBS 저장 데이터를 복원했습니다. 프로젝트별 저장은 아직 지원하지 않습니다.' : startup.kind === 'error' ? '저장 데이터 오류로 예시 WBS를 표시합니다.' : '예시 WBS입니다. 노드를 더블클릭하면 정보를 수정할 수 있습니다.');
  const [editingId, setEditingId] = useState(null);
  const canvasRef = useRef(null);
  const deletingRef = useRef(false);
  const { screenToFlowPosition, getNodes, getEdges, getViewport, deleteElements } = useReactFlow();
  const editingNode = nodes.find((n) => n.id === editingId);
  const maxWeek = Math.max(project.durationWeeks, ...nodes.map((n) => n.data.endWeek));

  const addNode = useCallback((type) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const position = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, { snapToGrid: false });
    const id = `wbs-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    const node = { id, type, position, selected: true, data: { label: type === 'gate' ? '새 검토 지점' : '새 작업', stage: '미정', assignee: '미정', startWeek: 1, endWeek: 1, status: '대기' } };
    setNodes((list) => [...list.map((n) => ({ ...n, selected: false })), node]);
    setEdges((list) => list.map((e) => ({ ...e, selected: false })));
    setEditingId(null);
    setStatus('화면 중앙에 추가했습니다. 겹치면 드래그하여 직접 배치해 주세요.');
  }, [screenToFlowPosition, setNodes, setEdges]);

  const connect = useCallback((connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setEdges((list) => addEdge({ ...connection, type: 'smoothstep' }, list));
    setStatus('선후 관계 연결 요청을 처리했습니다.');
  }, [setEdges]);

  const removeSelected = async () => {
    if (deletingRef.current) return;
    const selectedNodes = getNodes().filter((n) => n.selected);
    const selectedEdges = getEdges().filter((e) => e.selected);
    if (!selectedNodes.length && !selectedEdges.length) { setStatus('삭제할 항목을 선택해 주세요.'); return; }
    deletingRef.current = true;
    try {
      const result = await deleteElements({ nodes: selectedNodes.map((n) => ({ id: n.id })), edges: selectedEdges.map((e) => ({ id: e.id })) });
      setStatus(`노드 ${result.deletedNodes.length}개, 연결선 ${result.deletedEdges.length}개를 삭제했습니다.`);
    } catch { setStatus('삭제에 실패했습니다.'); }
    finally { deletingRef.current = false; }
  };

  const save = () => {
    try {
      const payload = { version: 2, nodes: getNodes(), edges: getEdges(), viewport: getViewport() };
      const clean = validateWbs(payload);
      localStorage.setItem(WBS_STORAGE_KEY, JSON.stringify({ version: 2, ...clean }));
      setStatus('노드 종류·WBS 정보·연결선·뷰포트를 저장했습니다.');
    } catch { setStatus('저장하지 못했습니다. 데이터 또는 브라우저 저장 공간을 확인해 주세요.'); }
  };

  const load = () => {
    const result = readWbs();
    if (result.kind !== 'success') { setStatus(result.kind === 'missing' ? '저장된 WBS가 없습니다.' : '저장 데이터 오류입니다. 현재 화면을 유지합니다.'); return; }
    setNodes(result.data.nodes); setEdges(result.data.edges); setViewport(result.data.viewport); setEditingId(null);
    setStatus('저장된 WBS를 복원했습니다.');
  };

  return <main ref={canvasRef} className="canvas-shell" aria-label="WBS 편집 캔버스">
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodeOrigin={nodeOrigin} viewport={viewport} onViewportChange={setViewport} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} isValidConnection={(c) => Boolean(c.source && c.target && c.source !== c.target)} onNodeDoubleClick={(_, node) => setEditingId(node.id)} fitView={startup.kind !== 'success'} fitViewOptions={{ padding: 0.2, maxZoom: 1 }} minZoom={0.1} maxZoom={3} defaultEdgeOptions={{ type: 'smoothstep' }} deleteKeyCode={['Backspace', 'Delete']} multiSelectionKeyCode="Shift" snapToGrid snapGrid={snapGrid} panOnDrag zoomOnScroll zoomOnPinch zoomOnDoubleClick={false}>
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
      <MiniMap position="bottom-right" pannable zoomable nodeColor={(n) => n.type === 'gate' ? '#f59e0b' : '#60a5fa'} />
    </ReactFlow>
    <div className="canvas-heading"><strong>WBS Canvas · {project.durationWeeks}주</strong><span title={project.idea}>{project.idea}</span><small title={project.team}>팀: {project.team}</small></div>
    <div className="canvas-actions" role="group" aria-label="WBS 편집 도구">
      <button type="button" className="canvas-add-button" onClick={() => addNode('task')}>+ 작업</button>
      <button type="button" className="canvas-action-button canvas-action-button--gate" onClick={() => addNode('gate')}>+ Gate</button>
      <button type="button" className="canvas-action-button canvas-action-button--danger" onClick={removeSelected}>선택 삭제</button>
      <button type="button" className="canvas-action-button" onClick={save}>저장</button>
      <button type="button" className="canvas-action-button" onClick={load}>불러오기</button>
    </div>
    <div className="canvas-status" role="status" aria-live="polite">{status}</div>
    <div className="canvas-help">더블클릭: 정보 수정 · 오른쪽 점 → 왼쪽 점: 연결 · Shift+클릭: 다중 선택 · Delete: 삭제</div>
    <CanvasToolbar />
    {editingNode && <NodeEditor key={editingNode.id} node={editingNode} maxWeek={maxWeek} onClose={() => setEditingId(null)} onApply={(id, data) => { setNodes((list) => list.map((n) => n.id === id ? { ...n, data } : n)); setEditingId(null); setStatus('WBS 정보를 적용했습니다. 저장 버튼을 눌러 보관해 주세요.'); }} />}
  </main>;
}

export default function Canvas() {
  const [project, setProject] = useState(null);
  if (!project) return <ProjectInitModal onComplete={setProject} />;
  return <ReactFlowProvider><CanvasContent project={project} /></ReactFlowProvider>;
}
