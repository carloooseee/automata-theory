<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
    regexStr: { type: String, required: true }
})

const emit = defineEmits(['inputs-updated', 'simulate-string'])

const userInputs = ref(['', '', '', '', ''])

watch(userInputs, (newVal) => {
    emit('inputs-updated', [...newVal])
}, { deep: true })

const inputResults = computed(() => {
    if (!props.regexStr) {
        return userInputs.value.map(() => 'No Regex')
    }

    try {
        const jsRegexStr = '^' + props.regexStr.split('+').join('|') + '$'
        const regex = new RegExp(jsRegexStr)
        
        return userInputs.value.map(val => {
            if (!val) return null
            return regex.test(val) ? 'Valid' : 'Invalid'
        })
    } catch (e) {
        console.error("Invalid Regex generated:", e)
        return userInputs.value.map(() => 'Error')
    }
})
</script>

<template>
  <div class="input-area-container">
    <div class="inputs-area">
      <div v-for="(inp, idx) in userInputs" :key="idx" class="input-row">
        <input 
          v-model="userInputs[idx]" 
          :placeholder="`Input ${idx + 1}`" 
        />
        <span 
          v-if="inputResults[idx] !== null" 
          :class="['result', inputResults[idx] === 'Valid' ? 'valid' : 'invalid']"
        >
          {{ inputResults[idx] }}
        </span>
        <button
          v-if="inputResults[idx] === 'Valid' || inputResults[idx] === 'Invalid'"
          @click="$emit('simulate-string', userInputs[idx])"
          class="simulate-btn"
        >
          Simulate
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/InputArea.css"></style>