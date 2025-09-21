import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  symbolTypes, 
  findDownstreamNodes, 
  calculateLinkDistance, 
  createArrowMarkers, 
  createTooltip,
  getNodeLabel 
} from '../utils/graphUtils';
import { 
  createTimeScale, 
  createTimeAxis, 
  createTimeGrid, 
  addTimeConstraints 
} from '../utils/timelineUtils';

export default function CommunityGraph({ width = 800, height = 600, data: externalData }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const elementsRef = useRef({}); // 存储 D3 选择集引用
  
  const [data, setData] = useState(null);
  const [size, setSize] = useState({ width, height });
  const [selectedNode, setSelectedNode] = useState(null);

  // 数据加载 effect
  useEffect(() => {
    if (externalData) {
      setData(externalData);
    } else {
      fetch('/graph_data.json')
        .then(response => response.json())
        .then(data => setData(data))
        .catch(error => console.error('Error fetching the data:', error));
    }
  }, [externalData]);

  // 尺寸监听 effect
  useEffect(() => {
    const roEl = containerRef.current;
    if (!roEl) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const cr = entry.contentRect;
        setSize({
          width: Math.max(1, Math.floor(cr.width)),
          height: Math.max(1, Math.floor(cr.height))
        });
      }
    });
    
    observer.observe(roEl);
    return () => observer.disconnect();
  }, []);

  // 绘制 effect - 只在数据或尺寸变化时重建
  useEffect(() => {
    if (data && size.width && size.height) {
      draw();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, size]);

  // 选中节点变化时只更新样式
  useEffect(() => {
    if (data && elementsRef.current.linkSelection && elementsRef.current.nodeSelection && elementsRef.current.labelSelection) {
      updateHighlighting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode]);

  // 添加拖拽行为的辅助函数
  const addDragBehavior = (nodeSelection, simulation) => {
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

  const updateHighlighting = () => {
    if (!data || !elementsRef.current.linkSelection) return;

    // 使用存储的原始数据进行计算
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // 计算高亮的节点和边
    let highlightedNodes = new Set();
    let highlightedEdgeIndices = new Set();
    
    if (selectedNode) {
      const downstream = findDownstreamNodes(selectedNode.id, elementsRef.current.originalEdges);
      highlightedNodes = new Set([selectedNode.id, ...downstream.nodes]);
      
      // 通过边的索引来标记高亮边
      elementsRef.current.originalEdges.forEach((edge, index) => {
        if (downstream.edges.has(edge)) {
          highlightedEdgeIndices.add(index);
        }
      });
    }

    // 更新链接样式
    elementsRef.current.linkSelection
      .attr('stroke', (d, i) => highlightedEdgeIndices.has(i) ? '#ff6b35' : '#999')
      .attr('stroke-opacity', (d, i) => highlightedEdgeIndices.has(i) ? 1 : (selectedNode ? 0.1 : 0.6))
      .attr('stroke-width', (d, i) => highlightedEdgeIndices.has(i) ? 3 : Math.sqrt(d.value || 1))
      .attr('marker-end', (d, i) => highlightedEdgeIndices.has(i) ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)');

    // 更新节点样式
    elementsRef.current.nodeSelection
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
      });

    // 更新标签样式
    elementsRef.current.labelSelection
      .attr('opacity', d => {
        if (!selectedNode) return 1;
        return highlightedNodes.has(d.id) ? 1 : 0.3;
      });
  };

  const draw = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 停止之前的仿真
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 删除页面上可能残留的 tooltip
    d3.select('body').selectAll('.cg-tooltip').remove();

    // 设置边距
    const margin = { top: 20, right: 20, bottom: 80, left: 20 };
    const graphWidth = size.width - margin.left - margin.right;
    const graphHeight = size.height - margin.top - margin.bottom;

    // 创建基础元素
    const symbol = d3.symbol().size(200);
    const tooltip = createTooltip();
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // 数据处理
    const links = data.edges.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // 时间轴处理
    const { timeScale } = createTimeScale(nodes, size, margin);

    // 创建力导向图仿真
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(calculateLinkDistance)
      )
      .force('charge', d3.forceManyBody()
        .strength(-200)
        .distanceMax(200)
      )
      .force('center', d3.forceCenter(graphWidth / 2 + margin.left, graphHeight / 2 + margin.top))
      .force('collision', d3.forceCollide().radius(30));

    // 存储仿真引用
    simulationRef.current = simulation;

    // 添加时间约束
    addTimeConstraints(simulation, timeScale, size, margin);

    // 创建SVG结构
    const defs = svg.append('defs');
    createArrowMarkers(defs);

    const fixedLayer = svg.append('g').attr('class', 'fixed-layer');
    const zoomableContainer = svg.append('g').attr('class', 'zoomable-container');

    // 创建时间轴
    createTimeAxis(fixedLayer, timeScale, size, margin);
    createTimeGrid(zoomableContainer, timeScale, size, margin);

    // 创建缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        zoomableContainer.attr('transform', event.transform);
        
        if (timeScale) {
          const newTimeScale = event.transform.rescaleX(timeScale);
          const newTimeAxis = d3.axisBottom(newTimeScale)
            .tickFormat(d3.timeFormat("%m/%d %H:%M"))
            .ticks(8);
          
          fixedLayer.select('.time-axis')
            .call(newTimeAxis)
            .selectAll('text')
            .style('font-size', '12px')
            .style('fill', '#666')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');
        }
      });

    svg.call(zoom);

    // 创建图形元素（初始状态，不考虑高亮）
    const linkSelection = zoomableContainer.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value || 1))
      .attr('marker-end', 'url(#arrowhead)');

    const nodeSelection = zoomableContainer.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(nodes)
      .join('path')
      .attr('d', d => symbol.type(symbolTypes[d.type || d.group || 'member'])())
      .attr('fill', d => color(d.type || d.group))
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

    const labelSelection = zoomableContainer.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(getNodeLabel)
      .style('font-size', '10px')
      .style('fill', '#333')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none');

    // 存储选择集引用和原始数据
    elementsRef.current = {
      linkSelection,
      nodeSelection,
      labelSelection,
      originalEdges: links  // 保存原始边数据用于高亮计算
    };

    // 添加拖拽行为
    addDragBehavior(nodeSelection, simulation);

    // 点击空白处取消选中
    svg.on("click", function(event) {
      if (event.target === event.currentTarget) {
        setSelectedNode(null);
      }
    });

    // 仿真tick事件
    simulation.on('tick', () => {
      // 限制节点在图形区域内
      nodes.forEach(d => {
        d.x = Math.max(margin.left + 20, Math.min(size.width - margin.right - 20, d.x));
        d.y = Math.max(margin.top + 20, Math.min(size.height - margin.bottom - 20, d.y));
      });

      linkSelection
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeSelection
        .attr('transform', d => `translate(${d.x},${d.y})`);

      labelSelection
        .attr('x', d => d.x)
        .attr('y', d => d.y + 20);
    });

    // 初始化时应用当前的高亮状态
    updateHighlighting();
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      d3.select('body').selectAll('.cg-tooltip').remove();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}