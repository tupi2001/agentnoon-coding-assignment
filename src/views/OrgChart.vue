<template>
  <div class="w-full h-screen bg-gradient-to-b from-blue-100 via-slate-100 to-white overflow-auto relative">

    <!-- 🔠 Title -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
      <h1 class="text-2xl font-bold text-slate-700 flex items-center gap-2">
        🏢 <span>Organizational Chart</span>
      </h1>
    </div>

    <!-- 🔍 Search -->
    <div class="absolute top-4 right-4 z-50">
      <FilterPanel v-model:query="searchQuery" />
    </div>

    <!-- 🧭 Legend -->
    <div class="absolute top-4 left-4 z-50">
      <DepartmentLegend :departmentColors="departmentColors" v-model:open="legendOpen" />
    </div>

    <!-- 🖼️ Chart Container -->
    <div ref="chartContainer" class="w-full h-screen overflow-auto touch-none select-none">
      <!-- D3 injects <svg> here -->
    </div>

    <!-- 💡 Tooltip -->
    <div
      id="tooltip"
      class="absolute hidden z-50 text-sm text-slate-800 rounded-lg shadow-lg px-4 py-3 pointer-events-none transition-all duration-200 bg-white/90 border-l-4 border-blue-400 max-w-xs"
    ></div>

    <!-- 🧩 Controls -->
    <div class="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
      <button
        @click="autoFitTree"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        🔄 Reset View
      </button>
      <button
        @click="resetView"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
      >
        🧩 Auto-Fit
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import debounce from 'lodash.debounce'

import useOrgTree from '@/composables/useOrgTree'
import useChartRenderer from '@/composables/useChartRenderer'

import FilterPanel from '@/components/FilterPanel.vue'
import DepartmentLegend from '@/components/DepartmentLegend.vue'

// State refs
const chartContainer = ref(null)
const searchQuery = ref('')
const debouncedSearch = ref('')
const legendOpen = ref(true)

// Org chart logic
const {
  baseRoot,
  departmentColors,
  loadTree,
  getVisiblePath,
  format
} = useOrgTree()

// Chart rendering
const {
  renderChart,
  resetView,
  autoFitTree
} = useChartRenderer({
  chartContainer,
  departmentColors,
  baseRoot,
  format,
  getVisiblePath,
  debouncedSearch
})

// Debounce user input
watch(searchQuery, debounce(val => {
  debouncedSearch.value = val
}, 300))

// Redraw on search
watch(debouncedSearch, () => {
  renderChart()
})

// Load and render once DOM is ready
onMounted(async () => {
  await loadTree()
  await nextTick()
  requestAnimationFrame(() => {
    renderChart()
  })
})
</script>

<style scoped>

</style>
