<script setup>
defineEmits(['change-view'])
</script>

<template>
  <nav class="navbar">
    <button @click="$emit('change-view', 'regex')">RegEx</button>
    <button @click="$emit('change-view', 'cfgpda')">CFGPDA</button>
    <button @click="$emit('change-view', 'manual')">User Manual</button>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
}

button {
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: white;
  border: 1px solid #999;
  border-radius: 4px;
  font-size: 1rem;
}

button:hover {
  background-color: #e0e0e0;
}
</style>
