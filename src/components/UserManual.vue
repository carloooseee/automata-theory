<script setup>
// Minimalist User Manual with provided content
</script>

<template>
  <div class="manual-plain">
    <h1>User Manual: Automata Simulator</h1>
    
    <section>
      <h2>INTRODUCTION</h2>
      <p>The Automata Simulator is a comprehensive educational tool designed to bridge the gap between theoretical computation and visual representation. It allows users to input regular expressions and observe how they translate into various mathematical models, including Deterministic Finite Automata (DFA), Context-Free Grammars (CFG), and Pushdown Automata (PDA).</p>
    </section>

    <section>
      <h2>GETTING STARTED</h2>
      <h3>System Requirements</h3>
      <p>As a web-based application, the simulator runs on any modern browser (Chrome, Firefox, or Edge). It is optimized for desktop use to provide the best experience for complex flowchart visualizations.</p>
      
      <h3>Initial Setup</h3>
      <ul>
        <li><strong>Selection:</strong> Upon launching the application, locate the sidebar or dropdown menu containing a list of predefined Regular Expression problems.</li>
        <li><strong>Input Testing:</strong> Enter a string (e.g., abbaba) into the designated test field to verify if it belongs to the language defined by the regex.</li>
        <li><strong>Execution:</strong> Click the Simulate button. The system will process the logic and generate the corresponding visualization.</li>
      </ul>
    </section>

    <section>
      <h2>CORE FEATURES & MODULES</h2>
      
      <h3>Deterministic Finite Automata Visualization</h3>
      <p>The DFA module converts the selected regular expression into a state-transition diagram.</p>
      <ul>
        <li><strong>States:</strong> Represented by circles. The start state is indicated by an arrow, and accepting states are denoted by double circles.</li>
        <li><strong>Transitions:</strong> Labeled arrows showing the movement between states based on specific input symbols.</li>
        <li><strong>Interactive Playback:</strong> You can step through the simulation to see the current state highlighted in real-time as the input string is processed.</li>
      </ul>

      <h3>Context-Free Grammar Visualization</h3>
      <p>This module breaks down the language into formal production rules.</p>
      <ul>
        <li><strong>Production Rules:</strong> Displays the variables (non-terminals), terminals, and the derivation steps.</li>
        <li><strong>Structure:</strong> Useful for understanding how strings are "built" from the start symbol according to the grammar's logic.</li>
      </ul>

      <h3>Pushdown Automata Visualization</h3>
      <p>The PDA module introduces the concept of memory using a stack.</p>
      <ul>
        <li><strong>Flowchart View:</strong> Visualizes the logic including the Read, Pop, and Push operations.</li>
        <li><strong>Stack Representation:</strong> A dynamic visual of the stack data structure, showing how symbols are added or removed during the computation process.</li>
      </ul>
    </section>

    <section>
      <h2>TROUBLESHOOTING & FAQ</h2>
      <ul>
        <li><strong>Simulation is slow:</strong> For very complex regular expressions, the DFA generation might take a few seconds. Ensure your browser is up to date.</li>
        <li><strong>String Rejected:</strong> If the simulator shows "Rejected," the input string does not satisfy the rules of the selected Regular Expression. Double-check the transition diagram to see where the string fails.</li>
      </ul>
    </section>

    <section>
      <h2>FULL DOCUMENTATION</h2>
      <p>For a more detailed explanation of the project, including technical documentation and complete user guides, please visit our official Google Docs:</p>
      <a href="https://docs.google.com/document/d/1ny4ccAVK-HR_crp0zBQ0JsBoIXSl3KXw1x4W2Kmc4O8/edit?usp=sharing" target="_blank" class="doc-link">
        View Full Documentation (Google Docs)
      </a>
    </section>

    <section>
      <h2>PROJECT DETAILS</h2>
      <p><strong>Purpose:</strong> Created for academic purposes for the S-CSPC327 - Theory of Automata and Formal Languages course.</p>
      <p><strong>Development Team:</strong> Laran, Juan Carlos (Lead Developer), Melindo, Angel Vhea, Leovonchiong, Lorenz Liu, and Malla, Marielle Joy (Developers).</p>
      <p><strong>Technology Stack:</strong> Framework: Vue.js; Visualization: D3.js; Version Control: Git / GitHub.</p>
    </section>

    <hr />
  </div>
</template>

<style scoped>
.manual-plain {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #000;
  background: #fff;
  line-height: 1.6;
}

h1 {
  text-align: center;
  text-transform: uppercase;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
  margin-bottom: 40px;
}

h2 {
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  padding-bottom: 5px;
  margin-top: 30px;
}

h3 {
  margin-top: 20px;
  text-decoration: underline;
}

section {
  margin-bottom: 40px;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 10px;
}

p {
  margin: 15px 0;
}

.doc-link {
  display: inline-block;
  margin-top: 5px;
  color: #1a73e8;
  font-weight: 600;
  text-decoration: underline;
  transition: color 0.2s;
}

.doc-link:hover {
  color: #174ea6;
}

hr {
  border: none;
  border-top: 1px solid #000;
  margin-top: 60px;
}

strong {
  font-weight: bold;
}
</style>
