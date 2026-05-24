<script setup>
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import * as d3 from 'd3'
import pdaregex2 from '@/assets/pdaregex2.png'

const props = defineProps({
    problemId: { type: Number, required: true }
})

const svgRef = ref(null)

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
      { source: 'S2', target: 'S3', label: 'null' },
      { source: 'S2', target: 'S4', label: 'a' },
      { source: 'S2', target: 'S5', label: 'b' },
      { source: 'S4', target: 'S5', label: 'a', curve: 1.5, sweep: 0 },
      { source: 'S4', target: 'S5', label: 'b', curve: 1.5, sweep: 1 },
      { source: 'S5', target: 'S6', label: 'null' },
      { source: 'S5', target: 'S7', label: 'a' },
      { source: 'S5', target: 'S8', label: 'b' },
      { source: 'S7', target: 'S8', label: 'b', curve: 1.2, sweep: 0 },
      { source: 'S8', target: 'S7', label: 'a'},
      { source: 'S7', target: 'S9', label: 'a' },
      { source: 'S8', target: 'S10', label: 'b' },
      { source: 'S7', target: 'S11', label: 'null' },
      { source: 'S8', target: 'S11', label: 'null' },
      { source: 'S9', target: 'S8', label: 'b', curve: 1, sweep: 1 },
      { source: 'S10', target: 'S7', label: 'a', curve: 1, sweep: 0 },
      { source: 'S9', target: 'S11', label: 'null' },
      { source: 'S10', target: 'S11', label: 'null' },
      { source: 'S9', target: 'S12', label: 'a' },
      { source: 'S10', target: 'S12', label: 'b' },
      { source: 'S12', target: 'S11', label: 'null' },
      { source: 'S12', target: 'S13', label: 'a', curve: 1.5, sweep: 0 },
      { source: 'S12', target: 'S13', label: 'b', curve: 1.5, sweep: 1 },
      { source: 'S13', target: 'S13', label: 'a, b' },
      { source: 'S13', target: 'S14', label: 'null' }
    ]
  }
}

const REGEX_MAP = {
  1: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*',
  2: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*'
}

const pda = computed(() => PDA_CONFIGS[props.problemId])
const problemRegex = computed(() => REGEX_MAP[props.problemId])

const renderPDA = () => {
    if (!svgRef.value || props.problemId !== 1) return;
    
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
        .attr("stroke-width", 1.8)
        .attr("marker-end", d => d.source === d.target ? "url(#arrow-loop)" : "url(#arrow)");

    const linkLabel = svg.append("g").selectAll("text")
        .data(data.links).join("text").text(d => d.label)
        .attr("font-size", "16px")
        .attr("fill", "#e63946")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .style("paint-order", "stroke")
        .style("stroke", "#ffffff")
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
        .attr("font-size", "16px")
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
    renderPDA();
});

onMounted(() => {
    renderPDA();
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

    <!-- Visualization Container -->
    <div class="pda-viz-card">
      <div class="viz-head">
        <span>Pushdown Automata Diagram</span>
      </div>
      
      <div class="viz-container" v-show="problemId === 1">
        <svg ref="svgRef"></svg>
      </div>

      <div class="image-viewport" v-if="problemId === 2">
        <img :src="pdaregex2" alt="PDA for Regex 2" class="pda-image" />
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
</style>
