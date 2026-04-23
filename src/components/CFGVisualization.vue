<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
    problemId: { type: Number, required: true },
    testString: { type: String, default: '' }
})

const svgRef = ref(null)

// CFG data — each production groups all alternatives: { lhs, alts: [...] }
const CFG_DATA = {
    1: {
        startSymbol: 'S',
        productions: [
            { lhs: 'S', rhs: ['ABCDEF'] },
            { lhs: 'A', rhs: ['b', 'aa', 'ab'] },
            { lhs: 'B', rhs: ['λ', 'aB', 'bB'] },
            { lhs: 'C', rhs: ['λ', 'bbC', 'abaC', 'abC'] },
            { lhs: 'D', rhs: ['aaa', 'bbb'] },


        ],
        terminals: ['a', 'b', 'λ'],
        nonTerminals: ['S', 'A', 'B', 'C', 'D', 'E', 'F']
    },

    2: {
        startSymbol: 'S',
        productions: [
            { lhs: 'S', alts: ['ABCDEF'] },
            { lhs: 'A', alts: ['0', '1'] },
            { lhs: 'B', alts: ['11', '00', '101', '010'] },
            { lhs: 'C', alts: ['0', '1', '11', '00', '101'] },
            { lhs: 'D', alts: ['11', '00'] },
            { lhs: 'E', alts: ['0', '1'] },
            { lhs: 'F', alts: ['0', '1', '11'] },
        ],
        terminals: ['0', '1'],
        nonTerminals: ['S', 'A', 'B', 'C', 'D', 'E', 'F']
    }
}

const REGEX_MAP = {
  1: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*',
  2: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*'
}

const cfg = computed(() => CFG_DATA[props.problemId] || CFG_DATA[1])
const problemRegex = computed(() => REGEX_MAP[props.problemId])

// Simulation state (like DFA)
const stepIndex = ref(0)
const isRunning = ref(false)
const done = ref(false)
const simResult = ref(null)
const autoTimer = ref(null)


// Processed CFG data - normalize to rhs arrays
const processedCFG = computed(() => {
  const data = cfg.value
  return {
    ...data,
    productions: data.productions.map(p => ({
      lhs: p.lhs,
      rhs: p.rhs || p.alts || []
    }))
  }
})

// CFG Simulation - leftmost derivation with prefix-matching rhs choice
const runCFGSimulation = (input) => {
  if (!input || input === '') return { steps: [], accepted: false }
  
  const g = processedCFG.value
  const steps = []
  
  // Sentential form as array of symbols
  let sentential = [g.startSymbol]
  steps.push({ sentential: [...sentential], usedProd: null, consumed: 0 })
  
  let consumed = 0
  const maxSteps = 50
  
  while (steps.length < maxSteps) {
    // Check done
    const hasNT = sentential.some(s => g.nonTerminals.includes(s))
    const terminalsOnly = sentential.filter(s => !g.nonTerminals.includes(s)).join('')
    if (!hasNT && terminalsOnly === input) {
      return { steps, accepted: true }
    }
    
    // Leftmost NT
    const ntIdx = sentential.findIndex(s => g.nonTerminals.includes(s))
    if (ntIdx === -1) break
    
    const lhs = sentential[ntIdx]
    const prods = g.productions.filter(p => p.lhs === lhs)
    if (prods.length === 0) break
    
    // Choose best rhs: longest prefix match to remaining input, prefer non-ε
    let bestRhs = null
    let bestScore = -1
    for (const p of prods) {
      for (const rhsStr of p.rhs) {
        // Extract terminals from rhs (ignore NTs/λ)
        let rhsTerms = ''
        for (const sym of rhsStr.split('')) {
          if (g.terminals.includes(sym)) rhsTerms += sym
          else if (sym !== 'λ') break // stop at NT
        }
        if (rhsTerms.length > bestScore && input.startsWith(rhsTerms, consumed)) {
          bestScore = rhsTerms.length
          bestRhs = rhsStr
        }
      }
    }
    
    if (bestRhs === null) {
      // Fallback to ε or first if no match
      bestRhs = prods[0].rhs.find(r => !r.includes('λ')) || prods[0].rhs[0]
    }
    
    const rhsSymbols = bestRhs.split('')
    sentential.splice(ntIdx, 1, ...rhsSymbols)
    
    // Advance consumed by matched terminals
    consumed = Math.min(consumed + bestScore, input.length)
    
    steps.push({ 
      sentential: [...sentential], 
      usedProd: `${lhs} → ${bestRhs}`, 
      consumed 
    })
  }
  
  const finalTerminals = sentential.filter(s => !g.nonTerminals.includes(s)).join('')
  const accepted = finalTerminals === input
  
  return { steps, accepted }
}


// Generate a simple derivation tree structure (DEPRECATED - will replace)
const generateDerivationTree = (inputStr, cfgData) => {


    if (!inputStr) return null
    
    const symbols = inputStr.split('')
    
    // Build tree structure
    const root = {
        id: 'root',
        name: cfgData.startSymbol,
        children: []
    }
    
    // Simple recursive derivation (demonstration)
    let currentLevel = [root]
    let symbolIndex = 0
    
    // Limit depth to avoid infinite loops
    let depth = 0
    const maxDepth = 20
    
    while (symbolIndex < symbols.length && depth < maxDepth) {
        const nextLevel = []
        
        for (const node of currentLevel) {
            if (cfgData.nonTerminals.includes(node.name)) {
                // Find a production that can derive this terminal
                const matchingProd = cfgData.productions.find(p => {
                    if (p.lhs !== node.name) return false
                    // Check if RHS contains the current symbol or can lead to it
                    const rhsStr = p.rhs.join('')
                    return rhsStr.includes(symbols[symbolIndex]) || 
                           (cfgData.nonTerminals.some(nt => rhsStr.includes(nt)))
                })
                
                if (matchingProd) {
                    const children = matchingProd.rhs.map((sym, i) => ({
                        id: `${node.id}-${i}`,
                        name: sym,
                        children: cfgData.nonTerminals.includes(sym) ? [] : undefined
                    }))
                    node.children = children
                    nextLevel.push(...children.filter(c => cfgData.nonTerminals.includes(c.name)))
                } else {
                    // Just add the terminal
                    node.children = [{ id: `${node.id}-t`, name: symbols[symbolIndex], children: undefined }]
                    symbolIndex++
                }
            }
        }
        
        currentLevel = nextLevel
        depth++
    }
    
    // Add remaining terminals
    while (symbolIndex < symbols.length) {
        const lastNonTerminal = findLastNonTerminal(root)
        if (lastNonTerminal) {
            lastNonTerminal.children = lastNonTerminal.children || []
            lastNonTerminal.children.push({ 
                id: `${lastNonTerminal.id}-${symbolIndex}`, 
                name: symbols[symbolIndex],
                children: undefined 
            })
        }
        symbolIndex++
    }
    
    return root
}

const findLastNonTerminal = (node) => {
    if (!node.children || node.children.length === 0) {
        return cfg.value.nonTerminals.includes(node.name) ? node : null
    }
    for (let i = node.children.length - 1; i >= 0; i--) {
        const result = findLastNonTerminal(node.children[i])
        if (result) return result
    }
    return null
}

const treeData = computed(() => {
    return generateDerivationTree(props.testString, cfg.value)
})

const renderTree = () => {
    if (!svgRef.value) return
    
    const data = treeData.value
    if (!data) {
        // Just show the grammar when no input
        renderGrammar()
        return
    }
    
    d3.select(svgRef.value).selectAll("*").remove()
    
    const svg = d3.select(svgRef.value)
        .attr("width", "100%")
        .style("overflow", "visible")
    
    // Arrowhead marker
    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", "arrow-cfg")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#666")
    
    const margin = { top: 40, right: 90, bottom: 30, left: 90 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
    
    const tree = d3.tree().size([width, height])
    const root = d3.hierarchy(data)
    
    tree(root)
    
    // Links
    g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#666")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow-cfg)")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        )
    
    // Nodes
    const nodes = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`)
    
    // Node circles
    nodes.append("circle")
        .attr("r", 18)
        .attr("fill", d => {
            const isTerminal = !cfg.value.nonTerminals.includes(d.data.name)
            return isTerminal ? '#4caf50' : '#ff9800'
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
    
    // Node labels
    nodes.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text(d => d.data.name)
    
    // Add viewBox
    svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .style("max-width", "100%")
        .style("height", "auto")
}

const renderGrammar = () => {
    if (!svgRef.value) return
    
    d3.select(svgRef.value).selectAll("*").remove()
    
    const svg = d3.select(svgRef.value)
        .attr("width", "100%")
        .attr("height", "200")
    
    // Grammar is displayed in the template, so just show empty SVG
    svg.append("text")
        .attr("x", 50)
        .attr("y", 100)
        .attr("font-size", "16px")
        .attr("fill", "#666")
        .text("Derivation tree will appear when you test a string")
}

watch(() => props.problemId, () => {
    renderTree()
})

const steps = computed(() => simResult.value ? simResult.value.steps : [])
const currentStep = computed(() => steps.value[stepIndex.value] || steps.value[0])
const resultAccepted = computed(() => done.value && !!simResult.value?.accepted)
const tape = computed(() => {
  if (!props.testString || !simResult.value) return []
  const consumed = currentStep.value?.consumed || 0
  return props.testString.split('').map((ch, i) => ({
    ch,
    status: i < consumed ? 'done' : i === consumed ? 'active' : 'pending'
  }))
})

// Auto-run simulation on testString change (like DFA)
watch(() => props.testString, (newStr) => {
  if (newStr) {
    doReset()
    simResult.value = runCFGSimulation(newStr)
    if (simResult.value.steps.length > 0) {
      isRunning.value = true
      stepIndex.value = 0
      autoTimer.value = setInterval(() => {
        if (stepIndex.value >= 10 || simResult.value?.accepted) { // Max 10 steps or accept
          clearInterval(autoTimer.value)
          autoTimer.value = null
          isRunning.value = false
          done.value = true
          stepIndex.value = Math.min(stepIndex.value, simResult.value.steps.length - 1)
          return
        }
        stepIndex.value++
      }, 800)
    }
  } else {
    doReset()
  }
  renderTree()
})

const doReset = () => {
  clearInterval(autoTimer.value)
  autoTimer.value = null
  isRunning.value = false
  stepIndex.value = 0
  done.value = false
  simResult.value = null
}


onMounted(() => {
    renderTree()
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (autoTimer.value) clearInterval(autoTimer.value)
})

</script>

<template>
  <div class="cfg-container">
    <h3>CFG Visualization (Problem {{ problemId }})</h3>
    <p v-if="problemRegex" class="regex-display"><code>{{ problemRegex }}</code></p>
    
    <!-- Tape -->
    <div v-if="tape.length > 0" class="tape-row">
      <span class="tape-label">Input Tape:</span>
      <div class="tape">
        <span v-for="(cell, i) in tape" :key="i" :class="['tape-cell', cell.status]">
          {{ cell.ch }}
        </span>
      </div>
    </div>
    
    <!-- Current derivation -->
    <div v-if="currentStep" class="state-row">
      <span class="label">Derivation:</span>
      <span class="current-sentential">{{ currentStep.sentential.join(' ') }}</span>
      <span v-if="currentStep.usedProd" class="badge-prod">
        Applied: {{ currentStep.usedProd }}
      </span>
    </div>
    
    <!-- Result banner -->
    <transition name="pop">
      <div v-if="done" :class="['banner', resultAccepted ? 'banner-ok' : 'banner-fail']">
        {{ resultAccepted ? 'String Derived ✓' : 'Not Derived ✗' }}
      </div>
    </transition>
    
    <!-- Production Rules -->
    <div class="grammar-rules">
        <h4>Grammar Rules:</h4>

        <div class="rules-list">
            <div v-for="(prod, idx) in processedCFG.productions" :key="idx" class="production-rule">
                <span class="lhs">{{ prod.lhs }}</span>
                <span class="arrow">→</span>
                <span class="rhs">{{ prod.rhs.join(' | ') }}</span>
            </div>

        </div>
    </div>
    
    <!-- Derivation Tree -->
    <!-- <div class="tree-section">
        <h4>Derivation Tree:</h4>
        <svg ref="svgRef"></svg>
    </div> -->
    
    <!-- Legend -->
    <div class="legend">
        <span class="legend-item">
            <span class="legend-circle non-terminal"></span>
            Non-Terminal
        </span>
        <span class="legend-item">
            <span class="legend-circle terminal"></span>
            Terminal
        </span>
    </div>
  </div>
</template>

<style scoped>
.cfg-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
}

h3 {
    margin: 0;
    color: #222;
}

.regex-display {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1.3rem;
    color: #666;
    font-weight: 500;
}

.regex-display code {
    font-family: monospace;
    color: #0f172a;
    font-size: 1.3rem;
}

.grammar-rules {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    width: fit-content;
}

.rules-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 200px;
    overflow-y: auto;
}

.production-rule {
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.lhs {
    font-weight: bold;
    color: #e65100;
    min-width: 20px;
}

.arrow {
    color: #666;
}

.rhs {
    color: #1565c0;
}

.tree-section {
    background: #fff;
    padding: 0.5rem;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}

.tree-section svg {
    width: 100%;
    min-height: 200px;
}

.legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    padding: 0.5rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.3rem;
    color: #555;
}

.legend-circle {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #ccc;
}

.legend-circle.non-terminal {
    background: #ff9800;
}

.legend-circle.terminal {
    background: #4caf50;
}

/* DFA-like styles */
.tape-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.tape-label { font-size: 1.3rem; font-weight: bold; color: #555; }
.tape { display: flex; gap: 3px; flex-wrap: wrap; }
.tape-cell {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: 2px solid #bbb; border-radius: 5px;
  font-size: 1.1rem; font-weight: bold;
  transition: all 0.25s;
  background: #f9f9f9; color: #999;
}
.tape-cell.done    { background: #c8e6c9; border-color: #4caf50; color: #1b5e20; }
.tape-cell.active  { background: #fff3e0; border-color: #ff9800; color: #e65100; transform: scale(1.15); box-shadow: 0 0 8px #ff980055; }
.tape-cell.pending { background: #f5f5f5; color: #bbb; }

.state-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.label { font-size: 1.3rem; font-weight: bold; color: #555; }
.current-sentential {
  font-family: monospace;
  background: #f0f8ff;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #2196f3;
  font-size: 1.1rem;
  max-width: 400px;
  word-break: break-all;
}
.badge-prod {
  font-size: 1rem;
  background: #fff3e0;
  color: #e65100;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #ff9800;
  font-weight: bold;
}

.banner {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  border: 2px solid transparent;
  margin-bottom: 10px;
}
.banner-ok { background: #e8f5e9; color: #2e7d32; border-color: #4caf50; }
.banner-fail { background: #ffebee; color: #c62828; border-color: #ef5350; }

.pop-enter-active { animation: popIn 0.4s ease; }
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>

