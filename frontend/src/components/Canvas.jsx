import { useCallback, useRef } from 'react';

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  addEdge,
  useReactFlow,
  useViewport,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './Canvas.css';

const nodeStyle = {
  background: '#ffffff',
  border: '1px solid #94a3b8',
  borderRadius: 12,
  padding: 16,
  width: 180,
};

const initialNodes = [
  {
    id: 'start',
    position: { x: 0, y: 80 },
    data: { label: '시작 노드' },
    style: {
      ...nodeStyle,
      background: '#eff6ff',
      borderColor: '#93c5fd',
    },
  },
  {
    id: 'work',
    position: { x: 320, y: 80 },
    data: { label: '작업 노드' },
    style: {
      ...nodeStyle,
      background: '#f0fdf4',
      borderColor: '#86efac',
    },
  },
];

const initialEdges = [
  {
    id: 'start-work',
    source: 'start',
    target: 'work',
    type: 'smoothstep',
  },
];

function CanvasToolbar() {
  const { zoomIn, zoomOut, fitView, setViewport, getViewport } =
    useReactFlow();

  const { zoom } = useViewport();

  const resetZoom = () => {
    const viewport = getViewport();

    setViewport(
      {
        x: viewport.x,
        y: viewport.y,
        zoom: 1,
      },
      { duration: 200 }
    );
  };

  return (
    <div
      className="canvas-toolbar"
      role="group"
      aria-label="캔버스 뷰포트 도구"
    >
      <button
        type="button"
        onClick={() => zoomOut({ duration: 200 })}
        title="축소"
        aria-label="캔버스 축소"
      >
        −
      </button>

      <span className="canvas-toolbar__zoom">
        {Math.round(zoom * 100)}%
      </span>

      <button
        type="button"
        onClick={() => zoomIn({ duration: 200 })}
        title="확대"
        aria-label="캔버스 확대"
      >
        +
      </button>

      <span
        className="canvas-toolbar__divider"
        aria-hidden="true"
      />

      <button
        type="button"
        className="canvas-toolbar__text-button"
        onClick={() =>
          fitView({
            padding: 0.25,
            duration: 300,
            maxZoom: 1,
          })
        }
      >
        전체 보기
      </button>

      <button
        type="button"
        className="canvas-toolbar__text-button"
        onClick={resetZoom}
      >
        100%
      </button>
    </div>
  );
}

function CanvasContent() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  const { screenToFlowPosition } = useReactFlow();

  const canvasRef = useRef(null);
  const nextNodeNumber = useRef(1);

  // 화면 중앙의 좌표를 캔버스 좌표로 변환해 노드를 추가합니다.
  const handleAddNode = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    const center = screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    const number = nextNodeNumber.current;
    nextNodeNumber.current += 1;

    const newNode = {
      id: `added-node-${number}`,
      position: {
        // 노드 너비와 대략적인 높이의 절반만큼 보정합니다.
        x: Math.round((center.x - 90) / 20) * 20,
        y: Math.round((center.y - 30) / 20) * 20,
      },
      data: {
        label: `새 노드 ${number}`,
      },
      style: {
        ...nodeStyle,
      },
      selected: true,
    };

    setNodes((currentNodes) => [
      ...currentNodes.map((node) => ({
        ...node,
        selected: false,
      })),
      newNode,
    ]);
  }, [screenToFlowPosition, setNodes]);

  // 핸들을 서로 연결하면 연결선을 상태에 추가합니다.
  const handleConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
          },
          currentEdges
        )
      );
    },
    [setEdges]
  );

  // 같은 노드로 돌아오는 자기 연결은 막습니다.
  const isValidConnection = useCallback(
    (connection) =>
      Boolean(
        connection.source &&
          connection.target &&
          connection.source !== connection.target
      ),
    []
  );

  return (
    <main
      ref={canvasRef}
      className="canvas-shell"
      aria-label="플로우 편집 캔버스"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        fitView
        fitViewOptions={{
          padding: 0.25,
          maxZoom: 1,
        }}
        minZoom={0.1}
        maxZoom={3}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#cbd5e1"
        />

        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor="#94a3b8"
          maskColor="rgba(15, 23, 42, 0.08)"
        />
      </ReactFlow>

      <div className="canvas-heading">
        <strong>Flow Canvas</strong>
        <span>무한 캔버스 작업 공간</span>
      </div>

      <div className="canvas-actions">
        <button
          type="button"
          className="canvas-add-button"
          onClick={handleAddNode}
        >
          + 노드 추가
        </button>
      </div>

      <div className="canvas-help">
        배경 드래그: 이동 · 휠: 줌 · 점 드래그: 연결 ·
        선택 후 Delete: 삭제
      </div>

      <CanvasToolbar />
    </main>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
