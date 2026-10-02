/**
 * 백엔드 WBS JSON 데이터를 React Flow의 { nodes, edges } 구조로 변환
 * @param {Object} wbsResponse - 백엔드 WBS 응답 데이터 { project_title, nodes: [...] }
 */
export const transformWbsToGraph = (wbsResponse) => {
  if (!wbsResponse || !wbsResponse.nodes) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  
  // 주차별(X축) 배치 간격 및 세로(Y축) 분산 간격 설정
  const X_GAP = 280;
  const Y_GAP = 120;
  const START_X = 100;
  const START_Y = 150;

  // 동일 주차 내 노드 개수를 카운트하기 위한 맵
  const weekCounts = {};

  wbsResponse.nodes.forEach((task) => {
    const currentWeek = task.week || 1;
    
    // 해당 주차의 세로 인덱스 계산
    const yIndex = weekCounts[currentWeek] || 0;
    weekCounts[currentWeek] = yIndex + 1;

    // React Flow 노드 생성
    const nodeItem = {
      id: String(task.id),
      // 필수 관문(DB ERD 등)이면 커스텀 다이아몬드 노드, 일반 작업이면 기본 노드 지정
      type: task.is_milestone ? 'requiredStepNode' : 'taskNode',
      position: {
        x: START_X + (currentWeek - 1) * X_GAP,
        y: START_Y + yIndex * Y_GAP,
      },
      data: {
        label: task.title,
        week: task.week,
        category: task.category, // 'frontend', 'backend', 'devops' 등
        isMilestone: task.is_milestone,
        description: task.description || '',
      },
    };
    nodes.push(nodeItem);

    // 선행 의존성(dependencies) 기반 Edge(선) 자동 연결
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach((precedingId) => {
        edges.push({
          id: `e-${precedingId}-${task.id}`,
          source: String(precedingId),
          target: String(task.id),
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4B5563', strokeWidth: 2 },
        });
      });
    }
  });

  return { nodes, edges };
};