<script setup>
import { ref, watch, onMounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
    problemId: { type: Number, required: true }
})

const svgRef = ref(null)

const generatePDA = (problemId) => {
  // Mock PDA data for visualization
  if (problemId === 1) {
    // A simple PDA structure
    const states = [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'q1', label: 'q1', type: 'state' },
        { id: 'q2', label: 'q2', type: 'state' },
        { id: 'q3', label: 'q3', type: 'state' },
        { id: 'accept', label: 'Accept', type: 'accept' }
    ];

    const transitions = [
        { source: 'start', target: 'q1', label: 'ε, ε -> $' },
        { source: 'q1', target: 'q1', label: 'a, ε -> A' },
        { source: 'q1', target: 'q2', label: 'b, A -> ε' },
        { source: 'q2', target: 'q2', label: 'b, A -> ε' },
        { source: 'q2', target: 'q3', label: 'ε, $ -> ε' },
        { source: 'q3', target: 'accept', label: 'ε, ε -> ε' }
    ];
    return { nodes: states, links: transitions };
  } else {
      // Problem 2
      const states = [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'push', label: 'Push', type: 'state' },
        { id: 'pop', label: 'Pop', type: 'state' },
        { id: 'accept', label: 'Accept', type: 'accept' }
      ];

      const transitions = [
        { source: 'start', target: 'push', label: 'ε, Z -> Z' },
        { source: 'push', target: 'push', label: '0, Z -> 0Z' },
        { source: 'push', target: 'push', label: '1, Z -> 1Z' },
        { source: 'push', target: 'pop', label: 'c, ε -> ε' },
        { source: 'pop', target: 'pop', label: '0, 0 -> ε' },
        { source: 'pop', target: 'pop', label: '1, 1 -> ε' },
        { source: 'pop', target: 'accept', label: 'ε, Z -> ε' }
      ];
      return { nodes: states, links: transitions };
  }
};

const renderPDA = (data) => {
    if (!svgRef.value) return;
    
    // Clear previous
    d3.select(svgRef.value).selectAll("*").remove();

    const svg = d3.select(svgRef.value)
        .attr("width", "100%")
        .style("overflow", "visible");

    // Arrowhead marker
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

    // Simulation setup
    data.nodes.forEach((d, i) => {
        d.x = i * 100 + 50; 
        d.y = 200;
    });

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("collide", d3.forceCollide(50))
        .force("center", d3.forceCenter(400, 200).strength(0.05))
        .stop();

    // Create elements
    const link = svg.append("g")
        .selectAll("path")
        .data(data.links)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    const linkLabel = svg.append("g")
        .selectAll("text")
        .data(data.links)
        .join("text")
        .text(d => d.label)
        .attr("font-size", "12px")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle");

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("r", 20)
        .attr("fill", d => d.type === 'accept' ? '#4caf50' : (d.type === 'start' ? '#ff9800' : '#9c27b0')) // Purple for PDA states
        .call(d3.drag()
            .on("start", (event) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", (event) => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on("end", (event) => {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            })
        );

    const label = svg.append("g")
        .selectAll("text")
        .data(data.nodes)
        .join("text")
        .text(d => d.label)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("pointer-events", "none")
        .attr("fill", "white")
        .attr("font-weight", "bold");

    // Tick function definition
    const ticked = () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            
            if (d.source === d.target) {
                // Self-loop
                return `M${d.source.x},${d.source.y} A30,30 0 1,1 ${d.source.x + 1},${d.source.y + 1}`;
            }
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        linkLabel
            .attr("x", d => {
                 if (d.source === d.target) return d.source.x;
                 return (d.source.x + d.target.x) / 2;
            })
            .attr("y", d => {
                 if (d.source === d.target) return d.source.y - 45;
                 return (d.source.y + d.target.y) / 2 - 10;
            });
        
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    };

    // Pre-warm and then auto-fit
    simulation.tick(300);
    ticked();

    const nodes = data.nodes;
    if (nodes.length > 0) {
        const minX = Math.min(...nodes.map(n => n.x));
        const maxX = Math.max(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y));
        
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        svg.attr("viewBox", [minX - padding, minY - padding, width, height])
           .attr("height", height);
    }

    simulation.on("tick", ticked).restart();
};

watch(() => props.problemId, (newId) => {
    const customData = generatePDA(newId); 
    renderPDA(customData);
});

const resetLayout = () => {
    const customData = generatePDA(props.problemId);
    renderPDA(customData);
};

onMounted(() => {
    resetLayout();
});
</script>

<template>
  <div class="pda-container">
    <h3>PDA Visualization (Problem {{ problemId }})</h3>
    <svg ref="svgRef"></svg>
    <button @click="resetLayout" class="reset-btn">Reset Layout</button>
  </div>
</template>

<style scoped>
.pda-container {
    width: 100%;
    margin: 0;
    height: max-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: auto;
}

h3 {
    margin: 1rem 0;
}

.reset-btn {
    margin: 10px;
    padding: 8px 16px;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    color: #333;
    transition: background-color 0.2s;
}

.reset-btn:hover {
    background-color: #e2e6ea;
}
</style>
