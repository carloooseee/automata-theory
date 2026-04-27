<script setup>
import { ref, computed } from 'vue'
import Problems from './components/Promblems.vue'
import InputArea from './components/InputArea.vue'
import NavBar from './components/NavBar.vue'
import SelectSimulation from './components/SelectSimulation.vue'
import Diagram from './components/DFAVisualization.vue'
import PDAVisualization from './components/PDAVisualization.vue'
import CFGVisualization from './components/CFGVisualization.vue'
import UserManual from './components/UserManual.vue'
import Footer from './components/Footer.vue'

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
          <InputArea 
            :regexStr="currentRegex" 
            @inputs-updated="updateSimulationInputs" 
            @simulate-string="runSimulation" 
          />
        </div>

      </div>

      <!-- Controls -->
      <div class="visualization-controls">
        <button 
          :class="{ active: activeAutomata === 'dfa' }"
          @click="activeAutomata = 'dfa'"
        >
          DFA
        </button>

        <button 
          :class="{ active: activeAutomata === 'cfg' }"
          @click="activeAutomata = 'cfg'"
        >
          CFG
        </button>

        <button 
          :class="{ active: activeAutomata === 'pda' }"
          @click="activeAutomata = 'pda'"
        >
          PDA
        </button>
      </div>

      <!-- Visualization -->
      <div class="section">
        <div v-if="activeAutomata === 'dfa'">
          <Diagram 
            :problemId="problems[selectedProblemIndex].id" 
            :testString="currentTestString" 
            :simKey="simulationKey" 
          />
        </div>

        <div v-else-if="activeAutomata === 'cfg'">
          <CFGVisualization 
            :problemId="problems[selectedProblemIndex].id" 
            :testString="currentTestString" 
          />
        </div>

        <div v-else-if="activeAutomata === 'pda'">
          <PDAVisualization 
            :problemId="problems[selectedProblemIndex].id" 
          />
        </div>
      </div>

    </div>
  </div>

  <div v-else-if="currentView === 'manual'">
    <UserManual />
  </div>

  <Footer />
</template>

<style scoped>
.single-section {
  border: 1px solid #000000;
  padding: 20px;
  background: #fff;
}

/* 🔥 Controls container */
.visualization-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 30px 0 10px;
  flex-wrap: wrap;
  padding: 0 16px;
}

/* 🔥 Button base */
.visualization-controls button {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid #d0d7de;

  background: #ffffff;
  color: #333;
  font-size: 13px;

  cursor: pointer;
  transition: 0.2s ease;
  min-width: 80px;
}

/* Hover */
.visualization-controls button:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

/* 🔥 Active button */
.visualization-controls button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

@media (max-width: 480px) {
  .visualization-controls {
    gap: 8px;
  }
  .visualization-controls button {
    padding: 6px 14px;
    font-size: 12px;
    flex: 1;
  }
}
</style>