import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useState } from 'react'

export default function D3Example({ width = 800, height = 600, data: externalData }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)

  const [data, setData] = useState(null)
  const [size, setSize] = useState({ width, height })

  useEffect(() => {
    // 如果有外部数据，使用外部数据，否则加载默认数据
    if (externalData) {
      setData(externalData)
    } else {
      fetch('/graph_data.json')
        .then(response => response.json())
        .then(data => setData(data))
        .catch(error => console.error('Error fetching the data:', error))
    }
  }, [externalData])

  // ResizeObserver: 让 SVG 填满外层 div
  useEffect(() => {
    const roEl = containerRef.current
    if (!roEl) return
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const cr = entry.contentRect
        setSize({
          width: Math.max(1, Math.floor(cr.width)),
          height: Math.max(1, Math.floor(cr.height))
        })
      }
    })
    observer.observe(roEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (data && size.width && size.height) {
      draw()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, size])

  const draw = () => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // 删除页面上可能残留的 tooltip（避免重复）
    d3.select('body').selectAll('.cg-tooltip').remove()

    // 设置边距，为时间轴留出空间
    const margin = { top: 20, right: 20, bottom: 80, left: 20 }
    const graphWidth = size.width - margin.left - margin.right
    const graphHeight = size.height - margin.top - margin.bottom

    // 添加形状定义
    const symbolTypes = {
      event: d3.symbolSquare,
      space: d3.symbolTriangle,
      member: d3.symbolCircle,
      person: d3.symbolCircle,
      act: d3.symbolSquare,
      area: d3.symbolTriangle
    }

    // 创建symbol生成器
    const symbol = d3.symbol().size(200)

    var tooltip = d3.select("body")
      .append("div")
      .attr('class', 'cg-tooltip')
      .style("position", "absolute")
      .style("z-index", "9999")
      .style("visibility", "hidden")
      .style("padding", "6px 8px")
      .style("background", "rgba(0,0,0,0.75)")
      .style("color", "white")
      .style("border-radius", "4px")
      .style("font-size", "12px")

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    const links = data.edges.map(d => ({ ...d }))
    const nodes = data.nodes.map(d => ({ ...d }))

    // 解析时间并创建时间比例尺
    const parseTime = d3.timeParse("%Y-%m-%d %H:%M")
    const eventNodes = nodes.filter(d => d.type === 'event' && d.time)
    
    // 为事件节点解析时间
    eventNodes.forEach(d => {
      d.parsedTime = parseTime(d.time)
    })

    // 创建时间比例尺
    let timeScale = null
    if (eventNodes.length > 0) {
      const timeExtent = d3.extent(eventNodes, d => d.parsedTime)
      timeScale = d3.scaleTime()
        .domain(timeExtent)
        .range([margin.left, size.width - margin.right])
    }

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
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
        })
      )
      .force('charge', d3.forceManyBody()
        .strength(-200)
        .distanceMax(200)
      )
      .force('center', d3.forceCenter(graphWidth / 2 + margin.left, graphHeight / 2 + margin.top))
      .force('collision', d3.forceCollide().radius(30))

    // 为有时间的事件节点添加时间约束力
    if (timeScale) {
      simulation.force('timeConstraint', d3.forceY()
        .y(d => {
          if (d.type === 'event' && d.parsedTime) {
            // 事件节点在图的下半部分
            return graphHeight * 0.7 + margin.top
          }
          return graphHeight / 2 + margin.top
        })
        .strength(0.3)
      )
      
      simulation.force('timeX', d3.forceX()
        .x(d => {
          if (d.type === 'event' && d.parsedTime) {
            return timeScale(d.parsedTime)
          }
          return d.x || graphWidth / 2 + margin.left
        })
        .strength(d => d.type === 'event' && d.parsedTime ? 0.8 : 0.1)
      )
    }

    // 在 SVG 容器中定义箭头标记
    svg.append('defs').append('marker')
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

    // 创建固定的时间轴层（不参与缩放）
    const fixedLayer = svg.append('g').attr('class', 'fixed-layer')

    // 创建可缩放的容器
    const zoomableContainer = svg.append('g').attr('class', 'zoomable-container')

    // 添加时间轴到固定层
    if (timeScale) {
      const timeAxis = d3.axisBottom(timeScale)
        .tickFormat(d3.timeFormat("%m/%d %H:%M"))
        .ticks(8)

      // 时间轴背景
      fixedLayer.append('rect')
        .attr('x', 0)
        .attr('y', size.height - margin.bottom)
        .attr('width', size.width)
        .attr('height', margin.bottom)
        .attr('fill', '#f8f9fa')
        .attr('stroke', '#e9ecef')

      // 时间轴
      fixedLayer.append('g')
        .attr('class', 'time-axis')
        .attr('transform', `translate(0, ${size.height - margin.bottom + 10})`)
        .call(timeAxis)
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#666')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')

      // 时间轴标题
      fixedLayer.append('text')
        .attr('x', size.width / 2)
        .attr('y', size.height - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text('Timeline')

      // 添加时间网格线到可缩放容器
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
        .attr('opacity', 0.5)
    }

    // 创建缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        zoomableContainer.attr('transform', event.transform)
        
        // 更新时间轴以匹配缩放
        if (timeScale) {
          const newTimeScale = event.transform.rescaleX(timeScale)
          const newTimeAxis = d3.axisBottom(newTimeScale)
            .tickFormat(d3.timeFormat("%m/%d %H:%M"))
            .ticks(8)
          
          fixedLayer.select('.time-axis')
            .call(newTimeAxis)
            .selectAll('text')
            .style('font-size', '12px')
            .style('fill', '#666')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
        }
      })

    // 应用缩放行为到 SVG
    svg.call(zoom)

    // 使用 zoomableContainer 作为主容器
    const svgContainer = zoomableContainer
      .attr('width', size.width)
      .attr('height', size.height)
      .attr('viewBox', [0, 0, size.width, size.height])
      .attr('style', 'max-width: 100%; height: 100%;')

    const link = svgContainer.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value || 1))
      .attr('marker-end', 'url(#arrowhead)');

    const node = svgContainer.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(nodes)
      .join('path')
      .attr('d', d => symbol.type(symbolTypes[d.type || d.group || 'member'])())
      .attr('fill', d => color(d.type || d.group))
      .call(d3.drag()
        .on('start', function (event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', function (event, d) {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', function (event, d) {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on("mouseover", function (event, d) {
        const tooltipText = d.time ? `${d.id}\n${d.time}` : d.id
        tooltip.html(tooltipText.replace('\n', '<br>'))
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function () { return tooltip.style("visibility", "hidden"); });

    // 添加节点标签
    const labels = svgContainer.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => {
        if (d.type === 'event') {
          return d.name || d.id.split('@')[0] || d.id
        }
        return d.name || d.id.split(':')[1] || d.id
      })
      .style('font-size', '10px')
      .style('fill', '#333')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none')

    simulation.on('tick', () => {
      // 限制节点在图形区域内
      nodes.forEach(d => {
        d.x = Math.max(margin.left + 20, Math.min(size.width - margin.right - 20, d.x))
        d.y = Math.max(margin.top + 20, Math.min(size.height - margin.bottom - 20, d.y))
      })

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node
        .attr('transform', d => `translate(${d.x},${d.y})`)

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y + 20)
    })

    // cleanup: stop simulation and remove tooltip on redraw/unmount
    return () => {
      simulation.stop()
      d3.select('body').selectAll('.cg-tooltip').remove()
      svg.selectAll('*').remove()
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}