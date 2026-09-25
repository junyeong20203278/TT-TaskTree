import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 1. 일반 태스크 노드
function TaskNode({ id, data, selected }) {
  return (
    <div
      onClick={() => data.onSelectNode?.(id)}
      style={{
        padding: '14px 18px',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: selected ? '2px solid #2563eb' : '2px solid #cbd5e1',
        boxShadow: selected ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        minWidth: '210px',
        fontFamily: 'system-ui, sans-serif',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', backgroundColor: '#94a3b8' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
          {data.stage || 'Phase'}
        </span>
        {data.status === 'ACCEPTED' && (
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>✓ 완료</span>
        )}
      </div>

      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0 10px 0' }}>
        {data.label}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddBranch?.(id);
          }}
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#2563eb',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + 선택지 확장
        </button>
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6' }} />
    </div>
  );
}

// 2. 다이아몬드 필수 관문(◆) 노드
function RequiredStepNode({ id, data, selected }) {
  return (
    <div
      onClick={() => data.onSelectNode?.(id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        minWidth: '160px',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', backgroundColor: '#d97706' }} />

      <div
        style={{
          width: '52px',
          height: '52px',
          backgroundColor: data.status === 'ACCEPTED' ? '#16a34a' : '#f59e0b',
          transform: 'rotate(45deg)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: selected ? '0 0 0 4px rgba(245, 158, 11, 0.4)' : '0 4px 10px rgba(245, 158, 11, 0.3)',
          marginBottom: '14px',
        }}
      >
        <span style={{ transform: 'rotate(-45deg)', color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}>
          필수
        </span>
      </div>

      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e' }}>{data.label}</div>
        <div style={{ fontSize: '10px', color: '#b45309', marginTop: '2px' }}>
          {data.status === 'ACCEPTED' ? '✓ 승인 완료' : '◆ 필수 관문 설계'}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', backgroundColor: '#d97706' }} />
    </div>
  );
}

// 3. 우측 실무 멘토링 사이드패널
function TaskSidePanel({ step, isOpen, onClose, onAccept }) {
  const [activeTab, setActiveTab] = useState('mentoring');

  if (!isOpen || !step) return null;

  const detail = step.data?.detail || {};
  const mentoring = detail.mentoring || {};
  const dictionary = detail.dictionary || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: '54px',
        right: 0,
        bottom: 0,
        width: '380px',
        backgroundColor: '#ffffff',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        borderLeft: '1px solid #e2e8f0',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>STEP DETAILS</span>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>{step.data?.label}</h3>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 20px' }}>
        {['mentoring', 'dictionary', 'template'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab ? '#2563eb' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
            }}
          >
            {tab === 'mentoring' ? '멘토링' : tab === 'dictionary' ? '사전' : '템플릿'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {activeTab === 'mentoring' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>📖 단계 설명</h4>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                {mentoring.description || '선택한 태스크에 대한 설명입니다.'}
              </p>
            </div>

            {mentoring.recommended_methods?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>🔥 추천 개발 방식</h4>
                {mentoring.recommended_methods.map((m, i) => (
                  <div key={i} style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>{i + 1}. {m.title}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{m.content}</div>
                  </div>
                ))}
              </div>
            )}

            {mentoring.one_line_tip && (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8' }}>💡 실무 팁</span>
                <p style={{ fontSize: '11px', color: '#1e40af', margin: '4px 0 0 0' }}>{mentoring.one_line_tip}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dictionary' && (
          <div>
            {dictionary.length > 0 ? (
              dictionary.map((item, i) => (
                <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{item.term}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.definition}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '30px' }}>사전 데이터가 없습니다.</div>
            )}
          </div>
        )}

        {activeTab === 'template' && (
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            <p style={{ fontSize: '12px', color: '#64748b' }}>이 단계의 산출물 템플릿입니다.</p>
            {detail.template_url ? (
              <a
                href={detail.template_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  marginTop: '10px',
                }}
              >
                📄 도구/템플릿 열기
              </a>
            ) : (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>템플릿 준비 중</span>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
        <button
          onClick={onAccept}
          style={{
            width: '100%',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          ✓ 작업 확정 (Accept)
        </button>
      </div>
    </div>
  );
}

// 4. 메인 App
export default function App() {
  const nodeTypes = useMemo(
    () => ({
      taskNode: TaskNode,
      requiredStepNode: RequiredStepNode,
    }),
    []
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [activeParentNode, setActiveParentNode] = useState(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleOpenBranchModal = useCallback((nodeId) => {
    setActiveParentNode(nodeId);
    setModalOpen(true);
  }, []);

  const handleSelectNode = useCallback((nodeId) => {
    setNodes((nds) => {
      const target = nds.find((n) => n.id === nodeId);
      setSelectedNode(target);
      setIsSidePanelOpen(true);
      return nds;
    });
  }, []);

  const initialNodes = useMemo(
    () => [
      {
        id: 'node-1',
        type: 'taskNode',
        position: { x: 50, y: 180 },
        data: {
          stage: 'Phase 1 (1주차)',
          label: '요구사항 분석 및 기획',
          onAddBranch: handleOpenBranchModal,
          onSelectNode: handleSelectNode,
          detail: {
            mentoring: {
              description: '사용자 요구사항을 도출하고 핵심 기능 명세서를 확정하는 단계입니다.',
              recommended_methods: [{ title: 'User Story 정의', content: 'As a (user), I want (goal), so that (benefit) 규격으로 작성하세요.' }],
              one_line_tip: '초기 MVP 범위는 최소 3개 핵심 기능으로 압축하세요.',
            },
            dictionary: [{ term: 'MVP', definition: '핵심 기능만 갖춘 최소 제품' }],
            template_url: 'https://notion.so',
          },
        },
      },
      {
        id: 'node-2',
        type: 'requiredStepNode',
        position: { x: 380, y: 165 },
        data: {
          label: 'DB ERD 모델링',
          status: 'IN_PROGRESS',
          is_required: true,
          onSelectNode: handleSelectNode,
          detail: {
            mentoring: {
              description: '핵심 데이터를 담을 테이블과 관계를 설계합니다.',
              recommended_methods: [{ title: 'dbdiagram.io 활용', content: 'DBML 문법으로 테이블 관계를 작성하세요.' }],
              one_line_tip: '외래키 제약조건과 3차 정규화를 지켜 데이터 무결성을 확보하세요.',
            },
            dictionary: [{ term: 'ERD', definition: '개체 간의 관계 다이어그램' }],
            template_url: 'https://dbdiagram.io',
          },
        },
      },
      {
        id: 'node-3',
        type: 'taskNode',
        position: { x: 670, y: 180 },
        data: {
          stage: 'Phase 3 (3주차)',
          label: 'Core API 명세 및 구현',
          onAddBranch: handleOpenBranchModal,
          onSelectNode: handleSelectNode,
          detail: {
            mentoring: {
              description: 'RESTful 규약에 맞추어 API 인터페이스를 설계합니다.',
              recommended_methods: [{ title: 'FastAPI Swagger', content: '/docs로 자동 생성되는 API 문서를 활용하세요.' }],
              one_line_tip: '적절한 HTTP 상태 코드를 분리하여 반환하세요.',
            },
            dictionary: [{ term: 'RESTful API', definition: 'HTTP 규약을 따르는 소프트웨어 인터페이스' }],
            template_url: 'https://swagger.io',
          },
        },
      },
    ],
    [handleOpenBranchModal, handleSelectNode]
  );

  const initialEdges = [
    { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
    setIsSidePanelOpen(true);
  };

  const handleSelectOption = (choice) => {
    const parent = nodes.find((n) => n.id === activeParentNode);
    if (!parent) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'taskNode',
      position: {
        x: parent.position.x + 280,
        y: parent.position.y + 130,
      },
      data: {
        stage: '세부 태스크',
        label: choice.title,
        status: 'ACCEPTED',
        onAddBranch: handleOpenBranchModal,
        onSelectNode: handleSelectNode,
        detail: choice.detail,
      },
    };

    const newEdge = {
      id: `e-${parent.id}-${newNodeId}`,
      source: parent.id,
      target: newNodeId,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setModalOpen(false);

    setSelectedNode(newNode);
    setIsSidePanelOpen(true);
  };

  const currentParentTitle = nodes.find((n) => n.id === activeParentNode)?.data?.label || '';

  const choices = [
    {
      title: 'PostgreSQL 정규화 모델링',
      desc: 'ACID 트랜잭션과 데이터 정합성을 철저하게 보장하는 표준 RDBMS 설계',
      days: '약 3일 소요',
      detail: {
        mentoring: {
          description: '외래키 제약조건과 3차 정규화를 적용해 데이터 중복을 방지합니다.',
          recommended_methods: [{ title: '인덱스 튜닝', content: '조회가 잦은 컬럼에 B-Tree 인덱스를 설정하세요.' }],
          one_line_tip: '초기 모델링 단계에서는 불필요한 복합키를 피하고 단일 PK를 사용하세요.',
        },
        dictionary: [{ term: '정규화', definition: '데이터 중복을 제거하고 이상 현상을 방지하는 작업' }],
        template_url: 'https://dbdiagram.io',
      },
    },
    {
      title: 'Prisma ORM 기반 빠른 모델링',
      desc: 'TypeScript 타입 안전성을 극대화하고 자동 마이그레이션을 지원하는 현대적 설계',
      days: '약 2일 소요',
      detail: {
        mentoring: {
          description: 'schema.prisma 파일에 데이터 모델을 선언하고 마이그레이션을 자동 실행합니다.',
          recommended_methods: [{ title: 'Prisma Studio', content: 'GUI로 DB 데이터를 즉시 브라우징하세요.' }],
          one_line_tip: 'DB 콘솔에서 직접 스키마를 고치지 말고 반드시 prisma 파일로 버전 관리하세요.',
        },
        dictionary: [{ term: 'ORM', definition: '객체와 관계형 데이터베이스를 매핑하는 도구' }],
        template_url: 'https://prisma.io',
      },
    },
    {
      title: 'Supabase BaaS 클라우드 스키마',
      desc: '인프라 구축 없이 콘솔 테이블 생성과 실시간 API를 바로 뽑아내는 초고속 방식',
      days: '약 1일 소요',
      detail: {
        mentoring: {
          description: 'PostgreSQL 기반 클라우드 DB로 즉시 REST API를 생성합니다.',
          recommended_methods: [{ title: 'RLS 보안', content: '테이블별 Row Level Security를 켜서 데이터 접근을 제어하세요.' }],
          one_line_tip: '프론트에 노출되는 Anon Key 권한을 엄격하게 제한하세요.',
        },
        dictionary: [{ term: 'BaaS', definition: 'Backend as a Service, 클라우드 백엔드 인프라 서비스' }],
        template_url: 'https://supabase.com',
      },
    },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '54px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 10,
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.5px' }}>TT</span>
      </header>

      <div style={{ width: '100%', height: '100%', paddingTop: '54px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background color="#cbd5e1" gap={18} />
          <Controls />
        </ReactFlow>
      </div>

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              width: '640px',
              maxWidth: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '10px' }}>
                  3-Choice 의사결정 확장
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '6px 0 0 0' }}>
                  [{currentParentTitle}] 구현 방식을 선택하세요
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '20px 0' }}>
              {choices.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectOption(c)}
                  style={{
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      옵션 {String.fromCharCode(65 + idx)}
                    </span>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: '6px 0' }}>
                      {c.title}
                    </h4>
                    <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                      {c.desc}
                    </p>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>
                    {c.days}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              카드를 선택하면 즉시 가지가 뻗어나가고, 우측 패널에서 상세 멘토링이 열립니다.
            </div>
          </div>
        </div>
      )}

      <TaskSidePanel
        step={selectedNode}
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        onAccept={() => {
          if (!selectedNode) return;
          setNodes((nds) =>
            nds.map((n) =>
              n.id === selectedNode.id
                ? { ...n, data: { ...n.data, status: 'ACCEPTED' } }
                : n
            )
          );
          setIsSidePanelOpen(false);
        }}
      />
    </div>
  );
}