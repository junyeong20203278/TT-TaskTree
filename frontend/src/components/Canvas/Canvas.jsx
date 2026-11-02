import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap, addEdge, reconnectEdge, useReactFlow, useViewport, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './Canvas.css';
import ProjectInitModal from './ProjectInitModal';
import TaskNode from './TaskNode';
import GateNode from './GateNode';
import { makeInitialWbs, readWbs, validateWbs, WBS_STORAGE_KEY, DEFAULT_VIEWPORT } from './wbsData';

const nodeTypes = { task: TaskNode, gate: GateNode };
const nodeOrigin = [0.5, 0.5];
const snapGrid = [20, 20];

function nodeSize(node) {
  const fallback = node.type === 'gate' ? { width: 210, height: 210 } : { width: 220, height: 170 };
  return {
    width: node.measured?.width || node.width || fallback.width,
    height: node.measured?.height || node.height || fallback.height,
  };
}

// Positions are centers because nodeOrigin is [0.5, 0.5].
function placeNewNode(node, existing) {
  const size = nodeSize(node);
  const gap = 60;
  const x = node.position.x;
  let y = node.position.y;
  // Only the NEW node moves. Move below any conflicting occupied interval.
  const obstacles = existing.map(other => {
    const otherSize = nodeSize(other);
    return { x: other.position.x, y: other.position.y, ...otherSize };
  }).filter(other => Math.abs(x - other.x) < (size.width + other.width) / 2 + gap)
    .sort((a, b) => a.y - a.height / 2 - (b.y - b.height / 2));
  for (const other of obstacles) {
    const distance = (size.height + other.height) / 2 + gap;
    if (Math.abs(y - other.y) < distance) y = other.y + distance;
  }
  return { ...node, position: { x, y } };
}

// Layout only eligible NEW nodes. Existing nodes are never repositioned.
// Preserve the user's spatial structure. No edge-based re-ranking.
function tidyPositions(nodes, ids) {
  const chosen = nodes.filter(n => ids.has(n.id));
  if (chosen.length < 2) return nodes;
  function alignAxis(axis, dimension) {
    const ordered = [...chosen].sort((a, b) => a.position[axis] - b.position[axis] || a.id.localeCompare(b.id));
    const groups = [];
    for (const node of ordered) {
      let group = groups[groups.length - 1];
      // Small visual offsets only; a bounded group prevents chain-merging rows.
      if (!group || node.position[axis] - group.first > 45) {
        group = { first: node.position[axis], items: [] };
        groups.push(group);
      }
      group.items.push(node);
    }
    const positions = new Map();
    let previous = null;
    for (const group of groups) {
      const values = group.items.map(n => n.position[axis]).sort((a,b) => a-b);
      const mid = Math.floor(values.length / 2);
      const originalCenter = values.length % 2 ? values[mid] : (values[mid-1] + values[mid]) / 2;
      const extent = Math.max(...group.items.map(n => nodeSize(n)[dimension]));
      // Keep intentional large spaces; only expand cramped ones.
      const center = previous ? Math.max(originalCenter, previous.center + (previous.extent + extent) / 2 + 50) : originalCenter;
      group.items.forEach(n => positions.set(n.id, center));
      previous = { center, extent };
    }
    return positions;
  }
  const xs = alignAxis('x', 'width');
  const ys = alignAxis('y', 'height');
  return nodes.map(n => ids.has(n.id) ? { ...n, position: { x: xs.get(n.id), y: ys.get(n.id) } } : n);
}

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
  const layoutUndoRef = useRef(null);
  const { screenToFlowPosition, getNodes, getEdges, getViewport, deleteElements, fitView } = useReactFlow();
  const fitTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(fitTimerRef.current), []);
  const fitAfterLayout = useCallback(() => {
    clearTimeout(fitTimerRef.current);
    fitTimerRef.current = setTimeout(() => fitView({ padding: 0.22, maxZoom: 1, duration: 300 }), 100);
  }, [fitView]);
  const arrange = () => {
    // Use controlled state, including the latest selected flags.
    const ids = new Set(nodes.filter(node => node.selected).map(node => node.id));
    if (ids.size < 2) {
      setStatus('선택 배치는 노드를 2개 이상 선택해야 합니다. Shift를 누르고 노드들을 클릭해 주세요.');
      return;
    }
    try {
      const result = tidyPositions(nodes, ids);
      layoutUndoRef.current = new Map(nodes.map(n => [n.id, { ...n.position }]));
      const moved = result.filter((node, index) => node.position.x !== nodes[index].position.x || node.position.y !== nodes[index].position.y).length;
      setNodes(result);
      setStatus(moved ? `선택한 ${ids.size}개 중 ${moved}개 노드의 위치를 정렬했습니다. 나머지 노드는 유지합니다.` : '선택한 노드들이 이미 같은 정렬 위치에 있습니다.');
    } catch { setStatus('선택 배치에 실패했습니다. 오류 확인이 필요합니다.'); }
  };
  const exportLayoutData = () => {
    const payload = {
      nodes: getNodes().map(node => ({ id: node.id, type: node.type, position: node.position, measured: node.measured, width: node.width, height: node.height, data: node.data })),
      edges: getEdges().map(edge => ({ id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle })),
      viewport: getViewport(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'canvas-layout.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('현재 노드와 연결 데이터를 내보냈습니다. 배치는 변경하지 않았습니다.');
  };

  const arrangeAll = () => {
    const current = getNodes();
    if (current.length < 2) { setStatus('정돈할 노드가 2개 이상 필요합니다.'); return; }
    layoutUndoRef.current = new Map(current.map(n => [n.id, { ...n.position }]));
    const ids = new Set(current.map(n => n.id));
    const result = tidyPositions(current, ids);
    setNodes(result);
    fitAfterLayout();
    setStatus('현재 배치의 좌우·상하 순서를 기준으로 줄과 간격을 정돈했습니다. 배치 되돌리기로 취소할 수 있습니다.');
  };
  const undoLayout = () => {
    const previous = layoutUndoRef.current;
    if (!previous) { setStatus('되돌릴 배치가 없습니다.'); return; }
    setNodes(list => list.map(n => previous.has(n.id) ? { ...n, position: previous.get(n.id) } : n));
    layoutUndoRef.current = null;
    fitAfterLayout();
    setStatus('정돈 직전 위치로 되돌렸습니다.');
  };
  const editingNode = nodes.find((n) => n.id === editingId);
  const maxWeek = Math.max(project.durationWeeks, ...nodes.map((n) => n.data.endWeek));

  const addNode = useCallback((type) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const position = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, { snapToGrid: false });
    const id = `wbs-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    const node = { id, type, position, selected: true, data: { label: type === 'gate' ? '새 검토 지점' : '새 작업', stage: '미정', assignee: '미정', startWeek: 1, endWeek: 1, status: '대기' } };
    setNodes((list) => {
      const added = placeNewNode(node, list);
      return [...list.map((n) => ({ ...n, selected: false })), added];
    });
    setEdges((list) => list.map((e) => ({ ...e, selected: false })));
    setEditingId(null);
    setStatus('새 노드를 빈자리에 추가했습니다. 정돈할 노드를 선택하고 선택 노드 정렬을 누르세요.');
  }, [screenToFlowPosition, setNodes, setEdges]);

  const connect = useCallback((connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setEdges((list) => addEdge({ ...connection, type: 'smoothstep' }, list));
    setStatus('선후 관계 연결 요청을 처리했습니다.');
  }, [setEdges]);

  const reconnect = useCallback((oldEdge, connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) {
      setStatus('같은 노드로는 연결할 수 없습니다. 기존 연결을 유지합니다.');
      return;
    }
    setEdges(list => {
      const duplicate = list.some(edge => edge.id !== oldEdge.id &&
        edge.source === connection.source && edge.target === connection.target &&
        (edge.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
        (edge.targetHandle ?? null) === (connection.targetHandle ?? null));
      return duplicate ? list : reconnectEdge(oldEdge, connection, list);
    });
    setStatus('연결 변경을 처리했습니다. 동일한 연결이 있으면 기존 연결을 유지합니다.');
  }, [setEdges]);

  const removeSelectedEdges = async () => {
    if (deletingRef.current) return;
    const selected = getEdges().filter(edge => edge.selected);
    if (!selected.length) {
      setStatus('삭제할 연결선을 클릭해 선택해 주세요. Shift+클릭으로 여러 선을 선택할 수 있습니다.');
      return;
    }
    deletingRef.current = true;
    try {
      const result = await deleteElements({ edges: selected.map(edge => ({ id: edge.id })) });
      setStatus(`연결선 ${result.deletedEdges.length}개를 삭제했습니다. 노드는 유지합니다.`);
    } catch { setStatus('연결선 삭제에 실패했습니다.'); }
    finally { deletingRef.current = false; }
  };

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
      const payload = { version: 2, nodes: getNodes(), edges: getEdges().map(edge => ({ ...edge, type: 'smoothstep' })), viewport: getViewport() };
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
    <style>{`
      .canvas-shell .react-flow__edge.selected .react-flow__edge-path {
        stroke: #2563eb !important;
        stroke-width: 4 !important;
      }
      .canvas-shell .react-flow__edge-interaction { cursor: pointer; }
    `}</style>
    <ReactFlow nodes={nodes} edges={edges.map(edge => ({ ...edge, type: 'smoothstep', pathOptions: { offset: 24, borderRadius: 10, stepPosition: 0.5 } }))} onEdgeClick={(_, edge) => { const source = nodes.find(n => n.id === edge.source); const target = nodes.find(n => n.id === edge.target); setStatus(`연결: ${source?.data.label || edge.source} [${edge.source.slice(-6)}] → ${target?.data.label || edge.target} [${edge.target.slice(-6)}]. 이 두 노드만 연결되어 있습니다.`); }} nodeTypes={nodeTypes} nodeOrigin={nodeOrigin} viewport={viewport} onViewportChange={setViewport} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onReconnect={reconnect} edgesReconnectable reconnectRadius={24} isValidConnection={(c) => Boolean(c.source && c.target && c.source !== c.target)} onNodeDoubleClick={(_, node) => setEditingId(node.id)} fitView={startup.kind !== 'success'} fitViewOptions={{ padding: 0.2, maxZoom: 1 }} minZoom={0.1} maxZoom={3} defaultEdgeOptions={{ type: 'smoothstep', pathOptions: { offset: 24, borderRadius: 10, stepPosition: 0.5 }, interactionWidth: 28, style: { stroke: '#64748b', strokeWidth: 2 }, reconnectable: true }} deleteKeyCode={['Backspace', 'Delete']} multiSelectionKeyCode="Shift" snapToGrid snapGrid={snapGrid} panOnDrag zoomOnScroll zoomOnPinch zoomOnDoubleClick={false}>
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
      <MiniMap position="bottom-right" pannable zoomable nodeColor={(n) => n.type === 'gate' ? '#f59e0b' : '#60a5fa'} />
    </ReactFlow>
    <div className="canvas-heading"><strong>WBS Canvas · {project.durationWeeks}주</strong><span title={project.idea}>{project.idea}</span><small title={project.team}>팀: {project.team}</small></div>
    <div className="canvas-actions" role="group" aria-label="WBS 편집 도구">
      <button type="button" className="canvas-add-button" onClick={() => addNode('task')}>+ 작업</button>
      <button type="button" className="canvas-action-button canvas-action-button--gate" onClick={() => addNode('gate')}>+ Gate</button>
      <button type="button" className="canvas-action-button canvas-action-button--danger" onClick={removeSelected}>선택 삭제</button>
      <button type="button" className="canvas-action-button canvas-action-button--danger" onClick={removeSelectedEdges}>연결선만 삭제</button>
      <button type="button" className="canvas-action-button" onMouseDown={event => event.preventDefault()} onClick={arrange}>선택 위치 정돈</button>
      <button type="button" className="canvas-action-button" onClick={arrangeAll}>전체 위치 정돈</button>
      <button type="button" className="canvas-action-button" onClick={undoLayout}>배치 되돌리기</button>
      <button type="button" className="canvas-action-button" onClick={exportLayoutData}>배치 데이터 내보내기</button>

      <button type="button" className="canvas-action-button" onClick={save}>저장</button>
      <button type="button" className="canvas-action-button" onClick={load}>불러오기</button>
    </div>
    <div className="canvas-status" role="status" aria-live="polite">{status}</div>
    <div className="canvas-help">오른쪽 점 → 왼쪽 점: 연결 · 선 클릭: 선택 · 선택한 선 끝점 드래그: 연결 변경 · 연결선만 삭제: 노드 유지 · Shift+클릭: 다중 선택</div>
    <CanvasToolbar />
    {editingNode && <NodeEditor key={editingNode.id} node={editingNode} maxWeek={maxWeek} onClose={() => setEditingId(null)} onApply={(id, data) => { setNodes((list) => list.map((n) => n.id === id ? { ...n, data } : n)); setEditingId(null); setStatus('WBS 정보를 적용했습니다. 저장 버튼을 눌러 보관해 주세요.'); }} />}
  </main>;
}

export default function Canvas() {
  const [project, setProject] = useState(null);
  if (!project) return <ProjectInitModal onComplete={setProject} />;
  return <ReactFlowProvider><CanvasContent project={project} /></ReactFlowProvider>;
}
