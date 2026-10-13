import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export default memo(function GateNode({ id, data, selected }) {
  return (
    <article className={`wbs-gate${selected ? ' is-selected' : ''}`} title={`ID: ${id} / 단계: ${data.stage}`}>
      <div className="wbs-gate-diamond" />
      <Handle type="target" position={Position.Left} />
      <div className="wbs-gate-content">
        <span className="wbs-gate-tag">GATE · {data.stage}</span>
        <strong className="wbs-node-title">{data.label}</strong>
        <span className="wbs-node-meta">담당: {data.assignee}</span>
        <span className="wbs-node-meta">{data.startWeek}~{data.endWeek}주 · {data.status}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </article>
  );
});
