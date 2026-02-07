<script setup>
import { ref, computed } from 'vue'
import Problems from './components/Promblems.vue'
import InputArea from './components/InputArea.vue'
import NavBar from './components/NavBar.vue'
import SelectSimulation from './components/SelectSimulation.vue'

const currentView = ref('regex')
const simulationInputs = ref([])

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

const setView = (view) => {
  currentView.value = view
}

const updateSimulationInputs = (newInputs) => {
  simulationInputs.value = newInputs
}
</script>

<template>
  <NavBar @change-view="setView" />
  
  <div v-if="currentView === 'regex'">
    <h1 class="main-title">{{ automata }}</h1>
    <p class="main-title">Interactive Regular Expressions Simulator</p>
    <div class="sections-container">
      <div class="problem-input-container">
        <div class="section problems-section">
          <h2>Regular Expressions</h2>
            <Problems 
                :problems="problems" 
                v-model="selectedProblemIndex" 
            />
        </div>
        <div class="section input-section">
          <h2>Test your Strings</h2>
          <InputArea :regexStr="currentRegex" @inputs-updated="updateSimulationInputs" />
        </div>
      </div>
      <div class="section"><SelectSimulation :inputs="simulationInputs" /></div>
      <div class="section">D3.js Simulation</div>
    </div>
  </div>

  <div v-else-if="currentView === 'cfgpda'">
    <h1>CFGPDA</h1>
    <p>Di pa ako sure pano dito</p>
  </div>

  <div v-else-if="currentView === 'manual'">
    <h1>User Manual</h1>
    <p>kahit link nlang pala dito</p>
  </div>
</template>

