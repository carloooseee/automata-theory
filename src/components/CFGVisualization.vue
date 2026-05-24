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
const autoTimer = ref(null)

const CFG_DATA = {
    1: {
        startSymbol: 'S',
        productions: [
            { lhs: 'S', alts: ['ABCDEF'] },
            { lhs: 'A', alts: ['b', 'aa', 'ab'] },
            { lhs: 'B', alts: ['λ', 'aB', 'bB'] },
            { lhs: 'C', alts: ['λ', 'bbC', 'abaC', 'abC'] },
            { lhs: 'D', alts: ['aaa', 'bbb'] },
            { lhs: 'E', alts: ['a', 'b'] },
            { lhs: 'F', alts: ['λ', 'aF', 'bF'] },
        ],
        terminals: ['a', 'b', 'λ'],
        nonTerminals: ['S', 'A', 'B', 'C', 'D', 'E', 'F']
    },
    2: {
        startSymbol: 'S',
        productions: [
            { lhs: 'S', alts: ['ABACDEA'] },
            { lhs: 'A', alts: ['0A', '1A', 'λ'] },
            { lhs: 'B', alts: ['11', '00', '101', '010'] },
            { lhs: 'C', alts: ['11', '00'] },
            { lhs: 'D', alts: ['CD', '101D', 'λ'] },
            { lhs: 'E', alts: ['1', '0'] },
        ],
        terminals: ['0', '1', 'λ'],
        nonTerminals: ['S', 'A', 'B', 'C', 'D', 'E']
    }
}

const REGEX_MAP = {
  1: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*',
  2: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*'
}

const cfg = computed(() => CFG_DATA[props.problemId] || CFG_DATA[1])
const problemRegex = computed(() => REGEX_MAP[props.problemId])
const hoveredRow = ref(null)

const tokenizeAlt = (alt) => {
    if (alt === 'λ' || alt === 'ε') return [{ ch: 'λ', isNT: false }]
    return [...alt].map(ch => ({
        ch,
        isNT: cfg.value.nonTerminals.includes(ch)
    }))
}

// Backtracking parser for the CFG
const parseCFG = (inputStr, cfgData) => {
    if (inputStr === null || inputStr === undefined) return null;
    let targetStr = inputStr === '' ? '' : inputStr;
    
    const memo = new Map();

    const parseSequence = (tokens, str) => {
        if (tokens.length === 0) {
            return [{ children: [], consumed: 0 }];
        }
        
        const [firstToken, ...restTokens] = tokens;
        const firstResults = parse(firstToken, str);
        
        const results = [];
        for (const firstRes of firstResults) {
            const restStr = str.slice(firstRes.consumed);
            const restResults = parseSequence(restTokens, restStr);
            for (const restRes of restResults) {
                results.push({
                    children: [firstRes.tree, ...restRes.children],
                    consumed: firstRes.consumed + restRes.consumed
                });
            }
        }
        return results;
    }

    const parse = (symbol, str) => {
        const memoKey = `${symbol}-${str.length}`;
        if (memo.has(memoKey)) return memo.get(memoKey);

        if (!cfgData.nonTerminals.includes(symbol)) {
            if (symbol === 'λ' || symbol === 'ε') {
                return [{ tree: { name: 'λ', children: undefined }, consumed: 0 }];
            }
            if (str.length > 0 && str[0] === symbol) {
                return [{ tree: { name: symbol, children: undefined }, consumed: 1 }];
            }
            return [];
        }

        const prod = cfgData.productions.find(p => p.lhs === symbol);
        if (!prod) return [];

        const results = [];
        for (const alt of prod.alts) {
            const tokens = (alt === 'λ' || alt === 'ε') ? ['λ'] : alt.split('');
            const seqResults = parseSequence(tokens, str);
            for (const seqRes of seqResults) {
                results.push({
                    tree: { name: symbol, children: seqRes.children },
                    consumed: seqRes.consumed
                });
            }
        }
        
        memo.set(memoKey, results);
        return results;
    };

    const startResults = parse(cfgData.startSymbol, targetStr);
    const successResult = startResults.find(r => r.consumed === targetStr.length);
    
    if (successResult) {
        const finalTree = JSON.parse(JSON.stringify(successResult.tree));
        let idCounter = 0;
        const assignIds = (node) => {
            node.id = `n-${idCounter++}`;
            if (node.children) node.children.forEach(assignIds);
        };
        assignIds(finalTree);
        return { tree: finalTree, accepted: true };
    }

    return { tree: null, accepted: false };
};

const parseResult = computed(() => parseCFG(props.testString, cfg.value))
const treeData = computed(() => parseResult.value?.tree || null)
const isValidInput = computed(() => parseResult.value?.accepted || false)

const extractLeftmostDerivation = (root) => {
    if (!root) return []
    const steps = []
    
    let currentStringNodes = [root]
    const visibleNodeIds = new Set([root.id])
    
    const recordStep = () => {
        steps.push({
            visibleNodeIds: new Set(visibleNodeIds),
            derivationString: currentStringNodes.map(n => n.name).join('')
        })
    }
    
    recordStep()
    
    let canExpand = true
    while(canExpand) {
        canExpand = false
        for (let i = 0; i < currentStringNodes.length; i++) {
            const node = currentStringNodes[i];
            if (node.children && node.children.length > 0) {
                node.children.forEach(c => visibleNodeIds.add(c.id))
                currentStringNodes.splice(i, 1, ...node.children)
                canExpand = true
                recordStep()
                break; 
            }
        }
    }
    
    return steps
}

const derivationSteps = computed(() => extractLeftmostDerivation(treeData.value))
const currentStepData = computed(() => derivationSteps.value[stepIndex.value] || null)

const renderTree = () => {
    if (!svgRef.value) return
    const data = treeData.value
    if (!data) { 
        d3.select(svgRef.value).selectAll("*").remove(); 
        return;
    }
    
    const visibleSet = currentStepData.value?.visibleNodeIds || new Set();

    d3.select(svgRef.value).selectAll("*").remove()
    const svg = d3.select(svgRef.value).attr("width", "100%").style("overflow", "visible")
    
    svg.append("defs").selectAll("marker").data(["end"]).enter().append("marker")
        .attr("id", "arrow-cfg").attr("viewBox", "0 -5 10 10")
        .attr("refX", 0).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "var(--edge-stroke)")
        
    const margin = { top: 40, right: 40, bottom: 40, left: 40 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)
    
    const tree = d3.tree().size([width, height])
    const root = d3.hierarchy(data)
    tree(root)
    
    // Only bind data for visible nodes
    const visibleLinks = root.links().filter(d => visibleSet.has(d.target.data.id))
    const visibleNodes = root.descendants().filter(d => visibleSet.has(d.data.id))

    g.selectAll(".link").data(visibleLinks, d => d.target.data.id)
        .join("path")
        .attr("class", "link").attr("fill", "none").attr("stroke", "var(--edge-stroke)").attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow-cfg)")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        
    const nodes = g.selectAll(".node").data(visibleNodes, d => d.data.id)
        .join("g")
        .attr("class", "node").attr("transform", d => `translate(${d.x},${d.y})`)
        
    nodes.append("circle").attr("r", 18)
        .attr("fill", d => !cfg.value.nonTerminals.includes(d.data.name) ? '#4caf50' : '#f59e0b')
        .attr("stroke", "var(--node-stroke)").attr("stroke-width", 2)
        
    nodes.append("text").attr("dy", 4).attr("text-anchor", "middle")
        .attr("font-size", "14px").attr("font-weight", "bold").attr("fill", "white")
        .text(d => d.data.name)
        
    svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .style("max-width", "100%").style("height", "auto")
}

const simulationStarted = ref(false)

const doReset = () => {
    clearInterval(autoTimer.value);
    autoTimer.value = null;
    isRunning.value = false;
    stepIndex.value = 0;
    done.value = false;
    simulationStarted.value = false;
    renderTree();
}

const advance = (idx) => {
    stepIndex.value = idx + 1;
    if (idx + 1 >= derivationSteps.value.length - 1) done.value = true;
    renderTree();
}

const runAuto = () => {
    doReset();
    
    simulationStarted.value = true;
    if (!treeData.value) return; // invalid string
    
    isRunning.value = true;
    let idx = 0;
    stepIndex.value = 0;
    done.value = false;
    
    renderTree();
    
    const max = derivationSteps.value.length - 1;
    autoTimer.value = setInterval(() => {
        if (idx >= max) {
            clearInterval(autoTimer.value);
            autoTimer.value = null;
            isRunning.value = false;
            done.value = true;
            renderTree();
            return;
        }
        advance(idx);
        idx++;
    }, 800);
}

watch(() => props.problemId, () => { doReset(); });
watch(() => props.testString, () => {
    doReset();
});
watch(() => props.simKey, () => {
    if (props.testString !== null && props.testString !== undefined) {
        runAuto();
    }
});

onMounted(() => { renderTree(); })
onUnmounted(() => { clearInterval(autoTimer.value); })
</script>

<template>
  <div class="cfg-wrap">

    <!-- Header -->
    <div class="cfg-header">
      <div class="header-left">
        <span class="badge">CFG</span>
        <span class="title">Problem {{ problemId }}</span>
      </div>
      <div class="header-right">
        <span class="dot nt-dot"></span><span class="leg">Non-terminal</span>
        <span class="dot t-dot"></span><span class="leg">Terminal</span>
      </div>
    </div>

    <!-- Regex -->
    <div class="regex-wrap" v-if="problemRegex">
      <span class="regex-label">Regex</span>
      <code class="regex-code">{{ problemRegex }}</code>
    </div>

    <!-- Productions -->
    <div class="rule-card">
      <div class="rule-card-head">
        <span>Productions</span>
        <span class="rule-count">{{ cfg.productions.length }} rules</span>
      </div>
      <div class="rule-list">
        <div
          v-for="(prod, idx) in cfg.productions"
          :key="idx"
          class="rule-row"
          :class="{ hovered: hoveredRow === idx }"
          @mouseenter="hoveredRow = idx"
          @mouseleave="hoveredRow = null"
        >
          <span class="lhs">{{ prod.lhs }}</span>
          <span class="arrow">→</span>
          <span class="rhs-group">
            <template v-for="(alt, ai) in prod.alts" :key="ai">
              <span v-if="ai > 0" class="pipe">|</span>
              <span
                v-for="(tok, ti) in tokenizeAlt(alt)"
                :key="ti"
                :class="['tok', tok.isNT ? 'nt' : 't']"
              >{{ tok.ch }}</span>
            </template>
          </span>
          <span class="row-num">{{ idx + 1 }}</span>
        </div>
      </div>
    </div>
    
    <!-- Simulation Controls Area -->
    <div class="simulation-status-card" v-if="simulationStarted">
      <div class="section-label">Target String</div>
      <div class="tape-container no-scrollbar-x">
          <div
            v-for="(ch, i) in (testString || 'λ').split('')"
            :key="i"
            :class="['tape-cell', isValidInput ? 'target' : 'target-fail']"
          >
            {{ ch }}
          </div>
      </div>
        
      <div class="section-label" style="margin-top: 10px;">Current Derivation</div>
      <div class="derivation-string">
          <span v-if="!isValidInput" class="deriv-char" style="color: #ef4444;">No valid derivation</span>
          <span v-else v-for="(ch, i) in currentStepData?.derivationString?.split('') || []" :key="i" 
            :class="['deriv-char', cfg.nonTerminals.includes(ch) ? 'nt' : 't']">{{ ch }}</span>
      </div>

      <div class="status-row" style="margin-top: 10px;">
        <div class="result-banner-box">
          <transition name="pop">
            <div v-if="!isValidInput" class="banner banner-fail">
              <span>✕ String Rejected (Parse Failed)</span>
            </div>
            <div v-else-if="done" class="banner banner-ok">
              <span>✓ Target String Reached</span>
            </div>
            <div v-else-if="isRunning" class="banner banner-active">
              <span>Deriving... Step {{ stepIndex + 1 }} / {{ derivationSteps.length }}</span>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- SVG Visualization for Derivation Tree -->
    <div class="viz-container" v-show="simulationStarted && isValidInput">
      <svg ref="svgRef"></svg>
    </div>

  </div>
</template>

<style scoped>
.cfg-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    max-width: 900px;        /* 🔥 LIMIT WIDTH */
    margin: 20px auto;       /* 🔥 CENTER IT */
    padding: 1.2rem;

    background: #ffffff;     /* 🔥 make it a card */
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);

    font-family: 'Inter', 'Segoe UI', sans-serif;
}

/* Header */
.cfg-header {
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
.nt-dot { background: #f59e0b; }
.t-dot  { background: #10b981; margin-left: 0.6rem; }
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

/* Rule card */
.rule-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
}
.rule-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}
.rule-count {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
}

/* Rule rows */
.rule-list {
    display: flex;
    flex-direction: column;
}
.rule-row {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    transition: background 0.15s;
    cursor: default;
    position: relative;
}
.rule-row:last-child {
    border-bottom: none;
}
.rule-row.hovered {
    background: #fafafa;
}
.rule-row.hovered .lhs {
    color: #d97706;
}

.lhs {
    font-weight: 700;
    color: #f59e0b;
    min-width: 18px;
    transition: color 0.15s;
}
.arrow {
    color: #cbd5e1;
    margin: 0 0.65rem;
    font-size: 15px;
}
.rhs-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1px;
    flex: 1;
}
.pipe {
    color: #cbd5e1;
    margin: 0 0.35rem;
    font-size: 13px;
}
.tok {
    font-family: 'Courier New', monospace;
    font-size: 14px;
}
.tok.nt { color: #f59e0b; }
.tok.t  { color: #10b981; }

.row-num {
    font-size: 11px;
    color: #e2e8f0;
    font-family: 'Inter', sans-serif;
    min-width: 16px;
    text-align: right;
}
.rule-row.hovered .row-num {
    color: #94a3b8;
}

/* Simulation status card */
.simulation-status-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    padding: 12px;
    display: flex;
    flex-direction: column;
}

.section-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 4px;
}

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
    background: #f8fafc;
}
.tape-cell.target {
    background: #f0fdf4;
    color: #16a34a;
    border-color: #bbf7d0;
}
.tape-cell.target-fail {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fecaca;
}

.derivation-string {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 12px;
    background: #1e1e2e;
    border-radius: 8px;
    font-family: monospace;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
    min-height: 48px;
    align-items: center;
}
.deriv-char.nt { color: #f59e0b; }
.deriv-char.t  { color: #4caf50; }

.status-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.banner {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
    display: inline-block;
}
.banner-ok   { background: #16a34a; color: white; }
.banner-fail { background: #ef4444; color: white; }
.banner-active { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

.invalid-warning {
    background: #fef2f2;
    color: #991b1b;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #fee2e2;
    font-size: 13px;
    font-weight: 500;
}

/* Viz container */
.viz-container {
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    background: #fafafa;
    overflow: hidden;
    min-height: 200px;
}

.pop-enter-active { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.no-scrollbar-x {
  scrollbar-width: none;
}
.no-scrollbar-x::-webkit-scrollbar {
  display: none;
}
</style>