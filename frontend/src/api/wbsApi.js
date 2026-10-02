import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * 1단계: 프로젝트 기본 정보를 바탕으로 거시적 WBS 뼈대 생성 요청
 * @param {Object} projectData - { idea: string, duration_weeks: number, team_info: object }
 */
export const generateMacroWbs = async (projectData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate`, projectData);
    return response.data;
  } catch (error) {
    console.error('[API Error] generateMacroWbs:', error);
    throw error;
  }
};

/**
 * 2단계: 특정 부모 노드의 3지선다 세부 옵션 생성 요청
 * @param {string} nodeId - 선택한 부모 노드 ID
 * @param {string} nodeTitle - 선택한 노드 제목
 */
export const getBranchOptions = async (nodeId, nodeTitle) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/project/branch`, {
      node_id: nodeId,
      title: nodeTitle,
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] getBranchOptions:', error);
    throw error;
  }
};