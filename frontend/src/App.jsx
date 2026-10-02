import * as wbsApi from './api/wbsApi';
import * as validateApi from './api/validateApi';
import * as githubApi from './api/githubApi';

// window 객체에 등록
window.testApis = { ...wbsApi, ...validateApi, ...githubApi };
import React, { useState } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { generateMacroWbs } from "./api/wbsApi";
import { transformWbsToGraph } from "./utils/parser";
import RequiredStepNode from "./components/RequiredStepNode";
import TaskNode from "./components/TaskNode";
import BranchModal from "./components/BranchModal";
import SidePanel from "./components/SidePanel";

// 커스텀 노드 매핑
const nodeTypes = {
  taskNode: TaskNode,
  requiredStepNode: RequiredStepNode,
};

// 1. 화면 테스트용 초기 Mock 데이터 (백엔드 미가동 시 즉시 확인용)
const initialWbsMock = {
  project_title: "테스트 프로젝트",
  nodes: [
    { id: "1", title: "요구사항 정의", week: 1, category: "frontend", is_milestone: false, dependencies: [] },
    { id: "2", title: "DB ERD 설계", week: 2, category: "backend", is_milestone: true, dependencies: ["1"] },
    { id: "3", title: "API 명세 작성", week: 2, category: "backend", is_milestone: false, dependencies: ["1"] },
    { id: "4", title: "캔버스 UI 구현", week: 3, category: "frontend", is_milestone: false, dependencies: ["2"] },
  ],
};

export default function App() {
  // 초기 파싱 데이터로 노드와 엣지 세팅
  const initialGraph = transformWbsToGraph(initialWbsMock);
  const [nodes, setNodes] = useState(initialGraph.nodes);
  const [edges, setEdges] = useState(initialGraph.edges);
  const [loading, setLoading] = useState(false);

  // 백엔드 E2E API 호출 함수
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateMacroWbs({
        idea: "캠핑 EMS 모니터링 시스템",
        duration_weeks: 8,
      });
      const parsed = transformWbsToGraph(data);
      setNodes(parsed.nodes);
      setEdges(parsed.edges);
    } catch (err) {
      console.warn("백엔드 미실행 중: 기존 Mock 데이터를 유지합니다.", err);
      alert("백엔드 서버가 아직 켜지지 않았습니다. Mock 데이터로 화면을 표시합니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* 상단 테스트 컨트롤 바 */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          background: "white",
          padding: "10px 16px",
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: "0.95rem" }}>TaskTree E2E 테스트</strong>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "6px 12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "WBS 생성 중..." : "AI WBS 생성 요청 (API)"}
        </button>
      </div>

      {/* React Flow 캔버스 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={16} size={1} />
        <Controls />
      </ReactFlow>

      {/* 2단계 브랜치 모달 및 3단계 사이드패널 마운트 */}
      <BranchModal />
      <SidePanel />
    </div>
  );
}