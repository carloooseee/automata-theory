<script setup>
import { ref, computed } from 'vue'
import Problems from './components/Promblems.vue'
import InputArea from './components/InputArea.vue'
import NavBar from './components/NavBar.vue'
import SelectSimulation from './components/SelectSimulation.vue'
import Diagram from './components/DFAVisualization.vue'
import PDAVisualization from './components/PDAVisualization.vue'

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

const currentTestString = ref('')
const runSimulation = (str) => {
  currentTestString.value = str
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
      <div class="section"><SelectSimulation :inputs="simulationInputs" @start-simulation="runSimulation" /></div>
      <div class="section"><Diagram :problemId="problems[selectedProblemIndex].id" :testString="currentTestString" /></div>
    </div>
  </div>

  <div v-else-if="currentView === 'cfgpda'">
    <h1 class="main-title">{{ automata }}</h1>
    <p class="main-title">Interactive Pushdown Automata Simulator</p>
    
    <div class="simulation-controls">
        <SelectSimulation :inputs="simulationInputs" />
    </div>

    <div class="split-container">
        <div class="cfg-section">
            <h2>CFG</h2>
            <!-- CFG Visualization will go here -->
        </div>
        <div class="pda-section">
            <PDAVisualization :problemId="problems[selectedProblemIndex].id" />
        </div>
    </div>
  </div>

  <div v-else-if="currentView === 'manual'">
    <h1>User Manual</h1>
    <p>kahit link nlang pala dito</p>
    <a href="https://docs.google.com/document/d/1ny4ccAVK-HR_crp0zBQ0JsBoIXSl3KXw1x4W2Kmc4O8/edit?usp=sharing">https://docs.google.com/document/d/1ny4ccAVK-HR_crp0zBQ0JsBoIXSl3KXw1x4W2Kmc4O8/edit?usp=sharing</a>
  </div>

</template>

<style scoped>
.split-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 20px;
    margin-top: 20px;
}

.cfg-section, .pda-section {
    flex: 1;
    border: 1px solid #000000;
    padding: 20px;
}

.simulation-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}
</style>

