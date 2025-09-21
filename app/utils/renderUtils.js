import * as d3 from 'd3';

// 创建并配置链接
export const createLinks = (container, links, highlightedEdges, selectedNode) => {
  return container.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', d => Math.sqrt(d.value || 1))
    .attr('stroke', d => highlightedEdges.has(d) ? '#ff6b35' : '#999')
    .attr('stroke-opacity', d => highlightedEdges.has(d) ? 1 : (selectedNode ? 0.1 : 0.6))
    .attr('stroke-width', d => highlightedEdges.has(d) ? 3 : Math.sqrt(d.value || 1))
    .attr('marker-end', d => highlightedEdges.has(d) ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)');
};

// 创建并配置节点
export const createNodes = (container, nodes, symbol, symbolTypes, color, highlightedNodes, selectedNode, setSelectedNode, tooltip) => {
  return container.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(nodes)
    .join('path')
    .attr('d', d => symbol.type(symbolTypes[d.type || d.group || 'member'])())
    .attr('fill', d => {
      if (selectedNode && d.id === selectedNode.id) {
        return '#ff6b35';
      } else if (highlightedNodes.has(d.id)) {
        return '#ffb347';
      } else {
        return color(d.type || d.group);
      }
    })
    .attr('opacity', d => {
      if (!selectedNode) return 1;
      return highlightedNodes.has(d.id) ? 1 : 0.2;
    })
    .attr('stroke-width', d => {
      if (selectedNode && d.id === selectedNode.id) {
        return 3;
      } else if (highlightedNodes.has(d.id)) {
        return 2;
      } else {
        return 1.5;
      }
    })
    .style('cursor', 'pointer')
    .on("click", function (event, d) {
      event.stopPropagation();
      if (selectedNode && selectedNode.id === d.id) {
        setSelectedNode(null);
      } else {
        setSelectedNode(d);
      }
    })
    .on("mouseover", function (event, d) {
      const tooltipText = d.time ? `${d.id}\n${d.time}` : d.id;
      tooltip.html(tooltipText.replace('\n', '<br>'));
      return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function (event) {
      return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () { 
      return tooltip.style("visibility", "hidden"); 
    });
};

// 创建节点标签
export const createLabels = (container, nodes, highlightedNodes, selectedNode, getNodeLabel) => {
  return container.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .text(getNodeLabel)
    .style('font-size', '10px')
    .style('fill', '#333')
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('opacity', d => {
      if (!selectedNode) return 1;
      return highlightedNodes.has(d.id) ? 1 : 0.3;
    });
};

// 添加拖拽行为
export const addDragBehavior = (nodeSelection, simulation) => {
  return nodeSelection.call(d3.drag()
    .on('start', function (event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', function (event, d) {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', function (event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    })
  );
};