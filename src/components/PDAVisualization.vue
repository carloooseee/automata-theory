<script setup>
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import * as d3 from 'd3'
import pdaregex2 from '@/assets/pdaregex2.png'

const props = defineProps({
    problemId: { type: Number, required: true },
    testString: { type: String, default: null },
    simKey: { type: Number, default: 0 }
})

const svgRef = ref(null)
const stepIndex = ref(0)
const isRunning = ref(false)
const done = ref(false)
const simResult = ref(null)
const autoTimer = ref(null)

const PDA_CONFIGS = {
  1: {
    nodes: [
      { id: 'S1', label: 'Start', type: 'start', shape: 'ellipse', fx: 0, fy: 50 },
      { id: 'S2', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 150 },
      { id: 'S3', label: 'Reject', type: 'reject', shape: 'ellipse', fx: -200, fy: 150 },
      { id: 'S4', label: 'Read', type: 'read', shape: 'diamond', fx: 200, fy: 150 },
      { id: 'S5', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 300 },
      { id: 'S6', label: 'Reject', type: 'reject', shape: 'ellipse', fx: -200, fy: 300 },
      { id: 'S7', label: 'Read', type: 'read', shape: 'diamond', fx: -100, fy: 450 },
      { id: 'S8', label: 'Read', type: 'read', shape: 'diamond', fx: 100, fy: 450 },
      { id: 'S11', label: 'Reject', type: 'reject', shape: 'ellipse', fx: 0, fy: 600 },
      { id: 'S9', label: 'Read', type: 'read', shape: 'diamond', fx: -300, fy: 450 },
      { id: 'S10', label: 'Read', type: 'read', shape: 'diamond', fx: 300, fy: 450 },
      { id: 'S12', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 750 },
      { id: 'S13', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 900 },
      { id: 'S14', label: 'Accept', type: 'accept', shape: 'ellipse', fx: 0, fy: 1050 }
    ],
    links: [
      { source: 'S1', target: 'S2', label: '' },
      { source: 'S2', target: 'S3', label: '∆' },
      { source: 'S2', target: 'S4', label: 'a' },
      { source: 'S2', target: 'S5', label: 'b' },
      { source: 'S4', target: 'S5', label: 'a', curve: 1.5, sweep: 0 },
      { source: 'S4', target: 'S5', label: 'b', curve: 1.5, sweep: 1 },
      { source: 'S5', target: 'S6', label: '∆' },
      { source: 'S5', target: 'S7', label: 'a' },
      { source: 'S5', target: 'S8', label: 'b' },
      { source: 'S7', target: 'S8', label: 'b', curve: 1.2, sweep: 0 },
      { source: 'S8', target: 'S7', label: 'a'},
      { source: 'S7', target: 'S9', label: 'a' },
      { source: 'S8', target: 'S10', label: 'b' },
      { source: 'S7', target: 'S11', label: '∆' },
      { source: 'S8', target: 'S11', label: '∆' },
      { source: 'S9', target: 'S8', label: 'b', curve: 1, sweep: 1 },
      { source: 'S10', target: 'S7', label: 'a', curve: 1, sweep: 0 },
      { source: 'S9', target: 'S11', label: '∆' },
      { source: 'S10', target: 'S11', label: '∆' },
      { source: 'S9', target: 'S12', label: 'a' },
      { source: 'S10', target: 'S12', label: 'b' },
      { source: 'S12', target: 'S11', label: '∆' },
      { source: 'S12', target: 'S13', label: 'a', curve: .8, sweep: 0 },
      { source: 'S12', target: 'S13', label: 'b', curve: .8, sweep: 1 },
      { source: 'S13', target: 'S13', label: 'a, b' },
      { source: 'S13', target: 'S14', label: '∆' }
    ]
  },
  2: {
    nodes: [
      { id: 'S0', label: 'Start', type: 'start', shape: 'ellipse', fx: 0, fy: 0 },
      { id: 'L1', label: '', type: 'invisible', shape: 'none', fx: 0, fy: 60 },
      { id: 'S1', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 120 },
      { id: 'S2', label: 'Read', type: 'read', shape: 'diamond', fx: 250, fy: 120 },
      { id: 'S3', label: 'Read', type: 'read', shape: 'diamond', fx: -250, fy: 120 },
      { id: 'S4', label: 'Reject', type: 'reject', shape: 'ellipse', fx: 0, fy: 280 },
      { id: 'S5', label: 'Read', type: 'read', shape: 'diamond', fx: 250, fy: 320 },
      { id: 'S6', label: 'Read', type: 'read', shape: 'diamond', fx: -250, fy: 320 },
      { id: 'S7', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 480 },
      { id: 'S8', label: 'Reject', type: 'reject', shape: 'ellipse', fx: 400, fy: 480 },
      { id: 'S9', label: 'Reject', type: 'reject', shape: 'ellipse', fx: -400, fy: 480 },
      { id: 'S10', label: 'Read', type: 'read', shape: 'diamond', fx: -150, fy: 640 },
      { id: 'S11', label: 'Read', type: 'read', shape: 'diamond', fx: 150, fy: 640 },
      { id: 'S12', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 800 },
      { id: 'S13', label: 'Read', type: 'read', shape: 'diamond', fx: 0, fy: 960 },
      { id: 'S14', label: 'Accept', type: 'accept', shape: 'ellipse', fx: 0, fy: 1120 }
    ],
    links: [
      { source: 'S0', target: 'S1', label: '' },
      { source: 'S1', target: 'S2', label: '0' },
      { source: 'S1', target: 'S3', label: '1' },
      { source: 'S1', target: 'S4', label: '∆' },
      { source: 'S2', target: 'S7', label: '0' },
      { source: 'S2', target: 'S5', label: '1' },
      { source: 'S2', target: 'S8', label: '∆', curve: 1.2, sweep: 1 },
      { source: 'S3', target: 'S7', label: '1' },
      { source: 'S3', target: 'S6', label: '0' },
      { source: 'S3', target: 'S9', label: '∆', curve: 1.2, sweep: 0 },
      { source: 'S6', target: 'L1', label: '0', curve: 1.5, sweep: 1 },
      { source: 'S5', target: 'L1', label: '1', curve: 1.5, sweep: 0 },
      { source: 'S6', target: 'S9', label: '∆' },
      { source: 'S6', target: 'S7', label: '1' },
      { source: 'S7', target: 'S4', label: '∆' },
      { source: 'S5', target: 'S7', label: '0'},
      { source: 'S5', target: 'S8', label: '∆' },
      { source: 'S7', target: 'S10', label: '0', curve: 1, sweep: 0 },
      { source: 'S7', target: 'S11', label: '1', curve: 1, sweep: 1 },
      { source: 'S10', target: 'S11', label: '1', curve: 1, sweep: 0 },
      { source: 'S11', target: 'S10', label: '0', curve: 1, sweep: 0 },
      { source: 'S10', target: 'S9', label: '∆'},
      { source: 'S11', target: 'S8', label: '∆'},
      { source: 'S10', target: 'S12', label: '0' },
      { source: 'S11', target: 'S12', label: '1' },
      { source: 'S12', target: 'S9', label: '∆', curve: 1, sweep: 1 },
      { source: 'S12', target: 'S13', label: '0', curve: .8, sweep: 0 },
      { source: 'S12', target: 'S13', label: '1', curve: .8, sweep: 1 },
      { source: 'S13', target: 'S13', label: '0, 1' },
      { source: 'S13', target: 'S14', label: '∆' }
    ]
  }
}

const REGEX_MAP = {
  1: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*',
  2: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*'
}

const pda = computed(() => PDA_CONFIGS[props.problemId])
const problemRegex = computed(() => REGEX_MAP[props.problemId])

const steps = computed(() =>
  simResult.value ? simResult.value.steps : [{ state: pda.value?.nodes.find(n => n.type === 'start')?.id, charIndex: -1, char: null }]
)

const currentStep = computed(() => steps.value[stepIndex.value] || steps.value[steps.value.length - 1])
const currentState = computed(() => currentStep.value?.state ?? null)
const currentCharIdx = computed(() => simResult.value ? (steps.value[stepIndex.value]?.charIndex ?? -1) : -1)

const resultAccepted = computed(() => done.value && !!simResult.value?.accepted)

const runSimulation = (input) => {
    const data = PDA_CONFIGS[props.problemId];
    if (!data) return { steps: [], accepted: false };
    
    const startNode = data.nodes.find(n => n.type === 'start');
    if (!startNode) return { steps: [], accepted: false };

    let current = startNode.id;
    let charIndex = -1; 
    const stepsList = [{ state: current, charIndex, char: null }];
    
    const getNextLinks = (state) => data.links.filter(l => (l.source.id || l.source) === state);

    let outgoing = getNextLinks(current);
    let epsLink = outgoing.find(l => l.label === '');
    if (epsLink) {
        current = epsLink.target.id || epsLink.target;
        if (current === 'L1') current = 'S1';
        stepsList.push({ state: current, charIndex, char: null });
    }

    let alive = true;
    while (alive) {
        const node = data.nodes.find(n => n.id === current);
        if (!node) break;

        if (node.type === 'accept' || node.type === 'reject') {
            break;
        }

        if (node.type === 'read') {
            const nextCharIdx = charIndex + 1;
            const ch = nextCharIdx < input.length ? input[nextCharIdx] : null;
            outgoing = getNextLinks(current);
            
            let nextLink = null;
            if (ch !== null) {
                nextLink = outgoing.find(l => l.label === ch || l.label.includes(ch));
            }
            
            if (!nextLink) {
                nextLink = outgoing.find(l => l.label === '∆' || l.label === 'null');
            }

            if (!nextLink) {
                stepsList.push({ state: null, charIndex: nextCharIdx, char: ch, dead: true });
                alive = false;
                break;
            }

            let nextTarget = nextLink.target.id || nextLink.target;
            if (nextTarget === 'L1') nextTarget = 'S1';
            current = nextTarget;

            if (ch !== null && nextLink.label !== '∆' && nextLink.label !== 'null') {
                charIndex = nextCharIdx;
                stepsList.push({ state: current, charIndex, char: ch });
            } else {
                stepsList.push({ state: current, charIndex: nextCharIdx, char: ch || '∆' });
            }
        } else {
            break;
        }
    }

    const finalNode = data.nodes.find(n => n.id === current);
    const accepted = finalNode ? finalNode.type === 'accept' : false;
    return { steps: stepsList, accepted };
}

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

const initSim = () => {
  const result = runSimulation(props.testString)
  simResult.value = result
  return result
}

const highlightElements = () => {
    if (!svgRef.value) return;
    d3.select(svgRef.value).selectAll('ellipse, polygon').attr('stroke', null).attr('stroke-width', null).style('filter', null);
    d3.select(svgRef.value).selectAll('path.edge').attr('stroke', 'var(--edge-stroke)').attr('stroke-width', 2).style('filter', null);
    
    if (!simResult.value) return;
    
    const isAccepted = resultAccepted.value;
    const isDone = done.value;
    const activeColor = isDone ? (isAccepted ? '#22c55e' : '#ef4444') : '#f59e0b';
    const trailColor = activeColor;
    
    const stepsList = simResult.value.steps;
    const maxIdx = stepIndex.value;
    
    for (let i = 0; i <= maxIdx; i++) {
        const step = stepsList[i];
        if (!step.state) continue;
        
        const isCurrent = (i === maxIdx);
        const nodeColor = isCurrent ? activeColor : trailColor;
        const nodeWidth = isCurrent ? 4 : 2.5;
        
        d3.select(svgRef.value).select(`#node-${step.state}`)
          .attr('stroke', nodeColor)
          .attr('stroke-width', nodeWidth)
          .style('filter', isCurrent ? `drop-shadow(0 0 12px ${nodeColor})` : null);
          
        if (i < maxIdx) {
            const nextStep = stepsList[i+1];
            if (nextStep && nextStep.state) {
                const isCurrentEdge = (i === maxIdx - 1 && !isDone);
                const edgeColor = isCurrentEdge ? activeColor : trailColor;
                const edgeWidth = isCurrentEdge ? 4 : 3;
                
                let targetId = nextStep.state;
                if (targetId === 'S1') {
                    const d = pda.value.links.find(l => (l.source.id || l.source) === step.state && ((l.target.id || l.target) === 'S1' || (l.target.id || l.target) === 'L1'));
                    if (d) targetId = d.target.id || d.target;
                }
                
                d3.select(svgRef.value).select(`path[id^="link-${step.state}-${targetId}"]`)
                  .attr('stroke', edgeColor)
                  .attr('stroke-width', edgeWidth)
                  .style('filter', isCurrentEdge ? `drop-shadow(0 0 10px ${edgeColor})` : null);
            } else if (nextStep && nextStep.dead) {
                if (i === maxIdx - 1) {
                     d3.select(svgRef.value).select(`#node-${step.state}`)
                      .attr('stroke', '#ef4444')
                      .attr('stroke-width', 4)
                      .style('filter', `drop-shadow(0 0 12px #ef4444)`);
                }
            }
        }
    }
}

const advance = (result, idx) => {
  stepIndex.value = idx + 1
  if (idx + 1 >= result.steps.length - 1) done.value = true
  highlightElements()
}

const runAuto = () => {
  if (props.testString === null || props.testString === undefined) return;
  doReset();
  const result = initSim()
  isRunning.value = true
  let idx = 0
  stepIndex.value = 0
  done.value = false
  highlightElements()
  
  const max = result.steps.length - 1
  autoTimer.value = setInterval(() => {
    if (idx >= max) {
      clearInterval(autoTimer.value)
      autoTimer.value = null
      isRunning.value = false
      done.value = true
      highlightElements()
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
      d3.select(svgRef.value).selectAll('ellipse, polygon').attr('stroke', null).attr('stroke-width', null).style('filter', null);
      d3.select(svgRef.value).selectAll('path.edge').attr('stroke', 'var(--edge-stroke)').attr('stroke-width', 2).style('filter', null);
  }
}

const renderPDA = () => {
    if (!svgRef.value || !PDA_CONFIGS[props.problemId]) return;
    
    const data = pda.value;
    d3.select(svgRef.value).selectAll("*").remove();

    const svg = d3.select(svgRef.value).style("overflow", "hidden"); 

    svg.append("defs").selectAll("marker")
        .data(["arrow", "arrow-loop"])
        .enter().append("marker")
        .attr("id", d => d)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", d => d === "arrow" ? 48 : 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "var(--edge-stroke)");

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id));

    const linkGroup = svg.append("g")
    const link = linkGroup.selectAll("path")
        .data(data.links)
        .join("path")
        .attr("class", "edge")
        .attr("id", d => `link-${d.source.id ?? d.source}-${d.target.id ?? d.target}-${d.label}`)
        .attr("fill", "none")
        .attr("stroke", "var(--edge-stroke)")
        .attr("stroke-width", 2)
        .attr("marker-end", d => {
            if (d.source === d.target) return "url(#arrow-loop)";
            if ((d.target.id || d.target) === 'L1') return "url(#arrow-loop)";
            return "url(#arrow)";
        });

    const linkLabel = svg.append("g").selectAll("text")
        .data(data.links).join("text")
        .attr("class", "link-label")
        .text(d => d.label)
        .attr("font-size", "20px")
        .attr("fill", "var(--link-label-fill, #e63946)")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .style("paint-order", "stroke")
        .style("stroke", "var(--link-label-stroke)")
        .style("stroke-width", "4px")
        .style("stroke-linejoin", "round");

    const nodeGroup = svg.append("g")
    
    // Draw ellipses
    const ellipses = nodeGroup.selectAll("ellipse")
        .data(data.nodes.filter(d => d.shape === 'ellipse'))
        .join("ellipse")
        .attr("id", d => `node-${d.id}`)
        // .attr("stroke", "#fff")
        // .attr("stroke-width", 2)
        .attr("rx", 40)
        .attr("ry", 28)
        .attr("fill", d => d.type === 'accept' ? '#4caf50' : (d.type === 'start' ? '#ff9800' : '#f44336'));
        
    // Draw diamonds
    const diamonds = nodeGroup.selectAll("polygon")
        .data(data.nodes.filter(d => d.shape === 'diamond'))
        .join("polygon")
        .attr("id", d => `node-${d.id}`)
        .attr("points", "0,-35 45,0 0,35 -45,0")
        // .attr("stroke", "#fff")
        // .attr("stroke-width", 2)
        .attr("fill", "#2196f3");

    const label = svg.append("g").selectAll("text.main-label")
        .data(data.nodes).join("text").attr("class", "main-label").text(d => d.label)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("pointer-events", "none")
        .attr("fill", "white").attr("font-weight", "bold");

    simulation.tick(300);

    link.attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        
        if (d.source === d.target) {
            const size = 30; // Loop size
            // Start at the top-right edge and arc down to the bottom-right edge of the diamond
            return `M${d.source.x + 25},${d.source.y - 18} A ${size} ${size} 0 1 1 ${d.source.x + 25},${d.source.y + 18}`;
        }

        if (!d.curve) {
            return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
        }

        let dr = Math.sqrt(dx * dx + dy * dy);
        
        let finalSweep;
        if (d.sweep !== undefined) {
            finalSweep = d.sweep;
        } else {
            const sourceNum = parseInt((d.source.id ?? d.source).replace(/\D/g, '')) || 0;
            const targetNum = parseInt((d.target.id ?? d.target).replace(/\D/g, '')) || 0;
            finalSweep = sourceNum < targetNum ? 1 : 0;
        }

        dr = dr * d.curve;
        return `M${d.source.x},${d.source.y} A ${dr} ${dr} 0 0 ${finalSweep} ${d.target.x},${d.target.y}`;
    });

    linkLabel
        .attr("x", d => {
            return link.nodes()[data.links.indexOf(d)].getPointAtLength(0.5 * link.nodes()[data.links.indexOf(d)].getTotalLength()).x;
        })
        .attr("y", d => {
            return link.nodes()[data.links.indexOf(d)].getPointAtLength(0.5 * link.nodes()[data.links.indexOf(d)].getTotalLength()).y;
        });

    ellipses.attr("cx", d => d.x).attr("cy", d => d.y);
    diamonds.attr("transform", d => `translate(${d.x},${d.y})`);
    
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
           .style("max-width", "900px")
           .style("max-height", "800px"); 
    }
    simulation.stop();
};

watch(() => props.problemId, () => {
    doReset();
    renderPDA();
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
    renderPDA();
});

onUnmounted(() => {
    clearInterval(autoTimer.value);
});
</script>

<template>
  <div class="pda-wrap">
    
    <!-- Header -->
    <div class="pda-header">
      <div class="header-left">
        <span class="badge">PDA</span>
        <span class="title">Problem {{ problemId }}</span>
      </div>
      <div class="header-right">
        <span class="dot start-dot"></span><span class="leg">Start</span>
        <span class="dot read-dot"></span><span class="leg">Read</span>
        <span class="dot reject-dot"></span><span class="leg">Reject</span>
        <span class="dot accept-dot"></span><span class="leg">Accept</span>
      </div>
    </div>

    <!-- Regex -->
    <div class="regex-wrap" v-if="problemRegex">
      <span class="regex-label">Regex</span>
      <code class="regex-code">{{ problemRegex }}</code>
    </div>

    <!-- Visualization Controls -->
    <div class="simulation-status-card" v-if="isValidInput !== null">
      
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

    <!-- Visualization Container -->
    <div class="pda-viz-card">
      <div class="viz-head">
        <span>Pushdown Automata Diagram</span>
      </div>
      
      <div class="viz-container" v-if="[1, 2].includes(problemId)">
        <svg ref="svgRef"></svg>
      </div>
    </div>

  </div>
</template>

<style scoped>
.pda-wrap {
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
.pda-header {
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
.read-dot   { background: #2196f3; margin-left: 0.6rem; border-radius: 0; transform: rotate(45deg); width: 7px; height: 7px;}
.reject-dot { background: #f44336; margin-left: 0.6rem; }
.accept-dot { background: #4caf50; margin-left: 0.6rem; }
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

/* Viz Card */
.pda-viz-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
}
.viz-head {
    padding: 8px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
}

.viz-container {
    background: #fafafa;
    overflow: hidden;
    display: flex;
    justify-content: center;
}

.image-viewport {
    padding: 20px;
    display: flex;
    justify-content: center;
    background: #fafafa;
}

.pda-image {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
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
