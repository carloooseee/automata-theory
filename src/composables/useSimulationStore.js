// src/composables/useSimulationStore.js
// Singleton reactive store — SelectSimulation writes, DFAVisualization reads
import { reactive } from 'vue'

const state = reactive({
  currentStep:    -1,
  simulationPath: [],   // [{ state, charIndex, char, dead }]
  isComplete:     false,
  isAccepted:     false,
  input:          '',
  problemId:      0,    // 0-indexed (matches SelectSimulation's dfas key)
})

export function useSimulationStore() {
  return state
}