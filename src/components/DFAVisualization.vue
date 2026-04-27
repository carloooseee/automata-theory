<script setup>
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
    problemId: { type: Number, required: true },
    testString: { type: String, default: '' },
    simKey: { type: Number, default: 0 }
})

const svgRef = ref(null)
const stepIndex = ref(0)
const isRunning = ref(false)
const done = ref(false)
const simResult = ref(null)
const autoTimer = ref(null)

const DFA_CONFIGS = {
  1: {
    start: 'q0',
    accept: ['q8'],
    nodes: [
      { id: 'q0', label: '-', type: 'start', fx: 0, fy: 0 },
      { id: 'q1', label: '', type: 'state', fx: 150, fy: -80 },
      { id: 'q2', label: '', type: 'state', fx: 150, fy: 80 },
      { id: 'q3', label: '', type: 'state', fx: 300, fy: -80 },
      { id: 'q4', label: '', type: 'state', fx: 450, fy: -80 },
      { id: 'q5', label: '', type: 'state', fx: 300, fy: 80 },
      { id: 'q6', label: '', type: 'state', fx: 450, fy: 80 },
      { id: 'q7', label: '', type: 'state', fx: 600, fy: 0 },
      { id: 'q8', label: '+', type: 'accept', fx: 750, fy: 0 }
    ],
    links: [
      { source: 'q0', target: 'q1', label: 'a' },
      { source: 'q0', target: 'q2', label: 'b' },
      { source: 'q1', target: 'q2', label: 'a', curve: 1, sweep: 0},
      { source: 'q1', target: 'q2', label: 'b', curve: 1, sweep: 1},
      { source: 'q2', target: 'q3', label: 'a' },
      { source: 'q2', target: 'q5', label: 'b' },
      { source: 'q3', target: 'q4', label: 'a' },
      { source: 'q3', target: 'q5', label: 'b', curve: 1, sweep: 0 },
      { source: 'q4', target: 'q7', label: 'a' },
      { source: 'q4', target: 'q5', label: 'b' },
      { source: 'q5', target: 'q3', label: 'a' },
      { source: 'q5', target: 'q6', label: 'b' },
      { source: 'q6', target: 'q3', label: 'a' },
      { source: 'q6', target: 'q7', label: 'b' },
      { source: 'q7', target: 'q8', label: 'a', curve: 1, sweep: 0},
      { source: 'q7', target: 'q8', label: 'b', curve: 1, sweep: 1},
      { source: 'q8', target: 'q8', label: 'a, b' }
    ],
    transitions: {
      q0: { a: 'q1', b: 'q2' },
      q1: { a: 'q2', b: 'q2' },
      q2: { a: 'q3', b: 'q5' },
      q3: { a: 'q4', b: 'q5' },
      q4: { a: 'q7', b: 'q5' },
      q5: { a: 'q3', b: 'q6' },
      q6: { a: 'q3', b: 'q7' },
      q7: { a: 'q8', b: 'q8' },
      q8: { a: 'q8', b: 'q8' }
    }
  },
  2: {
    start: 'p0',
    accept: ['p9'],
    nodes: [
      { id: 'p0', label: '-', type: 'start', fx: 0, fy: 0 },
      { id: 'p1', label: '', type: 'state', fx: 150, fy: -100 },
      { id: 'p2', label: '', type: 'state', fx: 150, fy: 100 },
      { id: 'p3', label: '', type: 'state', fx: 300, fy: -150 },
      { id: 'p4', label: '', type: 'state', fx: 300, fy: 100 },
      { id: 'p5', label: '', type: 'state', fx: 450, fy: 0 },
      { id: 'p6', label: '', type: 'state', fx: 600, fy: -80 },
      { id: 'p7', label: '', type: 'state', fx: 600, fy: 80 },
      { id: 'p8', label: '', type: 'state', fx: 750, fy: 0 },
      { id: 'p9', label: '+', type: 'accept', fx: 900, fy: 0 }
    ],
    links: [
      { source: 'p0', target: 'p1', label: '0' },
      { source: 'p0', target: 'p2', label: '1' },
      { source: 'p1', target: 'p5', label: '0' , curve:2, sweep: 0},
      { source: 'p1', target: 'p3', label: '1' },
      { source: 'p2', target: 'p4', label: '0' },
      { source: 'p2', target: 'p5', label: '1' },
      { source: 'p3', target: 'p5', label: '0', curve: 1, sweep: 0 },
      { source: 'p3', target: 'p5', label: '1', curve: 1, sweep: 1},
      { source: 'p4', target: 'p5', label: '0', curve: 1, sweep: 0 },
      { source: 'p4', target: 'p5', label: '1', curve: 1, sweep: 1 },
      { source: 'p5', target: 'p6', label: '0' },
      { source: 'p5', target: 'p7', label: '1' },
      { source: 'p6', target: 'p8', label: '0' },
      { source: 'p6', target: 'p7', label: '1' , curve: 1, sweep: 0},
      { source: 'p7', target: 'p6', label: '0' },
      { source: 'p7', target: 'p8', label: '1' },
      { source: 'p8', target: 'p9', label: '0', curve: 1, sweep: 0 },
      { source: 'p8', target: 'p9', label: '1', curve: 1, sweep: 1 },
      { source: 'p9', target: 'p9', label: '0, 1' }
    ],
    transitions: {
      p0: { '0': 'p1', '1': 'p2' },
      p1: { '0': 'p5', '1': 'p3' },
      p2: { '0': 'p4', '1': 'p5' },
      p3: { '0': 'p5', '1': 'p5' },
      p4: { '0': 'p5', '1': 'p5' },
      p5: { '0': 'p6', '1': 'p7' },
      p6: { '0': 'p8', '1': 'p7' },
      p7: { '0': 'p6', '1': 'p8' },
      p8: { '0': 'p9', '1': 'p9' },
      p9: { '0': 'p9', '1': 'p9' }
    }
  }
}

const REGEX_MAP = {
  1: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*',
  2: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*'
}

const dfa = computed(() => DFA_CONFIGS[props.problemId])
const problemRegex = computed(() => REGEX_MAP[props.problemId])

const steps = computed(() =>
  simResult.value ? simResult.value.steps : [{ state: dfa.value.start, charIndex: -1, char: null }]
)

const currentStep = computed(() => steps.value[stepIndex.value] || steps.value[steps.value.length - 1])
const currentState = computed(() => currentStep.value?.state ?? null)
const currentCharIdx = computed(() => simResult.value ? (steps.value[stepIndex.value]?.charIndex ?? -1) : -1)

const resultAccepted = computed(() => done.value && !!simResult.value?.accepted)

const isValidInput = computed(() => {
    if (props.testString === null || props.testString === undefined) return false;
    const result = runSimulation(props.testString)
    return result.accepted
})

const tape = computed(() => {
  if (!props.testString) return []
  return props.testString.split('').map((ch, i) => {
    const idx = currentCharIdx.value
    if (!simResult.value) return { ch, status: 'pending' }
    if (i < idx) return { ch, status: 'done' }
    if (i === idx) return { ch, status: 'active' }
    return { ch, status: 'pending' }
  })
})

const runSimulation = (input) => {
  const d = dfa.value
  const stepsList = [{ state: d.start, charIndex: -1, char: null }]
  let current = d.start
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    let next = d.transitions[current]?.[ch]
    
    // Handle split transitions string like "0, 1"
    if (!next) {
        for (const [key, val] of Object.entries(d.transitions[current])) {
            if (key.includes(ch)) next = val;
        }
    }
    
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
  const result = runSimulation(props.testString)
  simResult.value = result
  return result
}

const highlightElements = (fromId, toId) => {
    d3.select(svgRef.value).selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 1.5).style('filter', null);
    d3.select(svgRef.value).selectAll('path.edge').attr('stroke', 'black').attr('stroke-width', 2);
    
    const isAccepted = resultAccepted.value;
    const isDone = done.value;
    const color = isDone ? (isAccepted ? '#22c55e' : '#ef4444') : '#f59e0b';
    
    if (toId) {
        d3.select(svgRef.value).select(`#node-${toId}`)
          .attr('stroke', color)
          .attr('stroke-width', 3.5)
          .style('filter', `drop-shadow(0 0 8px ${color})`);
    } else if (fromId && !toId) {
        // Dead state highlight previous node red
        d3.select(svgRef.value).select(`#node-${fromId}`)
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 3.5)
          .style('filter', `drop-shadow(0 0 8px #ef4444)`);
    }
    
    if (fromId && toId) {
        // Highlight all lines belonging to the correct char index (there might be multiple chars)
        const char = currentStep.value?.char;
        if (char) {
            const specificLink = d3.select(svgRef.value).select(`#link-${fromId}-${toId}-${char}`);
            if (!specificLink.empty()) {
                specificLink.attr('stroke', color).attr('stroke-width', 3);
            } else {
                d3.select(svgRef.value).select(`#link-${fromId}-${toId}`).attr('stroke', color).attr('stroke-width', 3);
            }
        } else {
            d3.select(svgRef.value).select(`path[id^="link-${fromId}-${toId}"]`).attr('stroke', color).attr('stroke-width', 3);
        }
    }
}

const advance = (result, idx) => {
  const from = result.steps[idx].state
  const to = result.steps[idx + 1]?.state
  stepIndex.value = idx + 1
  
  highlightElements(from, to)

  if (idx + 1 >= result.steps.length - 1) done.value = true
}

const runAuto = () => {
  if (props.testString === null || props.testString === undefined) return;
  doReset();
  const result = initSim()
  isRunning.value = true
  let idx = 0
  stepIndex.value = 0
  done.value = false
  
  highlightElements(null, result.steps[0].state)
  
  const max = result.steps.length - 1
  autoTimer.value = setInterval(() => {
    if (idx >= max) {
      clearInterval(autoTimer.value)
      autoTimer.value = null
      isRunning.value = false
      done.value = true
      // Trigger final highlight update
      highlightElements(null, result.steps[max].state)
      return
    }
    advance(result, idx)
    idx++
  }, 800)
}

const doReset = () => {
  clearInterval(autoTimer.value)
  autoTimer.value = null
  isRunning.value = false
  stepIndex.value = 0
  done.value = false
  simResult.value = null
  
  if (svgRef.value) {
      d3.select(svgRef.value).selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 1.5).style('filter', null);
      d3.select(svgRef.value).selectAll('path.edge').attr('stroke', 'black').attr('stroke-width', 2);
  }
}

const renderDFA = () => {
    if (!svgRef.value) return;
    
    const data = dfa.value;
    d3.select(svgRef.value).selectAll("*").remove();

    const svg = d3.select(svgRef.value).style("overflow", "hidden"); 

    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#000");

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id));

    const linkGroup = svg.append("g")
    const link = linkGroup.selectAll("path")
        .data(data.links)
        .join("path")
        .attr("class", "edge")
        .attr("id", d => `link-${d.source.id ?? d.source}-${d.target.id ?? d.target}-${d.label}`)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    const linkLabel = svg.append("g").selectAll("text")
        .data(data.links).join("text").text(d => d.label)
        .attr("font-size", "16px")
        .attr("fill", "#e63946")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        // Create the white background aura effect using stroke
        .style("paint-order", "stroke")
        .style("stroke", "#ffffff")
        .style("stroke-width", "5px")
        .style("stroke-linejoin", "round");

    const nodeGroup = svg.append("g")
    const node = nodeGroup.selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("id", d => `node-${d.id}`)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("r", 20)
        .attr("fill", d => d.type === 'accept' ? '#4caf50' : (d.type === 'start' ? '#ff9800' : '#2196f3'));

    const label = svg.append("g").selectAll("text")
        .data(data.nodes).join("text").text(d => d.label)
        .attr("dy", d => (d.label === '-' || d.label === '+') ? 8 : 5)
        .attr("text-anchor", "middle")
        .attr("font-size", d => (d.label === '-' || d.label === '+') ? "28px" : "14px")
        .attr("pointer-events", "none")
        .attr("fill", "white").attr("font-weight", "bold");

    simulation.tick(300);

link.attr("d", d => {
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    
    // 1. Handle Self-Loops (Already working, but kept for context)
    if (d.source === d.target) {
        const size = d.curve ? 20 * d.curve : 20;
        const yOffset = d.curve ? 18 + (d.curve - 1)*20 : 18;
        return `M${d.source.x - 10},${d.source.y - yOffset} A ${size} ${size} 0 1 1 ${d.source.x + 10},${d.source.y - yOffset}`;
    }

    // 2. Calculate Distance
    let dr = Math.sqrt(dx * dx + dy * dy);
    
    // 3. Determine Sweep (Direction of the curve)
    // If d.sweep is provided (0 or 1), use it. 
    // Otherwise, use your ID-based direction logic.
    let finalSweep;
    if (d.sweep !== undefined) {
        finalSweep = d.sweep;
    } else {
        const sourceNum = parseInt((d.source.id ?? d.source).replace(/\D/g, '')) || 0;
        const targetNum = parseInt((d.target.id ?? d.target).replace(/\D/g, '')) || 0;
        finalSweep = sourceNum < targetNum ? 1 : 0;
    }

    // 4. Determine Radius (Intensity of the curve)
    // If d.curve is a huge number (like 50000), it makes the line straight.
    // Otherwise, we apply the multiplier to the distance.
    if (d.curve && d.curve > 1000) {
        // High curve value = Straight line
        return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
    } else {
        // Standard curved arc
        dr = dr * (d.curve || 1.3);
        return `M${d.source.x},${d.source.y} A ${dr} ${dr} 0 0 ${finalSweep} ${d.target.x},${d.target.y}`;
    }
});

    linkLabel
        .attr("x", d => {
            if (d.source === d.target) return d.source.x;
            return link.nodes()[data.links.indexOf(d)].getPointAtLength(0.5 * link.nodes()[data.links.indexOf(d)].getTotalLength()).x;
        })
        .attr("y", d => {
            if (d.source === d.target) return d.source.y - 45;
            // Place exactly on the line vertically
            return link.nodes()[data.links.indexOf(d)].getPointAtLength(0.5 * link.nodes()[data.links.indexOf(d)].getTotalLength()).y;
        });

    node.attr("cx", d => d.x).attr("cy", d => d.y);
    label.attr("x", d => d.x).attr("y", d => d.y);

    if (data.nodes.length > 0) {
        const minX = Math.min(...data.nodes.map(n => n.x));
        const maxX = Math.max(...data.nodes.map(n => n.x));
        const minY = Math.min(...data.nodes.map(n => n.y));
        const maxY = Math.max(...data.nodes.map(n => n.y));
        const padding = 80;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        svg.attr("viewBox", `${minX - padding} ${minY - padding} ${width} ${height}`)
           .style("width", "100%")
           .style("max-width", "800px")
           .style("max-height", "400px"); 
    }
    simulation.stop();
};

watch(() => props.problemId, () => {
    doReset();
    renderDFA();
});

watch(() => props.testString, (newStr) => {
    if (newStr !== null && newStr !== undefined) {
        runAuto();
    } else {
        doReset();
    }
});

watch(() => props.simKey, () => {
    if (props.testString !== null && props.testString !== undefined) {
        runAuto();
    }
});

onMounted(() => {
    renderDFA();
});

onUnmounted(() => {
    clearInterval(autoTimer.value);
});
</script>

<template>
  <div class="dfa-wrap">
    
    <!-- Header -->
    <div class="dfa-header">
      <div class="header-left">
        <span class="badge">DFA</span>
        <span class="title">Problem {{ problemId }}</span>
      </div>
      <div class="header-right">
        <span class="dot start-dot"></span><span class="leg">Start</span>
        <span class="dot state-dot"></span><span class="leg">State</span>
        <span class="dot accept-dot"></span><span class="leg">Accept</span>
      </div>
    </div>

    <!-- Regex -->
    <div class="regex-wrap" v-if="problemRegex">
      <span class="regex-label">Regex</span>
      <code class="regex-code">{{ problemRegex }}</code>
    </div>

    <div v-if="simResult && !isValidInput" class="invalid-warning">
      <span>⚠️ Invalid String for this Automaton</span>
    </div>

    <!-- Simulation Controls Area -->
    <div class="simulation-status-card">
      
      <!-- Tape -->
      <div v-if="tape.length > 0" class="tape-section">
        <div class="section-label">Tape</div>
        <div class="tape-container no-scrollbar-x">
          <div
            v-for="(cell, i) in tape"
            :key="i"
            :class="['tape-cell', cell.status]"
          >
            {{ cell.ch }}
          </div>
        </div>
      </div>

      <!-- State & Result -->
      <div class="status-row">
        <div class="current-state-box" v-if="simResult && currentState">
          <span class="label">Current State</span>
          <div :class="['state-badge', done ? (resultAccepted ? 'ok' : 'fail') : 'active']">
            {{ currentState }}
          </div>
        </div>

        <div class="read-char-box" v-if="currentStep?.char != null">
          <span class="label">Reading</span>
          <div class="char-badge">{{ currentStep.char }}</div>
        </div>

        <div class="result-banner-box">
          <transition name="pop">
            <div v-if="done" :class="['banner', resultAccepted ? 'banner-ok' : 'banner-fail']">
              <span v-if="resultAccepted">✓ String Accepted</span>
              <span v-else-if="props.testString === ''">✕ null string rejected</span>
              <span v-else>✕ String Rejected</span>
            </div>
          </transition>
        </div>
      </div>

    </div>

    <!-- SVG Visualization -->
    <div class="viz-container">
      <svg ref="svgRef"></svg>
    </div>

  </div>
</template>

<style scoped>
.dfa-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    max-width: 900px;
    margin: 20px auto;
    padding: 1.2rem;

    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);

    font-family: 'Inter', 'Segoe UI', sans-serif;
}

/* Header */
.dfa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.header-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}
.badge {
    background: #1e1e2e;
    color: #cdd6f4;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 5px;
}
.title {
    font-size: 18px;
    font-weight: 600;
    color: #1e1e2e;
}
.header-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}
.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}
.start-dot  { background: #ff9800; }
.state-dot  { background: #2196f3; margin-left: 0.6rem; }
.accept-dot { background: #10b981; margin-left: 0.6rem; }
.leg {
    font-size: 12px;
    color: #6b7280;
}

/* Regex */
.regex-wrap {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
}
.regex-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding-top: 2px;
    white-space: nowrap;
}
.regex-code {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #334155;
    word-break: break-all;
    line-height: 1.6;
}

/* Simulation status card */
.simulation-status-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 4px;
}

/* Tape */
.tape-container {
    display: flex;
    gap: 4px;
    padding: 4px 0;
    overflow-x: auto;
}
.tape-cell {
    min-width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-family: monospace;
    font-weight: bold;
    font-size: 14px;
    transition: all 0.2s;
    background: #f8fafc;
}
.tape-cell.done {
    background: #f0fdf4;
    color: #16a34a;
    border-color: #bbf7d0;
}
.tape-cell.active {
    background: #fffbeb;
    color: #d97706;
    border-color: #fde68a;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Status Row */
.status-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.label {
    font-size: 10px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    display: block;
    margin-bottom: 2px;
}

.state-badge {
    padding: 4px 12px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 13px;
    border: 1px solid transparent;
}
.state-badge.active { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.state-badge.ok     { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.state-badge.fail   { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

.char-badge {
    padding: 4px 10px;
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
    border-radius: 6px;
    font-weight: bold;
    font-family: monospace;
}

.banner {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
}
.banner-ok   { background: #16a34a; color: white; }
.banner-fail { background: #dc2626; color: white; }

/* Viz container */
.viz-container {
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    background: #fafafa;
    overflow: hidden;
}

.invalid-warning {
    background: #fef2f2;
    color: #991b1b;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #fee2e2;
    font-size: 13px;
    font-weight: 500;
}

.pop-enter-active { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

/* Hide scrollbar */
.no-scrollbar-x {
  scrollbar-width: none;
}
.no-scrollbar-x::-webkit-scrollbar {
  display: none;
}
</style>

