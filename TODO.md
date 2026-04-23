# CFG Simulation Enhancement TODO

Status: In Progress

## Breakdown of Approved Plan

1. **[DONE] Fix CFG data structure** in CFGVisualization.vue: Convert productions alts[] to proper rhs arrays for simulation. Added processedCFG computed.
2. **[DONE] Add simulation state** (stepIndex, isRunning, done, simResult refs like DFA).
3. **[DONE] Implement runCFGSimulation(input)**: Leftmost derivation simulator with step trace.
**All steps complete.** CFG now has full DFA-like simulation: tape, step-by-step derivation, rule highlighting, auto-animation, accept/reject.

Next: Production D3 tree enhancement optional.


Next step: Implement step 3 (CFG simulator function).


