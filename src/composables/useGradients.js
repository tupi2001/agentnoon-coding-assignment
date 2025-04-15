// src/composables/useGradients.js
export default function useGradients(departmentColors) {
  function createGradients(svgRoot) {
    const defs = svgRoot.append("defs");
    for (const [name, color] of Object.entries(departmentColors)) {
      const id = `gradient-${name.replace(/[^\w-]+/g, "")}`;
      const grad = defs
        .append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      grad.append("stop").attr("offset", "0%").attr("stop-color", "#1e3a8a");

      grad.append("stop").attr("offset", "100%").attr("stop-color", color);
    }
  }

  return { createGradients };
}
