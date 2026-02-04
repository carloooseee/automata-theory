<script setup>
import { ref, computed } from 'vue'
import Problems from './components/Promblems.vue'
import InputArea from './components/InputArea.vue'

const automata = ref('automata-theory project')

const problems = ref([
  {
    id: 1,
    label: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*',
    regexStr: '(b+aa+ab)(a+b)*(bb+aba+ab)*(aaa+bbb)(a+b)(a+b+ab)*'
  },
  {
    id: 2,
    label: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*',
    regexStr: '(1+0)*(11+00+101+010)(1+0+11+00+101)*(11+00)(11+00+101)*(1+0)(1+0+11)*'
  }
])

const selectedProblemIndex = ref(0)
const currentRegex = computed(() => {
    return problems.value[selectedProblemIndex.value]?.regexStr || ''
})
</script>

<template>
  <h1>{{ automata }}</h1>
  <div class="sections-container">
    <div class="section">
        <Problems 
            :problems="problems" 
            v-model="selectedProblemIndex" 
        />
    </div>
    <div class="section">DFA Simulation</div>
    <div class="section">
      <InputArea :regexStr="currentRegex" />
    </div>
  </div>
</template>

