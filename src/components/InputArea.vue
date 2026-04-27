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
            // Empty string is a valid input to test — don't return null
            if (val === null || val === undefined) return null
            const isValid = regex.test(val)
            if (!isValid && val === '') return 'null string not accepted'
            return isValid ? 'Valid' : 'Invalid'
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
      <div
        v-for="(inp, idx) in userInputs"
        :key="idx"
        class="input-row"
      >
        <input
          v-model="userInputs[idx]"
          :placeholder="`Input ${idx + 1}`"
          class="input-field"
        />

        <span
          v-if="inputResults[idx] !== null"
          :class="[
            'result-badge',
            inputResults[idx] === 'Valid' ? 'valid' : 'invalid'
          ]"
        >
          {{ inputResults[idx] }}
        </span>

        <button
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