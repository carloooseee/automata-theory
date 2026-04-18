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
  <div class="pda-container">
    <h3 class="pda-title">PDA Visualization (Problem {{ problemId }})</h3>
    <p class="regex-text">{{ REGEX_MAP[problemId] }}</p>

    <div v-if="problemId === 1">
      <img :src="pdaregex1" alt="PDA for Regex 1" class="pda-image" />
    </div>
    
    <div v-else-if="problemId === 2">
      <img :src="pdaregex2" alt="PDA for Regex 2" class="pda-image" />
    </div>

    <p class="assignment-text">Assigned by Carlos (Regex 1) and Angel (Regex 2)</p>
  </div>
</template>

<style scoped>
.pda-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
}

.pda-title {
    margin: 0;
    margin-bottom: 0.5rem;
    color: #222;
}

.regex-text {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    text-align: center;
}

.pda-image {
    max-width: 100%;
    height: auto;
}

.assignment-text {
    margin-top: 2rem;
    color: #666;
    font-size: 1.1rem;
}
</style>
