import * as d3 from 'd3'
import useGradients from './useGradients'
import useTooltip from './useTooltip'

export default function useChartRenderer({
  chartContainer,
  departmentColors,
  baseRoot,
  format,
  getVisiblePath,
  debouncedSearch
}) {
  const { createGradients } = useGradients(departmentColors)
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip(format)

  let svg, zoomGroup, linkGroup, nodeGroupContainer
  let zoomInstance
  let currentTransform
  let latestNodes = []
  let initialRender = true

  function initializeChart() {
    svg = d3.select(chartContainer.value).select('svg')
    if (!svg.node()) {
      svg = d3.select(chartContainer.value)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('cursor', 'grab')

      zoomGroup = svg.append('g')
      linkGroup = zoomGroup.append('g').attr('class', 'links')
      nodeGroupContainer = zoomGroup.append('g').attr('class', 'nodes')

      createGradients(svg)

      const defs = svg.append('defs')
      defs.append('filter').attr('id', 'dropShadowBox')
        .append('feDropShadow')
        .attr('dx', 2).attr('dy', 2).attr('stdDeviation', 3)
        .attr('flood-color', '#000').attr('flood-opacity', 0.2)

      defs.append('filter').attr('id', 'textShadow')
        .append('feDropShadow')
        .attr('dx', 1).attr('dy', 1).attr('stdDeviation', 1)
        .attr('flood-color', '#000').attr('flood-opacity', 0.15)

      defs.append('clipPath')
        .attr('id', 'avatarClip')
        .append('circle')
        .attr('r', 15)
        .attr('cx', 15)
        .attr('cy', 15)

      zoomInstance = d3.zoom()
        .scaleExtent([0.05, 3])
        .on('zoom', (event) => {
          zoomGroup.attr('transform', event.transform)
          currentTransform = event.transform
        })

      svg.call(zoomInstance)
      svg.on('wheel', event => event.preventDefault())
    }
  }

  function centerOnTree(nodes, withTransition = true) {
    if (!nodes || nodes.length === 0) return

    const container = chartContainer.value.getBoundingClientRect()
    const padding = 100
    const titleOffset = 80

    const minX = d3.min(nodes, d => d.x)
    const maxX = d3.max(nodes, d => d.x)
    const minY = d3.min(nodes, d => d.y)
    const maxY = d3.max(nodes, d => d.y)

    const treeWidth = maxX - minX
    const treeHeight = maxY - minY

    const availableWidth = container.width - padding * 2
    const availableHeight = container.height - padding * 2 - titleOffset

    const scale = Math.min(
      availableWidth / treeWidth,
      availableHeight / treeHeight,
      1.0
    )

    const centerX = (container.width / 2) - ((minX + treeWidth / 2) * scale)
    const centerY = (container.height / 2.2) - ((minY + treeHeight / 2) * scale) + titleOffset

    const transform = d3.zoomIdentity.translate(centerX, centerY).scale(scale)

    if (withTransition) {
      svg.transition().duration(600).call(zoomInstance.transform, transform)
    } else {
      svg.call(zoomInstance.transform, transform)
    }

    currentTransform = transform
  }

  function renderChart() {
    initializeChart()

    const boxWidth = 260
    const boxHeight = 320

    const root = baseRoot.value.copy()
    const visibleNodes = debouncedSearch.value
      ? getVisiblePath(root, debouncedSearch.value)
      : null

    root.each(node => {
      if (!node._children && node.children) {
        node._children = node.children
      }
    })

    root.each(node => {
      if (node.data._expanded === undefined) {
        node.data._expanded = false
      }
      node.children = node.data._expanded ? node._children : null
      node._visible = !debouncedSearch.value || (visibleNodes && visibleNodes.has(node))
    })

    d3.tree().nodeSize([280, 400])(root)

    const nodes = root.descendants()
    const links = root.links()
    latestNodes = nodes

    if (initialRender) {
      centerOnTree(nodes.filter(n => n._visible), false)
      initialRender = false
    }

    const transition = svg.transition().duration(400)
    const linkGenerator = d3.linkVertical().x(d => d.x).y(d => d.y)

    const link = linkGroup.selectAll('path.link')
      .data(links, d => d.target.data.id)

    link.enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('d', d => {
        const o = { x: d.source.x, y: d.source.y }
        return linkGenerator({ source: o, target: o })
      })
      .transition(transition)
      .attr('d', d => linkGenerator(d))

    link.transition(transition).attr('d', d => linkGenerator(d))
    link.exit().transition(transition).style('opacity', 0).remove()

    const nodeGroup = nodeGroupContainer.selectAll('g.node')
      .data(nodes, d => d.data.id)

    const nodeEnter = nodeGroup.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y - 20})`)
      .style('opacity', 0)
      .style('display', d => d._visible ? null : 'none')
      .style('cursor', 'pointer')
      .on('click', function (event, d) {
        d.data._expanded = !d.data._expanded
        renderChart()
      })
      .on('mouseenter', (event, d) => showTooltip(event, d))
      .on('mousemove', moveTooltip)
      .on('mouseleave', hideTooltip)

    nodeEnter.append('rect')
      .attr('x', -boxWidth / 2)
      .attr('y', -boxHeight / 2)
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('rx', 20)
      .attr('fill', d => {
        let cur = d
        while (cur) {
          const dept = cur.data.department || cur.data.Department
          if (dept) return `url(#gradient-${dept.replace(/[^\w-]+/g, '')})`
          cur = cur.parent
        }
        return departmentColors['Default']
      })
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#dropShadowBox)')

    const nodeMerge = nodeEnter.merge(nodeGroup)

    nodeMerge.each(function (d) {
      const sel = d3.select(this)
      sel.selectAll('g.bubble').remove()

      const m = d.data.metrics
      const lines = [
        { text: d.data.name.toUpperCase(), group: 'header', fontSize: 20, fontWeight: 'bold' },
        { text: d.data.title, group: 'header', fontSize: 14, fontWeight: 600 },
        { text: `Department: ${d.data.department || 'N/A'}`, group: 'body' },
        { text: `Location: ${d.data.location || 'N/A'}`, group: 'body' },
        { text: `Salary: $${format(d.data.salary)}`, group: 'body' },
        { text: `Project: ${d.data.project || 'N/A'}`, group: 'body' },
        { text: `Cost: $${format(m?.totalCost || 0)}`, group: 'footer' },
        { text: `Descendants: ${m?.descendantCount || 0}`, group: 'footer' }
      ]

      const ySpacing = 28
      const paddingY = 4
      const groupSpacing = { header: 30, body: 10 }

      let yOffset = -(lines.length * ySpacing) / 2
      let lastGroup = null

      lines.forEach((line, i) => {
        if (lastGroup && lastGroup !== line.group) {
          yOffset += groupSpacing[lastGroup] || 0
        }
        if (i === 1 && line.group === 'header') {
          yOffset += 8
        }

        const g = sel.append('g')
          .attr('class', 'bubble')
          .attr('transform', `translate(0, ${yOffset})`)

        const text = g.append('text')
          .text(line.text)
          .attr('font-size', line.fontSize || 12)
          .attr('font-weight', line.fontWeight || 400)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('fill', 'white')
          .attr('font-family', 'Inter, sans-serif')
          .attr('filter', 'url(#textShadow)')

        const bbox = text.node().getBBox()

        // Add avatar image next to name
        if (i === 0 && d.data.photo) {
          const avatarSize = 30
          const imageX = -bbox.width / 2 - avatarSize - 8
          const imageY = -avatarSize / 2

          g.append('image')
            .attr('href', d.data.photo)
            .attr('x', imageX)
            .attr('y', imageY)
            .attr('width', avatarSize)
            .attr('height', avatarSize)
            .attr('clip-path', 'url(#avatarClip)')
        }

        g.insert('rect', 'text')
          .attr('x', bbox.x - 10)
          .attr('y', bbox.y - paddingY)
          .attr('width', bbox.width + 20)
          .attr('height', bbox.height + paddingY * 2)
          .attr('rx', 16)
          .attr('fill', 'rgba(255, 255, 255, 0.2)')

        yOffset += ySpacing
        lastGroup = line.group
      })
    })

    nodeEnter.transition(transition)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('opacity', 1)

    nodeGroup.transition(transition)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('display', d => d._visible ? null : 'none')

    nodeGroup.exit().transition(transition)
      .style('opacity', 0)
      .remove()

    nodeGroupContainer.raise()
  }

  function resetView() {
    const visible = latestNodes.filter(n => n._visible)
    if (visible.length > 0) {
      centerOnTree(visible)
    }
  }

  function autoFitTree() {
    const root = baseRoot.value.copy()
    root.each(node => { node.data._expanded = false })
    debouncedSearch.value = ''
    initialRender = true
    renderChart()
  }

  return { renderChart, resetView, autoFitTree }
}
