import { ref } from 'vue'
import * as d3 from 'd3'
import Papa from 'papaparse'

const baseRoot = ref(null)

const departmentColors = {
  'Business Intelligence': '#D7263D',
  'Cloud Computing': '#1B9AAA',
  'Customer Support and Success': '#3F784C',
  'Cybersecurity': '#F46036',
  'Data Analytics': '#9D4EDD',
  'Data Science': '#5F0F40',
  'Digital Marketing': '#FFB400',
  'Finance and Accounting': '#007F5F',
  'Human Resources': '#EF476F',
  'Information Technology': '#118AB2',
  'Network Operations': '#06D6A0',
  'Operations and Logistics': '#073B4C',
  'Product Management': '#F72585',
  'Project Management': '#B5179E',
  'Quality Assurance': '#FF9F1C',
  'Sales and Business Development': '#E71D36',
  'Software Development': '#3A0CA3',
  'Systems Administration': '#4361EE',
  'User Experience (UX) Design': '#8338EC',
  'User Interface (UI) Design': '#FF006E',
  'Default': '#8D99AE'
}

// Build the tree from CSV data, including extra fields.
function buildTree(data) {
  const idMap = {}, roots = []

  data.forEach(emp => {
    const department = emp.Department?.trim() || 'Default'
    // Create a node object including extra fields:
    idMap[emp['Employee Id']] = {
      id: emp['Employee Id'],
      name: typeof emp.Name === 'string' ? emp.Name.trim() : 'Unknown',
      title: emp['Job Title']?.trim() || '',
      salary: Number(emp.Salary),
      department,
      email: emp.Email?.trim() || '',           
      status: emp.Status?.trim() || '',           
      performance: emp.Performance?.trim() || '', 
      entity: emp.Entity?.trim() || '',           
      location: emp.Location?.trim() || '',       
      project: emp.Project?.trim() || '',         
      photo: emp.Photo?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.Name || 'User')}&background=1&color=fff`,
      children: [],
      _expanded: false
    }
  })

  data.forEach(emp => {
    const node = idMap[emp['Employee Id']]
    const managerId = emp.Manager
    if (managerId && idMap[managerId]) {
      idMap[managerId].children.push(node)
    } else {
      roots.push(node)
    }
  })

  // If there is only one root, use it, otherwise, create an artificial root.
  const root = roots.length === 1
    ? roots[0]
    : {
        id: 'root',
        name: 'Organization',
        title: '',
        department: 'Default',
        salary: 0,
        email: '',
        status: '',
        performance: '',
        entity: '',
        location: '',
        project: '',
        children: roots,
        _expanded: true
      }

  // Save original children in _children for collapse/expand functionality.
  function preserveOriginalChildren(node) {
    if (node.children?.length > 0) {
      node._children = [...node.children]
      node.children.forEach(preserveOriginalChildren)
    } else {
      node._children = []
    }
  }

  preserveOriginalChildren(root)
  // Optionally collapse the tree: set root.children to null
  root.children = null

  return root
}

// Compute recursive cost and descendant metrics.
function calculateMetrics(hNode, memo = new Map()) {
  const node = hNode.data
  if (memo.has(hNode)) return memo.get(hNode)

  let descendantCount = 0, managementCost = 0, icCost = 0, totalCost = 0

  hNode.children?.forEach(child => {
    const metrics = calculateMetrics(child, memo)
    descendantCount += 1 + metrics.descendantCount
    managementCost += (child.children?.length ? child.data.salary : 0) + metrics.managementCost
    icCost += (child.children?.length ? 0 : child.data.salary) + metrics.icCost
    totalCost += child.data.salary + metrics.totalCost
  })

  const result = {
    descendantCount,
    managementCost,
    icCost,
    totalCost,
    ratio: managementCost > 0 ? icCost / managementCost : 0
  }

  memo.set(hNode, result)
  node.metrics = result
  return result
}

// Filter matching names & ancestors for visible nodes.
function getVisiblePath(root, nameQuery) {
  const matches = []
  root.each(node => {
    if (node.data.name?.toLowerCase().includes(nameQuery.toLowerCase())) {
      matches.push(node)
    }
  })

  const visibleSet = new Set()
  matches.forEach(match => {
    let current = match
    while (current) {
      visibleSet.add(current)
      current = current.parent
    }
  })

  return visibleSet
}

// Load the CSV file and build the tree.
async function loadTree() {
  const res = await fetch('/data/giga_corp_40k.csv')
  const csv = await res.text()
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const treeData = buildTree(parsed.data)

  // Create the hierarchy using the _children accessor.
  baseRoot.value = d3.hierarchy(treeData, d => d._children)
  calculateMetrics(baseRoot.value)
}

// Format numbers.
function format(n) {
  return Number(n).toLocaleString()
}

export default function useOrgTree() {
  return {
    baseRoot,
    departmentColors,
    loadTree,
    calculateMetrics,
    getVisiblePath,
    format
  }
}
export {buildTree, calculateMetrics}
