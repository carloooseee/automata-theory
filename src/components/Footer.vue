<template>
  <footer class="bottom-navbar">
    <div class="footer-content">
      <div class="course-info">
        AUTOMATA THEORY AND FORMAL LANGUAGES <strong>DLSUD</strong>
      </div>
      <div class="team-info">
        led and developed by 
        <span>juan carlos s. laran</span>, 
        <span>angel vhea melindo</span>, 
        <span>lorenz lie leovonchiong</span>, 
        <span>marielle joy malla</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.bottom-navbar {
  width: 100%;
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 16px 24px;
  border-top: 1px solid #313244;
  margin-top: 40px;
  font-family: 'Inter', 'Segoe UI', sans-serif;
}

.footer-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.course-info {
  font-size: 13px;
  letter-spacing: 0.05em;
  font-weight: 500;
  text-transform: uppercase;
}

.course-info strong {
  color: #4caf50; /* DLSUD green vibe */
  margin-left: 4px;
}

.team-info {
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
  line-height: 1.4;
}

.team-info span {
  color: #f8fafc;
  font-weight: 500;
  text-transform: capitalize;
}

@media (max-width: 850px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .team-info {
    text-align: center;
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .bottom-navbar {
    padding: 24px 16px;
    box-sizing: border-box;
  }
}
</style>
