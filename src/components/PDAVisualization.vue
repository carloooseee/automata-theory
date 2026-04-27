<script setup>
import pdaregex1 from '../assets/pdaregex1.png'
import pdaregex2 from '@/assets/pdaregex2.png'

defineProps({
    problemId: { type: Number, required: true }
})

const REGEX_MAP = {
  1: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*',
  2: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*'
}
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
        <span class="attribution">Assigned by Carlos (Regex 1) & Angel (Regex 2)</span>
      </div>
    </div>

    <!-- Regex -->
    <div class="regex-wrap" v-if="REGEX_MAP[problemId]">
      <span class="regex-label">Regex</span>
      <code class="regex-code">{{ REGEX_MAP[problemId] }}</code>
    </div>

    <!-- Image Container -->
    <div class="pda-viz-card">
      <div class="viz-head">
        <span>Pushdown Automata Diagram</span>
      </div>
      <div class="image-viewport">
        <div v-if="problemId === 1">
          <img :src="pdaregex1" alt="PDA for Regex 1" class="pda-image" />
        </div>
        
        <div v-else-if="problemId === 2">
          <img :src="pdaregex2" alt="PDA for Regex 2" class="pda-image" />
        </div>
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
.attribution {
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
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

