import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export default memo(function TaskNode({ id, data, selected }) {
  return (
    <article className={`wbs-task${selected ? ' is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="wbs-node-top"><span>작업 · {data.stage}</span><span className={`wbs-status wbs-status--${data.status}`}>{data.status}</span></div>
      <strong className="wbs-node-title">{data.label}</strong>
      <div className="wbs-node-meta">담당: {data.assignee}</div>
      <div className="wbs-node-meta">기간: {data.startWeek}~{data.endWeek}주</div>
      <small className="wbs-node-id">ID: {id}</small>
      <Handle type="source" position={Position.Right} />
    </article>
  );
});
