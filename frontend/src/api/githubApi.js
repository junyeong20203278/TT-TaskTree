import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

/**      
 * 5단계: 생성된 WBS 노드들을 대상 GitHub 레포지토리의 Issues로 일괄 등록 요청
 * @param {Object} githubConfig - { repo_url: string, token: string }
 * @param {Array} tasks - 등록할 WBS 작업 노드 목록
 */
export const syncGithubIssues = async (githubConfig, tasks) => {
  try {
    const payload = {
      repo_url: githubConfig.repo_url,
      token: githubConfig.token,
      issues: tasks.map((task) => ({
        title: `[Week ${task.data?.week || 1}] ${task.data?.label || ''}`,
        body: task.data?.description || '',
        labels: [task.data?.category || 'task', task.data?.isMilestone ? 'milestone' : ''].filter(Boolean),
      })),
    };

    const response = await axios.post(`${API_BASE_URL}/github/sync`, payload);
    return response.data; // { success: boolean, created_count: number }
  } catch (error) {
    console.error('[API Error] syncGithubIssues:', error);
    throw error;
  }
};