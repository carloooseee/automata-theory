<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['change-view'])

// default active view
const active = ref('regex')

const isDarkMode = ref(false)

const changeView = (view) => {
  active.value = view
  emit('change-view', view)
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

onMounted(() => {
  if (document.body.classList.contains('dark-mode')) {
    isDarkMode.value = true
  }
})
</script>

<template>
  <nav class="navbar">

    <!-- TITLE -->
    <div class="nav-title">
      automata-theory project
    </div>

    <!-- BUTTONS -->
    <div class="nav-buttons">
      <button class="btn dark-mode-toggle" @click="toggleDarkMode" title="Toggle Dark Mode">
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>

      <button
        :class="['btn', active === 'regex' ? 'active' : '']"
        @click="changeView('regex')"
      >
        Automata Simulator
      </button>

      <button
        :class="['btn', active === 'manual' ? 'active' : '']"
        @click="changeView('manual')"
      >
        User Manual
      </button>
    </div>

  </nav>
</template>

<style scoped>
/* NAVBAR CONTAINER */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.3s, border-color 0.3s;
}

/* TITLE */
.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  transition: color 0.3s;
}

/* BUTTON GROUP */
.nav-buttons {
  display: flex;
  gap: 10px;
}

/* BASE BUTTON (matches your gray DFA buttons) */
.btn {
  padding: 7px 16px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* HOVER */
.btn:hover {
  background: #e2e8f0;
}

/* ACTIVE (matches your green DFA button) */
.btn.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

/* CLICK FEEDBACK */
.btn:active {
  transform: scale(0.96);
}

.dark-mode-toggle {
  padding: 7px 12px;
  font-size: 14px;
}

@media (max-width: 640px) {
  .navbar {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    text-align: center;
  }

  .nav-buttons {
    width: 100%;
    justify-content: center;
    gap: 8px;
  }

  .btn {
    flex: 1;
    padding: 8px 10px;
    font-size: 12px;
    text-align: center;
  }
  
  .dark-mode-toggle {
    flex: 0;
  }
}
</style>