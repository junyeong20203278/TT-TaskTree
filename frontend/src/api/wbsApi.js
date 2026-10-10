const API_BASE_URL = 'http://localhost:8000';

/**
 * 1. 프로젝트 WBS 전체 뼈대 생성 (Gemini 기반 1회 호출)
 */
export async function generateWbs({ idea, teamSize = 4, durationWeeks = 8 }) {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idea: idea.trim(),
      team_size: Number(teamSize),
      duration_weeks: Number(durationWeeks),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'WBS 생성에 실패했습니다.');
  }

  return await response.json();
}

/**
 * 2. 관문 노드 3지선다 분기 옵션 조회
 */
export async function fetchBranchOptions({
  idea,
  parentStepId,
  parentTitle,
  currentWeek = 1,
  teamSize = 4,
  selectedHistory = [],
}) {
  const response = await fetch(`${API_BASE_URL}/api/branch/options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idea: idea.trim(),
      parent_step_id: parentStepId,
      parent_title: parentTitle,
      current_week: Number(currentWeek),
      team_size: Number(teamSize),
      selected_history: selectedHistory,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || '3지선다 옵션 생성에 실패했습니다.');
  }

  return await response.json();
}