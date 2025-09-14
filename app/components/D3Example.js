import { useEffect, createRef } from 'react'
import * as d3 from 'd3'
import { useState } from 'react'

export default function D3Example({ width, height }) {
  const ref = createRef()

  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/graph.json')
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

    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("a simple tooltip");
    // Specify the dimensions of the chart.
    // const width = 928
    // const height = 680

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    
    const links = data.links.map(d => ({ ...d }))
    const nodes = data.nodes.map(d => ({ ...d }))

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('x', d3.forceX())
      .force('y', d3.forceY())
    //   .force('radial', d3.forceRadial(d => d.radius || 0, 0, 0).strength(0.1)) // 根据节点的 radius 属性将节点推向圆心，默认值为 10



    // Create the SVG container.
    const svgContainer = svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('style', 'max-width: 100%; height: auto;')

    // Add a line for each link, and a circle for each node.
    const link = svgContainer.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value))

    const node = svgContainer.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      // 如果r有值，就用r，否则用5
      .attr('r', d => d.radius ? d.radius + 4 : 5)
      .attr('fill', d => color(d.group))
      .call(drag(simulation))
      .on("mouseover", function(event, d){
        console.log("mouseover", d)
        tooltip.text(d.id)
        return tooltip.style("visibility", "visible");
    })
	.on("mousemove", function(event){
        return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
    })
	.on("mouseout", function(){return tooltip.style("visibility", "hidden");});

    node.append('title')
      .text(d => d.id)

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
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