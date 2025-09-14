import { useEffect, createRef } from 'react'
import * as d3 from 'd3'
import { useState } from 'react'

export default function D3Example({ width, height }) {
  const ref = createRef()

  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/mock_data1.json')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching the data:', error))
  }, [])


  useEffect(() => {
    if (data) {
      draw()
    }
  }, [data])

  const draw = () => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    // 添加形状定义
    const symbolTypes = {
      act: d3.symbolSquare,
      area: d3.symbolTriangle,
      person: d3.symbolCircle
    }

    // 创建symbol生成器
    const symbol = d3.symbol().size(200)

    var tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .text("a simple tooltip");
    // Specify the dimensions of the chart.

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.

    const links = data.links.map(d => ({ ...d }))
    const nodes = data.nodes.map(d => ({ ...d }))

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          const baseLength = 50; // 基础单位长度
          const sourceType = d.source.type;
          const targetType = d.target.type;

          if (sourceType === 'person' && targetType === 'act') {
            return baseLength * 2; // person -> act: 2个单位
          } else if (sourceType === 'act' && targetType === 'person') {
            return baseLength; // act -> person: 1个单位
          } else if (sourceType === 'act' && targetType === 'area') {
            return baseLength * 2.5; // act -> area: 3个单位
          }
          return baseLength; // 默认1个单位
        })
      )
      .force('charge', d3.forceManyBody()
        .strength(-200)  // 增加节点间的斥力
        .distanceMax(200)  // 限制斥力的最大作用距离
      )
      .force('center', d3.forceCenter(width / 2, height / 2)) // 添加中心力
      .force('collision', d3.forceCollide().radius(30))  // 防止节点重叠


    // Create the SVG container.
    const container = svg.append('g')

    // 创建缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10]) // 设置缩放范围
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    // 应用缩放行为到 SVG
    svg.call(zoom)

    // 使用 container 替代之前的 svgContainer
    const svgContainer = container
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('style', 'max-width: 100%; height: auto;')


    // 在 SVG 容器中定义箭头标记
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)  // 调整箭头位置
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Add a line for each link, and a circle for each node.
    const link = svgContainer.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .attr('marker-end', 'url(#arrowhead)');  // 添加箭头标记


    const node = svgContainer.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(nodes)
      .join('path')
      .attr('r', 5)
      .attr('d', d => symbol.type(symbolTypes[d.type])())  // 根据类型设置形状
      .attr('fill', d => color(d.type))  // 根据类型设置颜色
      .call(drag(simulation))
      .on("mouseover", function (event, d) {
        console.log("mouseover", d)
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
        .attr('transform', d => `translate(${d.x},${d.y})`)  // 使用transform来移动path

    })
  }

  const drag = simulation => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  }
  return <svg width={width} height={height} ref={ref} />
}