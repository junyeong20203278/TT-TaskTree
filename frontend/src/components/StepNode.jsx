import React from 'react';
import { Handle, Position } from 'reactflow';

// 카테고리별 뱃지 색상 정의
const CATEGORY_COLORS = {
  frontend: '#3B82F6', // 파랑
  backend: '#10B981',  // 초록
  devops: '#F59E0B',   // 주황
  common: '#6B7280',   // 회색
};

export const StepNode = ({ data = {} }) => {
  const isMilestone = Boolean(data.isMilestone || data.is_required);
  const category = (data.category || 'common').toLowerCase();
  const categoryColor = CATEGORY_COLORS[category] || '#6B7280';

  return (
    <div
      style={{
        width: 220,
        padding: '12px 14px',
        borderRadius: 10,
        background: '#FFFFFF',
        border: isMilestone ? '2px solid #6366F1' : '1px solid #E5E7EB',
        boxShadow: isMilestone 
          ? '0 4px 14px rgba(99, 102, 241, 0.25)' 
          : '0 2px 6px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {/* 선행 노드 연결점 (좌측) */}
      <Handle type="target" position={Position.Left} style={{ background: '#6366F1' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            background: categoryColor,
            color: '#FFFFFF',
            textTransform: 'uppercase',
          }}
        >
          {category}
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
          Week {data.week || 1}
        </span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', lineHeight: 1.3 }}>
        {data.label || '제목 없음'}
      </div>

      {isMilestone && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#4F46E5', fontWeight: 700 }}>
          ★ 필수 마일스톤
        </div>
      )}

      {/* 후행 노드 연결점 (우측) */}
      <Handle type="source" position={Position.Right} style={{ background: '#6366F1' }} />
    </div>
  );
};

export default StepNode;