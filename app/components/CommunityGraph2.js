import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useState } from 'react'

export default function D3Example({ width = 800, height = 600 }) {
  // const ref = createRef()
  const containerRef = useRef(null)
  const svgRef = useRef(null)

  const [data, setData] = useState(null)
  const [size, setSize] = useState({ width, height })

  useEffect(() => {
    fetch('/graph_data.json')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching the data:', error))
  }, [])

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

    // Create a simulation with several forces.
    // 注意这里在每次 draw 都创建新的 simulation，需在 cleanup 时停止
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
      .force('center', d3.forceCenter(size.width / 2, size.height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create the SVG container.
    const container = svg.append('g')

    // 创建缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    // 应用缩放行为到 SVG
    svg.call(zoom)

    // 使用 container 替代之前的 svgContainer
    const svgContainer = container
      .attr('width', size.width)
      .attr('height', size.height)
      .attr('viewBox', [0, 0, size.width, size.height])
      .attr('style', 'max-width: 100%; height: 100%;')

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

    const link = svgContainer.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value))
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
        tooltip.text(d.id)
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function () { return tooltip.style("visibility", "hidden"); });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node
        .attr('transform', d => `translate(${d.x},${d.y})`)
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