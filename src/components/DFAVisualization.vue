<script setup>
import { ref, watch, onMounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
    problemId: { type: Number, required: true }
})

const svgRef = ref(null)

const generateDFA = (problemId) => {
  // Problem 1
  if (problemId === 1) {
    const states = [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'b_branch', label: 'b', type: 'state' },
        { id: 'aa_branch1', label: 'a', type: 'state' },
        { id: 'aa_branch2', label: 'a', type: 'state' },
        { id: 'ab_branch1', label: 'a', type: 'state' },
        { id: 'ab_branch2', label: 'b', type: 'state' },
        { id: 'loop1', label: 'loop1', type: 'state' },
        { id: 'loop2', label: 'loop2', type: 'state' },
        { id: 'loop3', label: 'loop3', type: 'state' },
        { id: 'anchor_a1', label: 'a', type: 'state' },
        { id: 'anchor_a2', label: 'a', type: 'state' },
        { id: 'anchor_a3', label: 'a', type: 'state' },
        { id: 'anchor_b1', label: 'b', type: 'state' },
        { id: 'anchor_b2', label: 'b', type: 'state' },
        { id: 'anchor_b3', label: 'b', type: 'state' },
        { id: 'converge', label: 'conv', type: 'state' },
        { id: 'accept', label: 'Accept', type: 'accept' }
    ];

    const transitions = [
        { source: 'start', target: 'b_branch', label: 'b' },
        { source: 'start', target: 'aa_branch1', label: 'a' },
        { source: 'aa_branch1', target: 'aa_branch2', label: 'a' },
        { source: 'start', target: 'ab_branch1', label: 'a' },
        { source: 'ab_branch1', target: 'ab_branch2', label: 'b' },
        { source: 'b_branch', target: 'loop1', label: 'ε' },
        { source: 'aa_branch2', target: 'loop1', label: 'ε' },
        { source: 'ab_branch2', target: 'loop1', label: 'ε' },
        { source: 'loop1', target: 'loop2', label: 'a' },
        { source: 'loop2', target: 'loop3', label: 'b' },
        { source: 'loop3', target: 'loop1', label: 'a,b' },
        { source: 'loop2', target: 'loop2', label: 'a' },
        { source: 'loop3', target: 'anchor_a1', label: 'a' },
        { source: 'loop3', target: 'anchor_b1', label: 'b' },
        { source: 'anchor_a1', target: 'anchor_a2', label: 'a' },
        { source: 'anchor_a2', target: 'anchor_a3', label: 'a' },
        { source: 'anchor_b1', target: 'anchor_b2', label: 'b' },
        { source: 'anchor_b2', target: 'anchor_b3', label: 'b' },
        { source: 'anchor_a3', target: 'converge', label: 'ε' },
        { source: 'anchor_b3', target: 'converge', label: 'ε' },
        { source: 'converge', target: 'accept', label: 'any' },
        { source: 'accept', target: 'accept', label: 'a,b' }
    ];
    return { nodes: states, links: transitions };
  } else {
      // Problem 2: (1+0)*(11+00+101+010)...
      const states = [
        { id: 'start', label: 'Start', type: 'start' },
        
        // Stage 1: (1+0)* loops and transition
        { id: 's1_a', label: '0,1', type: 'state' },
        { id: 's1_b', label: '11', type: 'state' },
        { id: 's1_c', label: '00', type: 'state' },

        // Stage 2: Middle Loop Cluster (Complex)
        { id: 'm1', label: 'q_m1', type: 'state' },
        { id: 'm2', label: 'q_m2', type: 'state' },
        { id: 'm3', label: 'q_m3', type: 'state' },
        { id: 'm4', label: 'q_m4', type: 'state' },

        // Stage 3: Mandatory Bridge (11+00)
        { id: 'br1', label: '1', type: 'state' },
        { id: 'br2', label: '0', type: 'state' },
        { id: 'br_end', label: 'pair', type: 'state' },

        // Stage 4: Final Complex Loop
        { id: 'f1', label: 'q_f1', type: 'state' },
        { id: 'f2', label: 'q_f2', type: 'state' },

        // End
        { id: 'penult', label: 'last', type: 'state' },
        { id: 'accept', label: 'Accept', type: 'accept' }
      ];

      const transitions = [
        // Start Loops (1+0)*
        { source: 'start', target: 'start', label: '0,1' },
        { source: 'start', target: 's1_a', label: '1' },
        { source: 's1_a', target: 's1_b', label: '1' }, // 11
        { source: 'start', target: 's1_c', label: '0' }, // 0...
        { source: 's1_c', target: 'm1', label: '0' }, // 00 -> Middle

        // Transition to Middle
        { source: 's1_b', target: 'm1', label: 'ε' },

        // Middle Cluster (Dense)
        { source: 'm1', target: 'm2', label: '1' },
        { source: 'm2', target: 'm3', label: '0' },
        { source: 'm3', target: 'm4', label: '1' },
        { source: 'm4', target: 'm1', label: '0' },
        { source: 'm2', target: 'm4', label: '0,1' }, // Cross
        { source: 'm3', target: 'm3', label: '1' }, // Self

        // Bridge (11+00)
        { source: 'm3', target: 'br1', label: '1' },
        { source: 'br1', target: 'br_end', label: '1' }, // 11
        { source: 'm2', target: 'br2', label: '0' },
        { source: 'br2', target: 'br_end', label: '0' }, // 00

        // Final Loop Stage
        { source: 'br_end', target: 'f1', label: 'ε' },
        { source: 'f1', target: 'f2', label: '1' },
        { source: 'f2', target: 'f1', label: '0' },
        { source: 'f2', target: 'f2', label: '11' },

        // To Accept
        { source: 'f1', target: 'penult', label: '1+0' },
        { source: 'penult', target: 'accept', label: 'ε' },
        { source: 'accept', target: 'accept', label: '1+0+11' }
      ];
      return { nodes: states, links: transitions };
  }
};

const renderDFA = (data) => {
    if (!svgRef.value) return;
    
    // Clear previous
    d3.select(svgRef.value).selectAll("*").remove();

    const svg = d3.select(svgRef.value)
        .attr("width", "100%")
        .style("overflow", "visible"); // Allow overflow for drag

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
        .attr("fill", "#000"); // Black arrow

    // Simulation setup
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("collide", d3.forceCollide(30))
        .stop(); // Stop automatic simulation to manually tick first

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
        .attr("fill", d => d.type === 'accept' ? '#4caf50' : (d.type === 'start' ? '#ff9800' : '#2196f3'))
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

    // Pre-warm simulation to settle layout
    simulation.tick(300);
    ticked(); // Update positions once

    // Calculate bounding box after settlement
    const nodes = data.nodes;
    if (nodes.length > 0) {
        const minX = Math.min(...nodes.map(n => n.x));
        const maxX = Math.max(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y));
        
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        // Update SVG viewBox to fit content centered
        svg.attr("viewBox", [minX - padding, minY - padding, width, height])
           .attr("height", height); // Set height attribute explicitly for auto-sizing
    }

    // Restart simulation for interactivity (optional, keeps constraints active)
    simulation.on("tick", ticked).restart();
};

watch(() => props.problemId, (newId) => {
    const customData = generateDFA(newId); 
    renderDFA(customData);
});

const resetLayout = () => {
    const customData = generateDFA(props.problemId);
    renderDFA(customData);
};

onMounted(() => {
    resetLayout();
});
</script>

<template>
  <div class="dfa-container">
    <h3>DFA Visualization (Problem {{ problemId }})</h3>
    <svg ref="svgRef"></svg>
    <button @click="resetLayout" class="reset-btn">Reset Layout</button>
  </div>
</template>

<style scoped>
.dfa-container {
    width: 80%;
    margin: 0 auto;
    height: max-content;
    display: flex;
    flex-direction: column;
    align-items: center;
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
