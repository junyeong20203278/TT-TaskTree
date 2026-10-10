/**
 * 백엔드 WBS 응답(JSON) -> React Flow Graph (Nodes & Edges) 변환
 */
export function transformWbsToGraph(wbsData) {
  if (!wbsData || !wbsData.nodes || !Array.isArray(wbsData.nodes)) {
    return { nodes: [], edges: [] };
  }

  // 노드 배치 좌표 설정
  const START_X = 100;
  const LEVEL_GAP_X = 320; // 주차(Week) 간격
  const NODE_GAP_Y = 150;  // 같은 주차 내 노드 간격
  const BASE_Y = 100;

  // 주차별(Week) Y축 인덱스 카운터
  const weekCounts = {};

  // 1. React Flow 노드 생성
  const nodes = wbsData.nodes.map((task) => {
    const week = task.week || 1;
    const yIndex = weekCounts[week] || 0;
    weekCounts[week] = yIndex + 1;

    return {
      id: task.id,
      type: task.is_milestone ? 'requiredStepNode' : 'stepNode', // 마일스톤 노드는 강조 타입 적용 가능
      position: {
        x: START_X + (week - 1) * LEVEL_GAP_X,
        y: BASE_Y + yIndex * NODE_GAP_Y,
      },
      data: {
        id: task.id,
        label: task.title,
        week: task.week,
        category: task.category || 'common',
        isMilestone: Boolean(task.is_milestone),
        description: task.description || '',
        tools: task.tools || [],
        checklist: task.checklist || [],
        // 관문 노드 전용 3지선다 대안 목록 보관
        branch_options: task.branch_options || [],
        status: 'default', // 'default' | 'decided'
      },
    };
  });

  // 2. React Flow 엣지(연결선) 생성
  const edges = [];
  wbsData.nodes.forEach((task) => {
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach((depId) => {
        edges.push({
          id: `edge-${depId}-${task.id}`,
          source: depId,
          target: task.id,
          type: 'smoothstep',
          animated: task.is_milestone, // 관문으로 이어지는 선은 애니메이션 강조
          style: {
            stroke: task.is_milestone ? '#6366F1' : '#94A3B8',
            strokeWidth: task.is_milestone ? 2.5 : 2,
          },
        });
      });
    }
  });

  return { nodes, edges };
}