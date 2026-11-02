import dagre from '@dagrejs/dagre';

// Canvas uses nodeOrigin={[0.5, 0.5]}: React Flow positions are CENTERS.
export function getLayoutedNodes(nodes, edges) {
  if (!nodes.length) return [];
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 80, marginx: 60, marginy: 60 });
  const ids = new Set(nodes.map(node => node.id));
  nodes.forEach(node => {
    const fallback = node.type === 'gate' ? { width: 210, height: 210 } : { width: 220, height: 170 };
    graph.setNode(node.id, {
      width: node.measured?.width || node.width || fallback.width,
      height: node.measured?.height || node.height || fallback.height,
    });
  });
  edges.forEach(edge => {
    if (ids.has(edge.source) && ids.has(edge.target) && edge.source !== edge.target) {
      graph.setEdge(edge.source, edge.target, {}, edge.id);
    }
  });
  dagre.layout(graph);
  return nodes.map(node => {
    const point = graph.node(node.id);
    return { ...node, position: { x: point.x, y: point.y } };
  });
}
