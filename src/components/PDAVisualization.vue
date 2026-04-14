<script setup>
defineProps({
    problemId: { type: Number, required: true }
})
</script>

<template>
  <div class="pda-wrap">
    <p class="assignment-text">Assigned by Carlos (Regex 1) and Angel (Regex 2)</p>
  </div>
</template>

<style scoped>
.pda-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 2rem 0;
}
.assignment-text {
    font-size: 1.1rem;
    font-weight: 500;
    color: #475569;
    font-family: system-ui, sans-serif;
}
</style>
