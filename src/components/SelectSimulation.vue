<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    inputs: { type: Array, required: true }
})

const selectedInput = ref('')

const validInputs = computed(() => {
    return props.inputs.filter(input => input.trim() !== '')
})

const startSimulation = () => {
    console.log('Starting simulation with:', selectedInput.value)
}
</script>

<template>
  <div class="select-simulation-container">
    <h2>Select Simulation</h2>
    <div class="controls">
        <select v-model="selectedInput" class="input-select">
            <option disabled value="">Select an input string</option>
            <option v-for="(input, index) in validInputs" :key="index" :value="input">
                {{ input }}
            </option>
        </select>
        <button @click="startSimulation" class="start-btn" :disabled="!selectedInput">
            Start Simulation
        </button>
    </div>
  </div>
</template>

<style scoped>
.select-simulation-container {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 50%;
    margin: 0 auto;
}

.controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.input-select {
    padding: 8px;
    flex-grow: 1;
    font-size: 1rem;
}

.start-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

</style>
