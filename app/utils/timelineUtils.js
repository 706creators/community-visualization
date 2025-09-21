import * as d3 from 'd3';

// 解析时间并创建时间比例尺
export const createTimeScale = (nodes, size, margin) => {
  const parseTime = d3.timeParse("%Y-%m-%d %H:%M");
  const eventNodes = nodes.filter(d => d.type === 'event' && d.time);
  
  // 为事件节点解析时间
  eventNodes.forEach(d => {
    d.parsedTime = parseTime(d.time);
  });

  let timeScale = null;
  if (eventNodes.length > 0) {
    const timeExtent = d3.extent(eventNodes, d => d.parsedTime);
    timeScale = d3.scaleTime()
      .domain(timeExtent)
      .range([margin.left, size.width - margin.right]);
  }

  return { timeScale, eventNodes };
};

// 创建时间轴
export const createTimeAxis = (fixedLayer, timeScale, size, margin) => {
  if (!timeScale) return;

  const timeAxis = d3.axisBottom(timeScale)
    .tickFormat(d3.timeFormat("%m/%d %H:%M"))
    .ticks(8);

  // 时间轴背景
  fixedLayer.append('rect')
    .attr('x', 0)
    .attr('y', size.height - margin.bottom)
    .attr('width', size.width)
    .attr('height', margin.bottom)
    .attr('fill', '#f8f9fa')
    .attr('stroke', '#e9ecef');

  // 时间轴
  fixedLayer.append('g')
    .attr('class', 'time-axis')
    .attr('transform', `translate(0, ${size.height - margin.bottom + 10})`)
    .call(timeAxis)
    .selectAll('text')
    .style('font-size', '12px')
    .style('fill', '#666')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  // 时间轴标题
  fixedLayer.append('text')
    .attr('x', size.width / 2)
    .attr('y', size.height - 10)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Timeline');
};

// 创建时间网格线
export const createTimeGrid = (zoomableContainer, timeScale, size, margin) => {
  if (!timeScale) return;

  zoomableContainer.append('g')
    .attr('class', 'time-grid')
    .selectAll('line')
    .data(timeScale.ticks(8))
    .enter()
    .append('line')
    .attr('x1', d => timeScale(d))
    .attr('x2', d => timeScale(d))
    .attr('y1', margin.top)
    .attr('y2', size.height - margin.bottom)
    .attr('stroke', '#e9ecef')
    .attr('stroke-dasharray', '2,2')
    .attr('opacity', 0.5);
};

// 添加时间约束力
export const addTimeConstraints = (simulation, timeScale, size, margin) => {
  if (!timeScale) return;

  simulation.force('timeConstraint', d3.forceY()
    .y(d => {
      if (d.type === 'event' && d.parsedTime) {
        return size.height * 0.7 + margin.top;
      }
      return size.height / 2 + margin.top;
    })
    .strength(0.3)
  );
  
  simulation.force('timeX', d3.forceX()
    .x(d => {
      if (d.type === 'event' && d.parsedTime) {
        return timeScale(d.parsedTime);
      }
      return d.x || size.width / 2 + margin.left;
    })
    .strength(d => d.type === 'event' && d.parsedTime ? 0.8 : 0.1)
  );
};