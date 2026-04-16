<script setup>
// Minimalist User Manual component
</script>

<template>
  <div class="manual-plain">
    <h1>Automata Simulator - User Manual</h1>
    
    <section>
      <h2>Developers</h2>
      <ul>
        <li>Laran, Juan Carlos (Leader)</li>
        <li>Melindo, Angel Vhea</li>
        <li>Leovonchiong, Lorenz Liu</li>
        <li>Malla, Marielle Joy</li>
      </ul>
    </section>

    <section>
      <h2>Getting Started</h2>
      <p>1. Select a problem from the list of regular expressions.</p>
      <p>2. Enter strings in the input fields to test them against the selected regex.</p>
      <p>3. Use the "Simulate" button to run the visualization.</p>
      <p>4. Switch between DFA, CFG, and PDA views to see different representations.</p>
    </section>

    <section>
      <h2>Features</h2>
      <h3>DFA Visualization</h3>
      <p>Shows the Deterministic Finite Automata states and transitions for the given regex.</p>
      
      <h3>CFG Visualization</h3>
      <p>Displays the Context-Free Grammar production rules.</p>
      
      <h3>PDA Visualization</h3>
      <p>Shows the Pushdown Automata flowchart including read, pop, and push operations.</p>
    </section>

    <hr />
    <p>&copy; 2024 Automata Theory Project</p>
  </div>
</template>

<style scoped>
.manual-plain {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: #000;
  background: #fff;
  font-family: serif; /* Using a simple serif font for a "text-only" feel */
  line-height: 1.5;
}

h1, h2, h3 {
  color: #000;
  border-bottom: 1px solid #000;
  padding-bottom: 5px;
}

section {
  margin-bottom: 30px;
}

ul {
  list-style-type: square;
}

p {
  margin: 10px 0;
}

hr {
  border: none;
  border-top: 1px solid #000;
}
</style>
