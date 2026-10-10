import React, { useState } from 'react';
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

import { transformWbsToGraph } from './utils/parser';
import { generateWbs } from './api/wbsApi';
import StepNode from './components/StepNode';
import BranchModal from './components/BranchModal';
import GitHubExportModal from './components/GitHubExportModal';

const nodeTypes = {
  stepNode: StepNode,
  taskNode: StepNode,
  requiredStepNode: StepNode,
};

export default function App() {
  const [idea, setIdea] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [durationWeeks, setDurationWeeks] = useState(8);

  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 모달 제어 상태
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [activeMilestoneNode, setActiveMilestoneNode] = useState(null);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // 1. WBS 전체 생성 (Gemini)
  const handleGenerate = async () => {
    if (!idea.trim()) return alert('프로젝트 주제를 입력하세요!');
    setNodes([]);
    setEdges([]);
    setLoading(true);

    try {
      const data = await generateWbs({
        idea: idea.trim(),
        teamSize,
        durationWeeks,
      });

      const { nodes: parsedNodes, edges: parsedEdges } = transformWbsToGraph(data);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    } catch (err) {
      alert(`오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. 관문 노드 클릭 시 3지선다 모달 오픈
  const handleNodeClick = (event, node) => {
    if (node.data.isMilestone && node.data.branch_options?.length > 0) {
      setActiveMilestoneNode(node);
      setIsBranchModalOpen(true);
    }
  };

  // 3. 3지선다 결정 수락 시 캔버스 상태 갱신
  const handleAcceptOption = (chosenOption) => {
    if (!activeMilestoneNode) return;

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === activeMilestoneNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              label: `[결정] ${chosenOption.title}`,
              description: chosenOption.description,
              tools: chosenOption.recommended_tools,
              status: 'decided',
            },
          };
        }
        return n;
      })
    );

    setIsBranchModalOpen(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 네비게이션 헤더 */}
      <header
        style={{
          height: 65,
          padding: '0 24px',
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* POCO Workflow -> TT (TaskTree) 변경 */}
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#818CF8', letterSpacing: '-0.5px' }}>
            TT <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8' }}>TaskTree</span>
          </h2>
          <span style={{ fontSize: 11, background: '#312E81', color: '#C7D2FE', padding: '2px 8px', borderRadius: 12 }}>
            Gemini Engine
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="text"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="프로젝트 주제를 입력하세요 (예: IoT 에너지 모니터링 시스템)"
            style={{ width: 340, padding: '8px 12px', borderRadius: 6, background: '#1E293B', color: '#FFF', border: '1px solid #334155', fontSize: 13 }}
          />
          <div style={{ color: '#94A3B8', fontSize: 12 }}>
            인원: <input type="number" min="1" max="10" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} style={{ width: 42, background: '#1E293B', color: '#FFF', border: '1px solid #334155', borderRadius: 4, textAlign: 'center' }} /> 명
          </div>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>
            기간: <input type="number" min="1" max="24" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} style={{ width: 42, background: '#1E293B', color: '#FFF', border: '1px solid #334155', borderRadius: 4, textAlign: 'center' }} /> 주
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: loading ? '#475569' : '#4F46E5', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          >
            {loading ? '생성 중...' : 'WBS 생성'}
          </button>

          {nodes.length > 0 && (
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#24292F',
                color: '#FFF',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🐙</span> GitHub 이슈 등록
            </button>
          )}
        </div>
      </header>

      {/* React Flow 캔버스 영역 */}
      <main style={{ flex: 1, width: '100%', height: 'calc(100vh - 65px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
        >
          <Background color="#CBD5E1" gap={16} />
          <Controls />
        </ReactFlow>
      </main>

      {/* 3지선다 관문 의사결정 모달 */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        nodeTitle={activeMilestoneNode?.data.label}
        options={activeMilestoneNode?.data.branch_options}
        onAccept={handleAcceptOption}
      />

      {/* GitHub 이슈 등록 모달 */}
      <GitHubExportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        nodes={nodes}
      />
    </div>
  );
}