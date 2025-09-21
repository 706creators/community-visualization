import * as d3 from 'd3';

// 符号类型定义
export const symbolTypes = {
  event: d3.symbolSquare,
  space: d3.symbolTriangle,
  member: d3.symbolCircle,
  person: d3.symbolCircle,
  act: d3.symbolSquare,
  area: d3.symbolTriangle
};

// 递归找到从指定节点出发的所有下游节点（只考虑出边）
export const findDownstreamNodes = (startNodeId, edges) => {
  const visited = new Set();
  const downstreamNodes = new Set();
  const downstreamEdges = new Set();
  
  // 创建邻接表（只存储出边）
  const outEdges = new Map();
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
    const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
    
    if (!outEdges.has(sourceId)) {
      outEdges.set(sourceId, []);
    }
    outEdges.get(sourceId).push({ target: targetId, edge });
  });

  // DFS递归遍历
  const dfs = (nodeId) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const neighbors = outEdges.get(nodeId) || [];
    neighbors.forEach(({ target, edge }) => {
      downstreamNodes.add(target);
      downstreamEdges.add(edge);
      dfs(target);
    });
  };

  dfs(startNodeId);
  return { nodes: downstreamNodes, edges: downstreamEdges };
};

// 计算链接距离
export const calculateLinkDistance = (d) => {
  const baseLength = 50;
  const sourceType = d.source.type;
  const targetType = d.target.type;

  if (sourceType === 'person' && targetType === 'act') {
    return baseLength * 2;
  } else if (sourceType === 'act' && targetType === 'person') {
    return baseLength;
  } else if (sourceType === 'act' && targetType === 'area') {
    return baseLength * 2.5;
  }
  return baseLength;
};

// 创建箭头标记
export const createArrowMarkers = (defs) => {
  // 普通箭头
  defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 15)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#999');

  // 高亮箭头
  defs.append('marker')
    .attr('id', 'arrowhead-highlight')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 15)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#ff6b35');
};

// 创建Tooltip
export const createTooltip = () => {
  return d3.select("body")
    .append("div")
    .attr('class', 'cg-tooltip')
    .style("position", "absolute")
    .style("z-index", "9999")
    .style("visibility", "hidden")
    .style("padding", "6px 8px")
    .style("background", "rgba(0,0,0,0.75)")
    .style("color", "white")
    .style("border-radius", "4px")
    .style("font-size", "12px");
};

// 节点标签文本处理
export const getNodeLabel = (d) => {
  if (d.type === 'event') {
    return d.name || d.id.split('@')[0] || d.id;
  }
  return d.name || d.id.split(':')[1] || d.id;
};