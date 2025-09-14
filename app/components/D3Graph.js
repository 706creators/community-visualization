
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import styles from './D3Graph.module.css'



export default function D3Graph() {
  const ref = useRef()

  useEffect(() => {
    const svg = d3.select(ref.current)
    const width = +svg.attr('width')
    const height = +svg.attr('height')

    const color = d3.scaleOrdinal(d3.schemeCategory10)

    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).strength(link => {
        if (link.source.group === link.target.group) {
          return 0.5
        } else {
          return 0.1
        }
      }))
      .force('charge', d3.forceManyBody().strength(-40))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const groupSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).strength(link => link.value * 2))
      .force('charge', d3.forceManyBody().strength(-10))
      .force('center', d3.forceCenter(width / 2, height / 2))

    fetch('/data2.json')
      .then(response => response.json())
      .then(graph => {
        var groups = [];

        graph.nodes.forEach(d => {
          if (!groups.some(group => group.id === d.group)) {
            groups.push({ id: d.group })
          }
        })

        // print groups
        console.log('[debug1]', groups)

        const groupLinks = {}

        graph.links.forEach(d => {
          const nodes = graph.nodes
          const map = new Map(nodes.map(node => [node.id, node]))

          const target = d.target
          const source = d.source

          let groupTarget, groupSource
          if (map.get(target).group > map.get(source).group) {
            groupTarget = map.get(target).group
            groupSource = map.get(source).group
          } else {
            groupTarget = map.get(source).group
            groupSource = map.get(target).group
          }

          if (groupTarget !== groupSource) {
            const property = `_${groupSource}-${groupTarget}`
            groupLinks[property] = (groupLinks[property] || 0) + 1
          }
        })

        console.log('[debug2]', groupLinks)

        const groupGraph = {
          nodes: groups,
          links: Object.entries(groupLinks).map(([key, value]) => {
            const [source, target] = key.substring(1).split('-')
            return { source, target, value }
          })
        }

        console.log('[debug3]', groupGraph)

        groupSimulation.nodes(groupGraph.nodes)
        // 添加 Voronoi 背景层
        const voronoiGroup = svg.append('g')
          // .attr('class', 'voronoi-background')
          .attr('class', styles.voronoi)
          // .attr('fill-opacity', 0.2)

        const link = svg.append('g')
          .attr('class', styles.links)
          .selectAll('line')
          .data(graph.links)
          .enter().append('line')
          .attr('stroke-width', d => Math.sqrt(d.value))

        const node = svg.append('g')
          .attr('class', styles.nodes)
          .selectAll('circle')
          .data(graph.nodes)
          .enter().append('circle')
          .attr('r', 5)
          .attr('fill', d => color(d.group))
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))

        node.append('title')
          .text(d => d.id)

        simulation.nodes(graph.nodes).on('tick', ticked)
        simulation.force('link').links(graph.links)
        console.log('[debug5]', simulation.nodes())

        function updateVoronoi() {
          const groupNodes = groupSimulation.nodes()
          const delaunay = d3.Delaunay.from(
            groupNodes,
            d => d.x,
            d => d.y
          )
          const voronoi = delaunay.voronoi([0, 0, width, height])
        
          voronoiGroup.selectAll('path')
            .data(groupNodes)
            .join('path')
            .attr('fill', d => color(d.id))
            .attr('d', (d, i) => {
              const cell = voronoi.cellPolygon(i)
              return cell ? `M${cell.join('L')}Z` : null
            })
        }

        function updateGroupPositions() {
          // 计算每个组的平均位置
          const groupPositions = {}
          simulation.nodes().forEach(d => {
            if (!groupPositions[d.group]) {
              groupPositions[d.group] = { x: 0, y: 0, count: 0 }
            }
            groupPositions[d.group].x += d.x
            groupPositions[d.group].y += d.y
            groupPositions[d.group].count += 1
          })
        
          // 更新组的位置
          groupSimulation.nodes().forEach(d => {
            if (groupPositions[d.id]) {
              d.x = groupPositions[d.id].x / groupPositions[d.id].count
              d.y = groupPositions[d.id].y / groupPositions[d.id].count
            }
          })
        }
        
       
        function ticked() {

          updateGroupPositions()
          updateVoronoi()
          // 更新 Voronoi 背景
          const centroids = {}

          groupSimulation.nodes().forEach(d => {
            centroids[d.id] = { x: d.x, y: d.y }
          })

          const minDistance = 50 + (1000 * (0.1 - simulation.alpha()))

          node.each(d => {
            const cx = centroids[d.group].x
            const cy = centroids[d.group].y
            const dx = cx - d.x
            const dy = cy - d.y
            const r = Math.sqrt(dx * dx + dy * dy)

            if (r > minDistance) {
              d.x = d.x * 0.95 + cx * 0.05
              d.y = d.y * 0.95 + cy * 0.05
            }
          })

          updateVoronoi()

          link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)

          node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
        }

        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          if (!event.active) groupSimulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
          updateGroupPositions()
          updateVoronoi()
        }
        
        function dragged(event, d) {
          d.fx = event.x
          d.fy = event.y
          updateGroupPositions()
          updateVoronoi()
        }
        
        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0)
          if (!event.active) groupSimulation.alphaTarget(0)
          d.fx = null
          d.fy = null
          updateGroupPositions()
          updateVoronoi()
        }

      })
      .catch(error => console.error('Error fetching the data:', error))
  }, [])

  return (
    <svg ref={ref} width="960" height="600"></svg>
  )
}