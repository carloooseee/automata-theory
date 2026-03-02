<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  problemId: { type: Number, required: true }, // 1 or 2
})

// ─── DFA definitions (problemId 1 → key 0, problemId 2 → key 1) ──────────────
const DFA_CONFIGS = {
  1: {
    label: 'Problem 1',
    alphabet: ['a', 'b'],
    states: {
      q0: { label: 'q₀', x: 80,  y: 200 },
      q1: { label: 'q₁', x: 230, y: 110 },
      q2: { label: 'q₂', x: 380, y: 110 },
      q3: { label: 'q₃', x: 230, y: 290 },
      q4: { label: 'q₄', x: 380, y: 290 },
      q5: { label: 'q₅', x: 520, y: 200 },
    },
    start: 'q0',
    accept: ['q5'],
    transitions: {
      q0: { a: 'q1', b: 'q3' },
      q1: { a: 'q2', b: 'q3' },
      q2: { a: 'q5', b: 'q4' },
      q3: { a: 'q1', b: 'q5' },
      q4: { a: 'q2', b: 'q3' },
      q5: { a: 'q5', b: 'q5' },
    },
  },
  2: {
    label: 'Problem 2',
    alphabet: ['0', '1'],
    states: {
      r0: { label: 'r₀', x: 80,  y: 200 },
      r1: { label: 'r₁', x: 280, y: 100 },
      r2: { label: 'r₂', x: 280, y: 300 },
    },
    start: 'r0',
    accept: ['r0'],
    transitions: {
      r0: { '0': 'r0', '1': 'r1' },
      r1: { '0': 'r2', '1': 'r0' },
      r2: { '0': 'r1', '1': 'r2' },
    },
  },
}

// ─── State ────────────────────────────────────────────────────────────────────
const svgRef     = ref(null)
const inputStr   = ref('')
const stepIndex  = ref(0)
const simResult  = ref(null)   // { steps, accepted }
const isRunning  = ref(false)
const done       = ref(false)
const activeEdge = ref(null)   // 'srcId-tgtId'
const tracerKey  = ref(0)
const autoTimer  = ref(null)

// Mutable D3 refs
let _svg     = null
let _tracerG = null
let _pathMap = {}  // 'srcId-tgtId' → SVGPathElement

// ─── Computed ─────────────────────────────────────────────────────────────────
const dfa = computed(() => DFA_CONFIGS[props.problemId])

const steps = computed(() =>
  simResult.value
    ? simResult.value.steps
    : [{ state: dfa.value.start, charIndex: -1, char: null }]
)

const currentStep = computed(() =>
  steps.value[stepIndex.value] || steps.value[steps.value.length - 1]
)

const currentState = computed(() => currentStep.value?.state ?? null)
const currentCharIdx = computed(() =>
  simResult.value ? (steps.value[stepIndex.value]?.charIndex ?? -1) : -1
)

const resultAccepted = computed(() => done.value && !!simResult.value?.accepted)
const resultRejected = computed(() => done.value && !simResult.value?.accepted)

const tracerColor = computed(() =>
  done.value
    ? (resultAccepted.value ? '#22c55e' : '#ef4444')
    : '#f59e0b'
)

const tape = computed(() => {
  if (!inputStr.value) return []
  return inputStr.value.split('').map((ch, i) => {
    const idx = currentCharIdx.value
    if (!simResult.value) return { ch, status: 'pending' }
    if (i < idx)  return { ch, status: 'done' }
    if (i === idx) return { ch, status: 'active' }
    return { ch, status: 'pending' }
  })
})

// ─── Simulation logic ─────────────────────────────────────────────────────────
const runSimulation = (input) => {
  const d = dfa.value
  const stepsList = [{ state: d.start, charIndex: -1, char: null }]
  let current = d.start
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = d.transitions[current]?.[ch]
    if (next === undefined) {
      stepsList.push({ state: null, charIndex: i, char: ch, dead: true })
      return { steps: stepsList, accepted: false }
    }
    current = next
    stepsList.push({ state: current, charIndex: i, char: ch })
  }
  return { steps: stepsList, accepted: d.accept.includes(current) }
}

const initSim = () => {
  const result = runSimulation(inputStr.value)
  simResult.value = result
  return result
}

const advance = (result, idx) => {
  const from = result.steps[idx].state
  const to   = result.steps[idx + 1]?.state
  activeEdge.value = (from && to) ? `${from}-${to}` : null
  tracerKey.value++
  stepIndex.value = idx + 1

  // Draw tracer
  if (from && to) {
    drawTracer(from, to, tracerColor.value)
    highlightEdge(from, to, tracerColor.value)
  }
  if (to) highlightNode(to, tracerColor.value)
  else if (!to && from) highlightNode(from, '#ef4444') // dead state

  if (idx + 1 >= result.steps.length - 1) done.value = true
}

const goNext = () => {
  const result = simResult.value || initSim()
  if (stepIndex.value >= result.steps.length - 1) { done.value = true; return }
  advance(result, stepIndex.value)
}

const runAuto = () => {
  const result = simResult.value || initSim()
  isRunning.value = true
  let idx = stepIndex.value
  const max = result.steps.length - 1
  autoTimer.value = setInterval(() => {
    if (idx >= max) {
      clearInterval(autoTimer.value)
      autoTimer.value = null
      isRunning.value = false
      done.value = true
      return
    }
    advance(result, idx)
    idx++
    if (idx >= max) {
      clearInterval(autoTimer.value)
      autoTimer.value = null
      isRunning.value = false
      done.value = true
    }
  }, 800)
}

const doReset = () => {
  clearInterval(autoTimer.value)
  autoTimer.value = null
  isRunning.value = false
  stepIndex.value = 0
  done.value      = false
  activeEdge.value = null
  simResult.value  = null
  tracerKey.value++
  clearHighlights()
  // Highlight start node
  if (_svg) highlightNode(dfa.value.start, '#f59e0b')
}

// ─── D3 render ────────────────────────────────────────────────────────────────
const buildEdges = () => {
  const edges = []
  const seen  = new Set()
  const d = dfa.value
  for (const [src, map] of Object.entries(d.transitions)) {
    const grouped = {}
    for (const [ch, tgt] of Object.entries(map)) {
      grouped[tgt] = grouped[tgt] ? `${grouped[tgt]},${ch}` : ch
    }
    for (const [tgt, label] of Object.entries(grouped)) {
      const key = `${src}-${tgt}`
      if (!seen.has(key)) { seen.add(key); edges.push({ src, tgt, label, key }) }
    }
  }
  return edges
}

const edgePath = (src, tgt) => {
  const states = dfa.value.states
  const s = states[src], t = states[tgt]
  if (!s || !t) return ''
  if (src === tgt) {
    return `M${s.x - 12},${s.y - 22} C${s.x - 40},${s.y - 80} ${s.x + 40},${s.y - 80} ${s.x + 12},${s.y - 22}`
  }
  const dx = t.x - s.x, dy = t.y - s.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = -dy / len, ny = dx / len
  const bend = len * 0.3
  const ex = t.x - (dx / len) * 26
  const ey = t.y - (dy / len) * 26
  return `M${s.x},${s.y} Q${(s.x + t.x) / 2 + nx * bend},${(s.y + t.y) / 2 + ny * bend} ${ex},${ey}`
}

const edgeLabelPos = (src, tgt) => {
  const states = dfa.value.states
  const s = states[src], t = states[tgt]
  if (!s || !t) return { x: 0, y: 0 }
  if (src === tgt) return { x: s.x, y: s.y - 84 }
  const dx = t.x - s.x, dy = t.y - s.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = -dy / len, ny = dx / len
  return { x: (s.x + t.x) / 2 + nx * len * 0.18, y: (s.y + t.y) / 2 + ny * len * 0.18 - 4 }
}

const renderDFA = () => {
  if (!svgRef.value) return
  _pathMap = {}
  d3.select(svgRef.value).selectAll('*').remove()

  const d      = dfa.value
  const states = d.states
  const edges  = buildEdges()

  const xs = Object.values(states).map(s => s.x)
  const ys = Object.values(states).map(s => s.y)
  const pad = 60
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const w    = Math.max(...xs) - Math.min(...xs) + pad * 2
  const h    = Math.max(...ys) - Math.min(...ys) + pad * 2

  const svg = d3.select(svgRef.value)
    .attr('width', '100%')
    .attr('viewBox', `${minX} ${minY} ${w + pad} ${h}`)
    .attr('height', h)
    .style('overflow', 'visible')
  _svg = svg

  // Markers
  const defs = svg.append('defs')
  ;[
    { id: 'arr-dim',   c: '#aaa'    },
    { id: 'arr-amber', c: '#f59e0b' },
    { id: 'arr-green', c: '#22c55e' },
    { id: 'arr-red',   c: '#ef4444' },
  ].forEach(({ id, c }) => {
    defs.append('marker')
      .attr('id', id).attr('viewBox', '0 -5 10 10')
      .attr('refX', 22).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', c)
  })

  // Start arrow
  const startState = states[d.start]
  svg.append('line')
    .attr('x1', startState.x - 44).attr('y1', startState.y)
    .attr('x2', startState.x - 24).attr('y2', startState.y)
    .attr('stroke', '#999').attr('stroke-width', 2)
    .attr('marker-end', 'url(#arr-dim)')

  // Edge base layer
  const edgeG = svg.append('g')

  const linkSel = edgeG.selectAll('path.edge-base')
    .data(edges)
    .join('path')
    .attr('class', d => `edge-base`)
    .attr('fill', 'none')
    .attr('stroke', '#aaa')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arr-dim)')
    .attr('d', d => edgePath(d.src, d.tgt))

  edgeG.selectAll('text.edge-label')
    .data(edges)
    .join('text')
    .attr('class', 'edge-label')
    .text(d => d.label)
    .attr('font-size', '11px')
    .attr('fill', '#555')
    .attr('text-anchor', 'middle')
    .each(function (d) {
      const lp = edgeLabelPos(d.src, d.tgt)
      d3.select(this).attr('x', lp.x).attr('y', lp.y)
    })

  // Tracer layer
  _tracerG = svg.append('g').attr('class', 'tracer-layer')

  // Node layer
  const nodeG = svg.append('g')

  nodeG.selectAll('circle.node-outer')
    .data(Object.entries(states).filter(([id]) => d.accept.includes(id)))
    .join('circle')
    .attr('class', 'node-outer')
    .attr('cx', ([, s]) => s.x).attr('cy', ([, s]) => s.y)
    .attr('r', 26).attr('fill', 'none')
    .attr('stroke', '#4caf50').attr('stroke-width', 1.5)

  nodeG.selectAll('circle.node-bg')
    .data(Object.entries(states))
    .join('circle')
    .attr('class', ([id]) => `node-bg node-${id}`)
    .attr('cx', ([, s]) => s.x).attr('cy', ([, s]) => s.y).attr('r', 20)
    .attr('fill', ([id]) => d.accept.includes(id) ? '#4caf50' : id === d.start ? '#ff9800' : '#2196f3')
    .attr('stroke', '#fff').attr('stroke-width', 1.5)

  nodeG.selectAll('text.node-label')
    .data(Object.entries(states))
    .join('text')
    .attr('class', 'node-label')
    .text(([, s]) => s.label)
    .attr('x', ([, s]) => s.x).attr('y', ([, s]) => s.y + 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px').attr('font-weight', 'bold')
    .attr('fill', 'white').attr('pointer-events', 'none')

  // Store path elements for tracer
  linkSel.each(function (d) { _pathMap[`${d.src}-${d.tgt}`] = this })

  // Highlight start node on initial render
  highlightNode(d.start, '#f59e0b')
}

// ─── Arrow tracer (same as React ArrowTracer) ─────────────────────────────────
const drawTracer = (srcId, tgtId, color) => {
  if (!_tracerG) return
  _tracerG.selectAll('*').remove()

  const baseEl = _pathMap[`${srcId}-${tgtId}`]
  if (!baseEl) return

  const d_attr = baseEl.getAttribute('d')
  const len    = baseEl.getTotalLength()
  if (!len) return

  const dur     = `${Math.max(0.32, len / 380)}s`
  const dashLen = Math.max(len * 0.28, 14)
  const key     = tracerKey.value

  // Glow trail
  _tracerG.append('path')
    .attr('d', d_attr).attr('fill', 'none')
    .attr('stroke', color).attr('stroke-width', 5)
    .attr('stroke-opacity', 0.2).attr('stroke-linecap', 'round')

  // Racing dash
  const dash = _tracerG.append('path')
    .attr('d', d_attr).attr('fill', 'none')
    .attr('stroke', color).attr('stroke-width', 3)
    .attr('stroke-linecap', 'round')
    .attr('stroke-dasharray', `${dashLen} ${len + dashLen}`)
    .attr('stroke-dashoffset', len + dashLen)
    .style('filter', `drop-shadow(0 0 5px ${color})`)

  dash.append('animate')
    .attr('attributeName', 'stroke-dashoffset')
    .attr('from', len + dashLen).attr('to', -dashLen)
    .attr('dur', dur).attr('fill', 'freeze')
    .attr('calcMode', 'spline').attr('keySplines', '0.4 0 0.2 1')

  // Leading dot via animateMotion
  const mpId = `mp-${key}`
  _tracerG.append('path').attr('id', mpId).attr('d', d_attr)
    .attr('fill', 'none').attr('stroke', 'none')

  const dot = _tracerG.append('circle').attr('r', 5).attr('fill', color)
    .style('filter', `drop-shadow(0 0 7px ${color})`)

  const motion = dot.append('animateMotion')
    .attr('dur', dur).attr('fill', 'freeze')
    .attr('calcMode', 'spline').attr('keySplines', '0.4 0 0.2 1')
  motion.append('mpath').attr('href', `#${mpId}`)

  dot.append('animate')
    .attr('attributeName', 'opacity')
    .attr('values', '0;1;1;0').attr('keyTimes', '0;0.05;0.85;1')
    .attr('dur', dur).attr('fill', 'freeze')
}

// ─── Highlight helpers ────────────────────────────────────────────────────────
const highlightNode = (nodeId, color) => {
  if (!_svg) return
  _svg.selectAll('circle.node-bg')
    .attr('stroke', ([id]) => id === nodeId ? color : '#fff')
    .attr('stroke-width', ([id]) => id === nodeId ? 3.5 : 1.5)
    .style('filter', ([id]) => id === nodeId ? `drop-shadow(0 0 8px ${color})` : null)
}

const highlightEdge = (srcId, tgtId, color) => {
  if (!_svg) return
  const markId = color === '#22c55e' ? 'arr-green'
               : color === '#ef4444' ? 'arr-red'
               : 'arr-amber'
  _svg.selectAll('path.edge-base')
    .attr('stroke', d => d.src === srcId && d.tgt === tgtId ? color : '#aaa')
    .attr('stroke-width', d => d.src === srcId && d.tgt === tgtId ? 2.5 : 1.5)
    .attr('marker-end', d =>
      d.src === srcId && d.tgt === tgtId ? `url(#${markId})` : 'url(#arr-dim)'
    )
}

const clearHighlights = () => {
  if (!_svg) return
  _svg.selectAll('circle.node-bg').attr('stroke', '#fff').attr('stroke-width', 1.5).style('filter', null)
  _svg.selectAll('path.edge-base').attr('stroke', '#aaa').attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-dim)')
  _tracerG?.selectAll('*').remove()
}

// ─── Watchers + lifecycle ─────────────────────────────────────────────────────
watch(() => props.problemId, () => {
  doReset()
  renderDFA()
})

watch(inputStr, () => doReset())

onMounted(() => renderDFA())
onUnmounted(() => clearInterval(autoTimer.value))
</script>

<template>
  <div class="dfa-container">
    <h3>DFA Visualization (Problem {{ problemId }})</h3>

    <!-- Input field -->
    <div class="input-row">
      <input
        v-model="inputStr"
        :placeholder="`Enter string over {${dfa.alphabet.join(',')}}`"
        class="input-field"
      />
    </div>

    <!-- Tape -->
    <div v-if="tape.length > 0" class="tape-row">
      <span class="tape-label">Tape:</span>
      <div class="tape">
        <span
          v-for="(cell, i) in tape"
          :key="i"
          :class="['tape-cell', cell.status]"
        >{{ cell.ch }}</span>
      </div>
    </div>

    <!-- Current state indicator -->
    <div v-if="simResult && currentState" class="state-row">
      <span class="label">State:</span>
      <span :class="['badge-state', done ? (resultAccepted ? 'ok' : 'fail') : 'active']">
        {{ currentState }}
      </span>
      <span v-if="currentStep?.char != null" class="badge-char">
        Read: <strong>{{ currentStep.char }}</strong>
      </span>
    </div>

    <!-- Result banner -->
    <transition name="pop">
      <div v-if="done" :class="['banner', resultAccepted ? 'banner-ok' : 'banner-fail']">
        {{ resultAccepted ? 'String Accepted' : 'String Rejected' }}
      </div>
    </transition>

    <!-- Controls -->
    <div class="btn-row">
      <button @click="goNext"  :disabled="done || isRunning" class="btn btn-next">⏭ Next</button>
      <button @click="runAuto" :disabled="done || isRunning" class="btn btn-auto">⚡ Auto</button>
      <button @click="doReset" class="btn btn-reset">🔄 Reset</button>
    </div>

    <!-- SVG diagram -->
    <svg ref="svgRef"></svg>

    <!-- Breadcrumb trace -->
    <div v-if="simResult" class="trace-log">
      <div
        v-for="(step, i) in steps.slice(0, stepIndex + 1)"
        :key="i"
        :class="['trace-row', i === stepIndex ? 'trace-current' : '']"
      >
        <span class="t-step">Step {{ i }}</span>
        <span class="t-char">{{ i === 0 ? '(initial)' : `read '${step.char}'` }}</span>
        <span :class="['t-state', step.dead ? 't-dead' : '']">→ {{ step.state ?? 'DEAD' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dfa-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem;
  font-family: 'Segoe UI', sans-serif;
  overflow-x: auto;
}

h3 { margin: 0; color: #222; font-size: 1.1rem; }

/* Input */
.input-row { display: flex; gap: 8px; width: 100%; max-width: 480px; }
.input-field {
  flex: 1;
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
}
.input-field:focus { border-color: #2196f3; }

/* Tape */
.tape-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tape-label { font-size: 0.85rem; font-weight: bold; color: #555; }
.tape { display: flex; gap: 3px; flex-wrap: wrap; }
.tape-cell {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: 2px solid #bbb; border-radius: 5px;
  font-size: 1rem; font-weight: bold;
  transition: all 0.25s;
  background: #f9f9f9; color: #999;
}
.tape-cell.done    { background: #c8e6c9; border-color: #4caf50; color: #1b5e20; }
.tape-cell.active  { background: #fff3e0; border-color: #ff9800; color: #e65100; transform: scale(1.15); box-shadow: 0 0 8px #ff980055; }
.tape-cell.pending { background: #f5f5f5; color: #bbb; }

/* State row */
.state-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.label { font-size: 0.85rem; font-weight: bold; color: #555; }
.badge-state { padding: 4px 14px; border-radius: 20px; font-weight: bold; font-size: 0.88rem; border: 2px solid transparent; transition: all 0.3s; }
.badge-state.active { background: #e3f2fd; color: #1565c0; border-color: #2196f3; }
.badge-state.ok     { background: #e8f5e9; color: #2e7d32; border-color: #4caf50; }
.badge-state.fail   { background: #ffebee; color: #c62828; border-color: #ef5350; }
.badge-char { font-size: 0.85rem; color: #555; background: #fff8e1; padding: 3px 10px; border-radius: 12px; border: 1px solid #ffe082; }

/* Banner */
.banner { padding: 10px 20px; border-radius: 8px; font-size: 1rem; font-weight: bold; text-align: center; border: 2px solid transparent; }
.banner-ok   { background: #e8f5e9; color: #2e7d32; border-color: #4caf50; }
.banner-fail { background: #ffebee; color: #c62828; border-color: #ef5350; }

/* Buttons */
.btn-row { display: flex; gap: 8px; width: 100%; max-width: 360px; }
.btn {
  flex: 1; padding: 9px 0;
  font-size: 0.92rem; font-weight: bold;
  border: none; border-radius: 8px; cursor: pointer;
  transition: filter 0.2s, opacity 0.2s;
}
.btn:disabled { opacity: 0.38; cursor: not-allowed; }
.btn:not(:disabled):hover { filter: brightness(0.9); }
.btn-next  { background: #1976d2; color: #fff; }
.btn-auto  { background: #388e3c; color: #fff; }
.btn-reset { background: #e0e0e0; color: #333; }

/* Trace log */
.trace-log {
  width: 100%; max-width: 480px;
  max-height: 150px; overflow-y: auto;
  border: 1px solid #e0e0e0; border-radius: 8px;
  padding: 6px 10px; background: #fafafa;
  display: flex; flex-direction: column; gap: 2px;
}
.trace-row { display: flex; gap: 12px; font-size: 0.8rem; padding: 3px 6px; border-radius: 4px; }
.trace-current { background: #fff9c4; font-weight: bold; }
.t-step  { color: #aaa; min-width: 50px; }
.t-char  { color: #555; min-width: 80px; }
.t-state { color: #1565c0; }
.t-dead  { color: #c62828 !important; }

/* Banner animation */
.pop-enter-active { animation: popIn 0.3s ease; }
.pop-leave-active { transition: opacity 0.2s; }
.pop-leave-to     { opacity: 0; }
@keyframes popIn {
  from { transform: scale(0.88); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
</style>