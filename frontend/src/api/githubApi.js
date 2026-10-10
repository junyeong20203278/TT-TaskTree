const API_BASE_URL = 'http://localhost:8000';

/**
 * 선택된 노드들을 GitHub Issues로 일괄 등록
 */
export async function exportIssuesToGitHub({ githubToken, repoOwner, repoName, nodes }) {
  const payload = {
    github_token: githubToken.trim(),
    repo_owner: repoOwner.trim(),
    repo_name: repoName.trim(),
    nodes: nodes.map((node) => ({
      id: node.id,
      title: node.data?.label || node.title,
      week: node.data?.week || node.week || 1,
      category: node.data?.category || node.category || 'common',
      description: node.data?.description || node.description || '',
      tools: node.data?.tools || node.tools || [],
      checklist: node.data?.checklist || node.checklist || [],
    })),
  };

  const response = await fetch(`${API_BASE_URL}/api/github/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'GitHub 이슈 등록에 실패했습니다. 토큰 및 레포 경로를 확인하세요.');
  }

  return await response.json();
}