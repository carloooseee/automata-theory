<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    regexStr: { type: String, required: true }
})

const userInputs = ref(['', '', '', '', ''])
const inputResults = ref([null, null, null, null, null])

const execute = () => {
    if (!props.regexStr) {
        inputResults.value = userInputs.value.map(() => 'No Regex')
        return
    }

    const jsRegexStr = '^' + props.regexStr.split('+').join('|') + '$'
    
    let regex
    try {
        regex = new RegExp(jsRegexStr)
    } catch (e) {
        console.error("Invalid Regex generated:", jsRegexStr)
        inputResults.value = userInputs.value.map(() => 'Error')
        return
    }

    inputResults.value = userInputs.value.map(val => {
         // Love u! ;)
        if (!val) return 'Invalid' 
        return regex.test(val) ? 'Valid' : 'Invalid'
    })
}

watch(() => props.regexStr, () => {
    inputResults.value = [null, null, null, null, null]
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
      </div>
    </div>

    <button @click="execute" class="exec-btn">Execute</button>
  </div>
</template>

<style scoped src="../styles/InputArea.css"></style>