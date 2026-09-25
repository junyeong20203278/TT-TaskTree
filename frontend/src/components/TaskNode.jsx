import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function TaskNode({ id, data, selected }) {
  const isGate = data.is_required || data.isGate;

  return (
    <div
      onClick={() => data.onSelectNode?.(id)}
      style={{
        padding: '14px 18px',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: selected ? '2px solid #2563eb' : '2px solid #cbd5e1',
        boxShadow: selected ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        minWidth: '220px',
        fontFamily: 'system-ui, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: '10px', height: '10px', backgroundColor: '#94a3b8' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: '#e0e7ff',
            color: '#3730a3',
          }}
        >
          {data.stage || 'Phase'}
        </span>
        {data.status === 'ACCEPTED' && (
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>✓ 완료</span>
        )}
      </div>

      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0 10px 0' }}>
        {data.label}
      </div>

      {/* 2단계: 3지선다 확장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddBranch?.(id);
          }}
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#2563eb',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + 선택지 확장
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6' }}
      />
    </div>
  );
}