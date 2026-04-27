<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
    problemId: { type: Number, required: true },
    testString: { type: String, default: '' }
})

const svgRef = ref(null)

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
        terminals: ['a', 'b', 'ε'],
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
        terminals: ['0', '1'],
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
    return [...alt].map(ch => ({
        ch,
        isNT: cfg.value.nonTerminals.includes(ch)
    }))
}

const generateDerivationTree = (inputStr, cfgData) => {
    if (!inputStr) return null
    const symbols = inputStr.split('')
    const root = { id: 'root', name: cfgData.startSymbol, children: [] }
    let currentLevel = [root]
    let symbolIndex = 0
    let depth = 0
    const maxDepth = 20
    while (symbolIndex < symbols.length && depth < maxDepth) {
        const nextLevel = []
        for (const node of currentLevel) {
            if (cfgData.nonTerminals.includes(node.name)) {
                const matchingProd = cfgData.productions.find(p => {
                    if (p.lhs !== node.name) return false
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
                    node.children = [{ id: `${node.id}-t`, name: symbols[symbolIndex], children: undefined }]
                    symbolIndex++
                }
            }
        }
        currentLevel = nextLevel
        depth++
    }
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

const treeData = computed(() => generateDerivationTree(props.testString, cfg.value))

const renderTree = () => {
    if (!svgRef.value) return
    const data = treeData.value
    if (!data) { renderGrammar(); return }
    d3.select(svgRef.value).selectAll("*").remove()
    const svg = d3.select(svgRef.value).attr("width", "100%").style("overflow", "visible")
    svg.append("defs").selectAll("marker").data(["end"]).enter().append("marker")
        .attr("id", "arrow-cfg").attr("viewBox", "0 -5 10 10")
        .attr("refX", 0).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#666")
    const margin = { top: 40, right: 90, bottom: 30, left: 90 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)
    const tree = d3.tree().size([width, height])
    const root = d3.hierarchy(data)
    tree(root)
    g.selectAll(".link").data(root.links()).enter().append("path")
        .attr("class", "link").attr("fill", "none").attr("stroke", "#666").attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow-cfg)").attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
    const nodes = g.selectAll(".node").data(root.descendants()).enter().append("g")
        .attr("class", "node").attr("transform", d => `translate(${d.x},${d.y})`)
    nodes.append("circle").attr("r", 18)
        .attr("fill", d => !cfg.value.nonTerminals.includes(d.data.name) ? '#4caf50' : '#ff9800')
        .attr("stroke", "#fff").attr("stroke-width", 2)
    nodes.append("text").attr("dy", 4).attr("text-anchor", "middle")
        .attr("font-size", "14px").attr("font-weight", "bold").attr("fill", "white")
        .text(d => d.data.name)
    svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .style("max-width", "100%").style("height", "auto")
}

const renderGrammar = () => {
    if (!svgRef.value) return
    d3.select(svgRef.value).selectAll("*").remove()
    const svg = d3.select(svgRef.value).attr("width", "100%").attr("height", "200")
    svg.append("text").attr("x", 50).attr("y", 100).attr("font-size", "16px").attr("fill", "#666")
        .text("Derivation tree will appear when you test a string")
}

watch(() => props.problemId, () => renderTree())
watch(() => props.testString, () => renderTree())
onMounted(() => renderTree())
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
</style>