// src/composables/useTooltip.js
import * as d3 from 'd3'

export default function useTooltip(format) {
  const showTooltip = (event, d) => {
    const m = d.data.metrics
    if (!m) return

    const name = d.data.name || 'Unknown'
    const email = d.data.email || 'N/A'
    const status = d.data.status || 'N/A'
    const performance = d.data.performance || 'N/A'
    const entity = d.data.entity || 'N/A'

    d3.select('#tooltip')
      .html(`
        <div class="mb-1 font-bold text-slate-800 text-sm">${name}</div>

        <div class="mb-2 text-xs">
          <div class="font-semibold text-slate-700 mb-1">📧 Contact</div>
          <div><strong>Email:</strong> ${email}</div>
          <div><strong>Status:</strong> ${status}</div>
        </div>

        <div class="mb-2 text-xs">
          <div class="font-semibold text-slate-700 mb-1">📈 Performance</div>
          <div><strong>Rating:</strong> ${performance}</div>
          <div><strong>Entity:</strong> ${entity}</div>
        </div>

        <div class="text-xs">
          <div class="font-semibold text-slate-700 mb-1">📊 Ratio</div>
          <div>👩‍💻 <strong>IC / Mgr:</strong> ${m.ratio.toFixed(2)}</div>
          <div>🧑‍💼 <strong>Mgmt Cost:</strong> $${format(m.managementCost)}</div>
          <div>👩‍💻 <strong>IC Cost:</strong> $${format(m.icCost)}</div>
        </div>
      `)
      .style('left', `${event.pageX + 16}px`)
      .style('top', `${event.pageY + 16}px`)
      .classed('hidden', false)
  }

  const moveTooltip = (event) => {
    d3.select('#tooltip')
      .style('left', `${event.pageX + 16}px`)
      .style('top', `${event.pageY + 16}px`)
  }

  const hideTooltip = () => {
    d3.select('#tooltip').classed('hidden', true)
  }

  return {
    showTooltip,
    moveTooltip,
    hideTooltip
  }
}
