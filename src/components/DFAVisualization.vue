<script setup>
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
    problemId: { type: Number, required: true },
    testString: { type: String, default: '' }
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
      { id: 'q0', label: 'q0', type: 'start', fx: 0, fy: 0 },
      { id: 'q1', label: 'q1', type: 'state', fx: 150, fy: -80 },
      { id: 'q2', label: 'q2', type: 'state', fx: 150, fy: 80 },
      { id: 'q3', label: 'q3', type: 'state', fx: 300, fy: -80 },
      { id: 'q4', label: 'q4', type: 'state', fx: 450, fy: -80 },
      { id: 'q5', label: 'q5', type: 'state', fx: 300, fy: 80 },
      { id: 'q6', label: 'q6', type: 'state', fx: 450, fy: 80 },
      { id: 'q7', label: 'q7', type: 'state', fx: 600, fy: 0 },
      { id: 'q8', label: 'q8', type: 'accept', fx: 750, fy: 0 }
    ],
    links: [
      { source: 'q0', target: 'q1', label: 'a' },
      { source: 'q0', target: 'q2', label: 'b' },
      { source: 'q1', target: 'q2', label: 'a', curve: 1, sweep: 0},
      { source: 'q1', target: 'q2', label: 'b', curve: 1, sweep: 1},
      { source: 'q2', target: 'q3', label: 'a' },
      { source: 'q2', target: 'q5', label: 'b' },
      { source: 'q3', target: 'q4', label: 'a' },
      { source: 'q3', target: 'q5', label: 'b' },
      { source: 'q4', target: 'q7', label: 'a' },
      { source: 'q4', target: 'q5', label: 'b' },
      { source: 'q5', target: 'q3', label: 'a' },
      { source: 'q5', target: 'q6', label: 'b' },
      { source: 'q6', target: 'q3', label: 'a' },
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
      { id: 'p0', label: 'p0', type: 'start', fx: 0, fy: 0 },
      { id: 'p1', label: 'p1', type: 'state', fx: 150, fy: -100 },
      { id: 'p2', label: 'p2', type: 'state', fx: 150, fy: 100 },
      { id: 'p3', label: 'p3', type: 'state', fx: 300, fy: -150 },
      { id: 'p4', label: 'p4', type: 'state', fx: 300, fy: 100 },
      { id: 'p5', label: 'p5', type: 'state', fx: 450, fy: 0 },
      { id: 'p6', label: 'p6', type: 'state', fx: 600, fy: -80 },
      { id: 'p7', label: 'p7', type: 'state', fx: 600, fy: 80 },
      { id: 'p8', label: 'p8', type: 'state', fx: 750, fy: 0 },
      { id: 'p9', label: 'A', type: 'accept', fx: 900, fy: 0 }
    ],
    links: [
      { source: 'p0', target: 'p1', label: '0' },
      { source: 'p0', target: 'p2', label: '1' },
      { source: 'p1', target: 'p5', label: '0' },
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
      { source: 'p6', target: 'p7', label: '1' },
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

const dfa = computed(() => DFA_CONFIGS[props.problemId])

const steps = computed(() =>
  simResult.value ? simResult.value.steps : [{ state: dfa.value.start, charIndex: -1, char: null }]
)

const currentStep = computed(() => steps.value[stepIndex.value] || steps.value[steps.value.length - 1])
const currentState = computed(() => currentStep.value?.state ?? null)
const currentCharIdx = computed(() => simResult.value ? (steps.value[stepIndex.value]?.charIndex ?? -1) : -1)

const resultAccepted = computed(() => done.value && !!simResult.value?.accepted)

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
  if (!props.testString) return;
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
        .attr("font-size", "14px")
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
        .attr("dy", 5).attr("text-anchor", "middle")
        .attr("font-size", "12px").attr("pointer-events", "none")
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
    if (newStr) {
        runAuto();
    } else {
        doReset();
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
  <div class="dfa-container">
    <h3>DFA Visualization (Problem {{ problemId }})</h3>
    
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

    <svg ref="svgRef"></svg>
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

/* Tape */
.tape-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
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

.pop-enter-active { animation: popIn 0.3s ease; }
.pop-leave-active { transition: opacity 0.2s; }
.pop-leave-to     { opacity: 0; }
@keyframes popIn {
  from { transform: scale(0.88); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
</style>
