<script setup>
import { ref, computed } from 'vue'
import Problems from './components/Promblems.vue'
import InputArea from './components/InputArea.vue'
import NavBar from './components/NavBar.vue'
import SelectSimulation from './components/SelectSimulation.vue'
import Diagram from './components/DFAVisualization.vue'
import PDAVisualization from './components/PDAVisualization.vue'
import CFGVisualization from './components/CFGVisualization.vue'

const currentView = ref('regex')
const activeAutomata = ref('dfa')
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
const simulationKey = ref(0)
const runSimulation = (str) => {
  currentTestString.value = str
  simulationKey.value++
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
          <InputArea :regexStr="currentRegex" @inputs-updated="updateSimulationInputs" @simulate-string="runSimulation" /> <!--Simulation BUTTON-->
        </div>
      </div>
      <!-- <div class="section"><SelectSimulation :inputs="simulationInputs" @start-simulation="runSimulation" /></div> WAG MUNA TO GALAWIN-->
      
      <div class="visualization-controls">
        <button @click="activeAutomata = 'dfa'">DFA</button>
        <button @click="activeAutomata = 'cfg'">CFG</button>
        <button @click="activeAutomata = 'pda'">PDA</button>
      </div>

      <div class="section">
        <div v-if="activeAutomata === 'dfa'">
           <Diagram :problemId="problems[selectedProblemIndex].id" :testString="currentTestString" :simKey="simulationKey" />
        </div>
        <div v-else-if="activeAutomata === 'cfg'">
           <CFGVisualization :problemId="problems[selectedProblemIndex].id" :testString="currentTestString" />
        </div>
        <div v-else-if="activeAutomata === 'pda'">
           <h2>PDA</h2>
           <p>PDA Visualization coming soon...</p>
        </div>
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
.single-section {
    border: 1px solid #000000;
    padding: 20px;
    background: #fff;
}

.visualization-controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
}

.visualization-controls button {
    padding: 8px 16px;
    cursor: pointer;
}
</style>

