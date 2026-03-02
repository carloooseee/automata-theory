<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  inputs:    { type: Array,  required: true },
  problemId: { type: Number, required: true }, // 0-indexed
})

const emit = defineEmits(['simulation-update'])

const selectedInput = ref('')
const currentStep   = ref(-1)
const simulationPath = ref([])
const isComplete    = ref(false)
const isAccepted    = ref(false)
const autoRunning   = ref(false)
let autoTimer       = null

// ─── DFA Definitions ─────────────────────────────────────────────────────────
// problemId 0 → Problem 1  |  problemId 1 → Problem 2

const dfas = {
  0: {
    initialState: 'q0',
    acceptStates: new Set(['q3']),
    transitions: {
      'q0': { 'a': 'q1', 'b': 'q2' },
      'q1': { 'a': 'q3', 'b': 'q3' },
      'q2': { 'a': 'q1', 'b': 'q2' },
      'q3': { 'a': 'q3', 'b': 'q3' },
    },
  },
  1: {
    initialState: 'q0',
    acceptStates: new Set(['q_acc']),
    transitions: {
      'q0':    { '0': 'q_0',   '1': 'q_1'   },
      'q_0':   { '0': 'q_acc', '1': 'q_01'  },
      'q_1':   { '0': 'q_10',  '1': 'q_acc' },
      'q_01':  { '0': 'q_010', '1': 'q_1'   },
      'q_10':  { '0': 'q_0',   '1': 'q_101' },
      'q_010': { '0': 'q_acc', '1': 'q_acc' },
      'q_101': { '0': 'q_acc', '1': 'q_acc' },
      'q_acc': { '0': 'q_acc', '1': 'q_acc' },
    },
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const validInputs = computed(() => props.inputs.filter(i => i.trim() !== ''))

const buildTrace = (input) => {
  const dfa = dfas[props.problemId]
  if (!dfa) return { trace: [], accepted: false }

  let state = dfa.initialState
  const trace = [{ state, charIndex: -1, char: null, dead: false }]

  for (let i = 0; i < input.length; i++) {
    const ch   = input[i]
    const next = dfa.transitions[state]?.[ch]
    if (next === undefined) {
      trace.push({ state: 'DEAD', charIndex: i, char: ch, dead: true })
      break
    }
    state = next
    trace.push({ state, charIndex: i, char: ch, dead: false })
  }

  const lastEntry = trace[trace.length - 1]
  const accepted  = !lastEntry.dead && dfa.acceptStates.has(lastEntry.state)
  return { trace, accepted }
}

const emitUpdate = (done) => {
  emit('simulation-update', {
    path:        simulationPath.value,
    currentStep: currentStep.value,
    isComplete:  done,
    isAccepted:  done ? isAccepted.value : false,
    input:       selectedInput.value,
  })
}

// ─── Controls ────────────────────────────────────────────────────────────────

const startSimulation = () => {
  stopAuto()
  if (!selectedInput.value) return

  const { trace, accepted } = buildTrace(selectedInput.value)
  simulationPath.value = trace
  isAccepted.value     = accepted
  currentStep.value    = 0
  isComplete.value     = false

  emitUpdate(false)
}

const next = () => {
  if (isComplete.value || simulationPath.value.length === 0) return

  const nextStep = currentStep.value + 1

  if (nextStep >= simulationPath.value.length) {
    isComplete.value = true
    emitUpdate(true)
    return
  }

  currentStep.value = nextStep
  const done = nextStep === simulationPath.value.length - 1

  if (done) isComplete.value = true
  emitUpdate(done)
}

const stopAuto = () => {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
  autoRunning.value = false
}

const auto = () => {
  if (autoRunning.value) {
    stopAuto()
    return
  }
  if (isComplete.value) return

  if (simulationPath.value.length === 0) {
    startSimulation()
  }

  autoRunning.value = true
  autoTimer = setInterval(() => {
    if (isComplete.value) {
      stopAuto()
      return
    }
    next()
  }, 650)
}

const reset = () => {
  stopAuto()
  currentStep.value    = -1
  simulationPath.value = []
  isComplete.value     = false
  isAccepted.value     = false
  emit('simulation-update', {
    path: [], currentStep: -1, isComplete: false, isAccepted: false, input: '',
  })
}

watch(() => props.problemId, reset)
watch(selectedInput, reset)

// ─── Display helpers ─────────────────────────────────────────────────────────

const currentState = computed(() => {
  const entry = simulationPath.value[currentStep.value]
  return entry ? entry.state : null
})

const currentChar = computed(() => {
  const entry = simulationPath.value[currentStep.value]
  return entry && entry.char !== null ? entry.char : null
})

const tape = computed(() => {
  if (!selectedInput.value || simulationPath.value.length === 0) return []
  return selectedInput.value.split('').map((ch, i) => {
    const step = currentStep.value
    if (step <= 0) return { ch, status: 'pending' }
    if (i < step - 1)   return { ch, status: 'done'    }
    if (i === step - 1) return { ch, status: 'active'  }
    return { ch, status: 'pending' }
  })
})
</script>

<template>
  <div class="sim-container">
    <h2>DFA Simulation</h2>

    <!-- Input selector + Start -->
    <div class="row">
      <select v-model="selectedInput" class="input-select">
        <option disabled value="">Select an input string</option>
        <option v-for="(inp, idx) in validInputs" :key="idx" :value="inp">
          {{ inp }}
        </option>
      </select>
      <button @click="startSimulation" class="btn btn-start" :disabled="!selectedInput">
        ▶ Start
      </button>
    </div>

    <!-- Input tape -->
    <div v-if="selectedInput && simulationPath.length > 0" class="tape-row">
      <span class="tape-label">Tape:</span>
      <div class="tape">
        <span
          v-for="(cell, i) in tape"
          :key="i"
          :class="['tape-cell', cell.status]"
        >{{ cell.ch }}</span>
      </div>
    </div>

    <!-- Current state + char -->
    <div v-if="currentStep >= 0 && simulationPath.length > 0" class="state-row">
      <span class="label">State:</span>
      <span :class="['badge-state', isComplete ? (isAccepted ? 'ok' : 'fail') : 'active']">
        {{ currentState ?? '—' }}
      </span>
      <span v-if="currentChar !== null" class="badge-char">
        Read: <strong>{{ currentChar }}</strong>
      </span>
    </div>

    <!-- Result banner -->
    <transition name="pop">
      <div
        v-if="isComplete"
        :class="['banner', isAccepted ? 'banner-ok' : 'banner-fail']"
      >
        {{ isAccepted ? '✅ String Accepted' : '❌ String Rejected' }}
      </div>
    </transition>

    <!-- Trace log -->
    <div v-if="simulationPath.length > 0" class="trace-log" ref="traceLogRef">
      <div
        v-for="(entry, i) in simulationPath.slice(0, currentStep + 1)"
        :key="i"
        :class="['trace-row', i === currentStep ? 'trace-current' : '']"
      >
        <span class="t-step">Step {{ i }}</span>
        <span class="t-char">{{ i === 0 ? '(initial)' : `read '${entry.char}'` }}</span>
        <span :class="['t-state', entry.dead ? 't-dead' : '']">→ {{ entry.state }}</span>
      </div>
    </div>

    <!-- Control buttons -->
    <div class="btn-row">
      <button
        @click="next"
        :disabled="simulationPath.length === 0 || isComplete"
        class="btn btn-next"
      >⏭ Next</button>

      <button
        @click="auto"
        :disabled="simulationPath.length === 0 && !selectedInput || isComplete"
        :class="['btn', autoRunning ? 'btn-pause' : 'btn-auto']"
      >{{ autoRunning ? '⏸ Pause' : '⚡ Auto' }}</button>

      <button @click="reset" class="btn btn-reset">🔄 Reset</button>
    </div>
  </div>
</template>

<style scoped>
.sim-container {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem;
  width: 56%;
  min-width: 320px;
  margin: 0 auto;
  font-family: 'Segoe UI', sans-serif;
}

h2 { margin: 0; color: #222; font-size: 1.25rem; }

.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-select {
  flex: 1;
  padding: 8px 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.tape-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.tape-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: #555;
  min-width: 40px;
}
.tape {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}
.tape-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 2px solid #bbb;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.25s ease;
  background: #f9f9f9;
  color: #999;
}
.tape-cell.done {
  background: #c8e6c9;
  border-color: #4caf50;
  color: #1b5e20;
}
.tape-cell.active {
  background: #fff3e0;
  border-color: #ff9800;
  color: #e65100;
  transform: scale(1.18);
  box-shadow: 0 0 8px #ff980066;
}
.tape-cell.pending {
  background: #f5f5f5;
  color: #bbb;
}

.state-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.label {
  font-size: 0.88rem;
  font-weight: bold;
  color: #555;
}
.badge-state {
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.badge-state.active { background: #e3f2fd; color: #1565c0; border-color: #2196f3; }
.badge-state.ok     { background: #e8f5e9; color: #2e7d32; border-color: #4caf50; }
.badge-state.fail   { background: #ffebee; color: #c62828; border-color: #ef5350; }
.badge-char {
  font-size: 0.88rem;
  color: #555;
  background: #fff8e1;
  padding: 3px 12px;
  border-radius: 14px;
  border: 1px solid #ffe082;
}

.banner {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
  border: 2px solid transparent;
}
.banner-ok   { background: #e8f5e9; color: #2e7d32; border-color: #4caf50; }
.banner-fail { background: #ffebee; color: #c62828; border-color: #ef5350; }

.trace-log {
  max-height: 170px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 6px 10px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trace-row {
  display: flex;
  gap: 14px;
  font-size: 0.82rem;
  padding: 3px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}
.trace-current { background: #fff9c4; font-weight: bold; }
.t-step  { color: #aaa; min-width: 52px; }
.t-char  { color: #555; min-width: 90px; }
.t-state { color: #1565c0; }
.t-dead  { color: #c62828 !important; }

.btn-row {
  display: flex;
  gap: 10px;
}
.btn {
  flex: 1;
  padding: 10px 0;
  font-size: 0.95rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.2s, opacity 0.2s;
}
.btn:disabled { opacity: 0.38; cursor: not-allowed; }
.btn:not(:disabled):hover { filter: brightness(0.9); }

.btn-start { padding: 8px 20px; flex: none; background: #1976d2; color: #fff; border-radius: 6px; }
.btn-next  { background: #1976d2; color: #fff; }
.btn-auto  { background: #388e3c; color: #fff; }
.btn-pause { background: #f57c00; color: #fff; }
.btn-reset { background: #e0e0e0; color: #333; }

.pop-enter-active { animation: popIn 0.3s ease; }
.pop-leave-active { transition: opacity 0.2s; }
.pop-leave-to     { opacity: 0; }
@keyframes popIn {
  from { transform: scale(0.88); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
</style>