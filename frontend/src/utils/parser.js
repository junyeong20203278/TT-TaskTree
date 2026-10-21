/**
 * 백엔드 WBS 응답(JSON) -> React Flow Graph (Nodes & Edges) 변환
 */
export function transformWbsToGraph(wbsData) {
  if (!wbsData || !wbsData.nodes || !Array.isArray(wbsData.nodes)) {
    return { nodes: [], edges: [] };
  }

  const START_X = 100;
  const LEVEL_GAP_X = 320; // 주차(Week) 간격
  const NODE_GAP_Y = 160;  // 같은 주차 내 노드 간격
  const BASE_Y = 120;

  const weekCounts = {};

  // 1. React Flow 노드 생성
  const nodes = wbsData.nodes.map((task) => {
    const week = task.week || 1;
    const yIndex = weekCounts[week] || 0;
    weekCounts[week] = yIndex + 1;

    return {
      id: task.id,
      // 팀원의 nodeTypes 규격('gate' / 'task')과 일치화
      type: task.is_milestone ? 'gate' : 'task',
      position: {
        x: START_X + (week - 1) * LEVEL_GAP_X,
        y: BASE_Y + yIndex * NODE_GAP_Y,
      },
      data: {
        id: task.id,
        label: task.title,
        // Canvas.jsx의 NodeEditor 및 UI에서 사용하는 필드 매핑
        stage: task.category || '개발',
        assignee: '미정',
        startWeek: week,
        endWeek: week,
        status: '대기',
        // 사이드패널 및 백엔드 원본 메타데이터 보존
        category: task.category || 'common',
        isMilestone: Boolean(task.is_milestone),
        description: task.description || '',
        tools: task.tools || [],
        checklist: task.checklist || [],
        branch_options: task.branch_options || [],
      },
    };
  });

  // 2. React Flow 엣지 생성
  const edges = [];
  wbsData.nodes.forEach((task) => {
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach((depId) => {
        edges.push({
          id: `edge-${depId}-${task.id}`,
          source: depId,
          target: task.id,
          type: 'smoothstep',
          animated: Boolean(task.is_milestone),
        });
      });
    }
  });

  return { nodes, edges };
}