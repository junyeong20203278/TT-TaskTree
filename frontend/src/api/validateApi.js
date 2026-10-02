import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * 4단계: 현재 캔버스 상의 전체 WBS 노드/엣지 무결성 검증 요청
 * @param {Array} nodes - 현재 캔버스의 노드 목록
 * @param {Array} edges - 현재 캔버스의 엣지(연결선) 목록
 */
export const validateWbsGraph = async (nodes, edges) => {
  try {
    const payload = {
      nodes: nodes.map((node) => ({
        id: node.id,
        title: node.data?.label || '',
        week: node.data?.week || 1,
        category: node.data?.category || '',
        is_milestone: node.data?.isMilestone || false,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    const response = await axios.post(`${API_BASE_URL}/validate`, payload);
    return response.data; // { is_valid: boolean, warnings: [...], cycles: [...] }
  } catch (error) {
    console.error('[API Error] validateWbsGraph:', error);
    throw error;
  }
};