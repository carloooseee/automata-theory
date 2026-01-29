<script setup>
import { ref } from 'vue'
const automata = ref('automata-theory project')
</script>

<template>
  <h1>{{ automata }}</h1>
  <div class="sections-container">
    <div class="section">RegEX</div>
    <div class="section">DFA Simulation</div>
    <div class="section">User Inputs</div>
  </div>
</template>

