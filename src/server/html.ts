export function renderAppHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Airia Autonomous Operator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --bg: #05080a;
        --panel: #0d1117;
        --panel-border: #21262d;
        --text: #c9d1d9;
        --text-muted: #8b949e;
        --accent: #00f2ff;
        --accent-muted: #00f2ff22;
        --success: #3fb950;
        --warning: #d29922;
        --danger: #f85149;
        --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
      }

      * { box-sizing: border-box; }
      
      body {
        margin: 0;
        font-family: var(--font-sans);
        color: var(--text);
        background-color: var(--bg);
        background-image: 
          radial-gradient(circle at 50% 50%, #161b22 0%, transparent 100%),
          linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px);
        background-size: 100% 100%, 32px 32px, 32px 32px;
        min-height: 100vh;
        overflow-x: hidden;
      }

      body::after {
        content: "";
        position: fixed;
        inset: 0;
        background: linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%);
        background-size: 100% 4px;
        pointer-events: none;
        z-index: 1000;
        opacity: 0.3;
      }

      .app-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 40px 24px;
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: 24px;
        align-items: start;
      }

      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 24px;
        position: sticky;
        top: 40px;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        backdrop-filter: blur(8px);
      }

      .card-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--panel-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255,255,255,0.02);
      }

      .card-header h2 {
        margin: 0;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        font-weight: 700;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
        box-shadow: 0 0 8px var(--text-muted);
      }
      .status-dot.active {
        background: var(--accent);
        box-shadow: 0 0 12px var(--accent);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }

      .brand {
        padding: 0 8px;
      }

      .brand h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        background: linear-gradient(135deg, #fff 0%, var(--accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.02em;
      }

      .brand p {
        margin: 8px 0 0;
        font-size: 14px;
        color: var(--text-muted);
        line-height: 1.5;
      }

      .input-group {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      textarea {
        width: 100%;
        min-height: 100px;
        background: #05080a;
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        padding: 12px;
        color: var(--text);
        font-family: var(--font-sans);
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.2s;
      }

      textarea:focus {
        outline: none;
        border-color: var(--accent);
      }

      .button-row {
        display: flex;
        gap: 12px;
      }

      button {
        flex: 1;
        padding: 12px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .btn-primary {
        background: var(--accent);
        color: #05080a;
      }

      .btn-primary:hover {
        background: #fff;
        box-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
      }

      .btn-secondary {
        background: transparent;
        border: 1px solid var(--panel-border);
        color: var(--text);
      }

      .btn-secondary:hover {
        background: var(--panel-border);
      }

      .telemetry-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1px;
        background: var(--panel-border);
      }

      .telemetry-item {
        background: var(--panel);
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .telemetry-label {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
      }

      .telemetry-value {
        font-family: var(--font-mono);
        font-size: 14px;
        font-weight: 700;
        color: var(--accent);
      }

      .main-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .log-container {
        height: 600px;
        display: flex;
        flex-direction: column;
      }

      .log-stream {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        font-family: var(--font-mono);
        font-size: 13px;
        line-height: 1.6;
        scroll-behavior: smooth;
      }

      .log-stream::-webkit-scrollbar {
        width: 8px;
      }

      .log-stream::-webkit-scrollbar-track {
        background: transparent;
      }

      .log-stream::-webkit-scrollbar-thumb {
        background: var(--panel-border);
        border-radius: 4px;
      }

      .log-entry {
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.03);
        animation: slideIn 0.3s ease-out forwards;
        opacity: 0;
        transform: translateY(10px);
      }

      @keyframes slideIn {
        to { opacity: 1; transform: translateY(0); }
      }

      .entry-header {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 4px;
      }

      .entry-timestamp {
        color: var(--text-muted);
        font-size: 11px;
      }

      .entry-agent {
        color: var(--accent);
        font-weight: 700;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.05em;
        background: var(--accent-muted);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .entry-status {
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 10px;
        text-transform: uppercase;
      }

      .status-running { background: rgba(210, 153, 34, 0.1); color: var(--warning); border: 1px solid rgba(210, 153, 34, 0.2); }
      .status-completed { background: rgba(63, 185, 80, 0.1); color: var(--success); border: 1px solid rgba(63, 185, 80, 0.2); }
      .status-paused_approval { background: rgba(0, 242, 255, 0.1); color: var(--accent); border: 1px solid rgba(0, 242, 255, 0.2); }
      .status-failed, .status-rejected { background: rgba(248, 81, 73, 0.1); color: var(--danger); border: 1px solid rgba(248, 81, 73, 0.2); }

      .entry-message {
        display: block;
        color: var(--text);
        margin-top: 4px;
      }

      .entry-data {
        margin-top: 10px;
        background: rgba(0,0,0,0.3);
        padding: 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: pre-wrap;
        color: #8b949e;
        border: 1px solid var(--panel-border);
      }

      .approval-overlay {
        position: fixed;
        inset: 0;
        background: rgba(5, 8, 10, 0.85);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 24px;
      }

      .approval-overlay.active {
        display: flex;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .approval-card {
        width: 100%;
        max-width: 500px;
        background: var(--panel);
        border: 1px solid var(--warning);
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 0 40px rgba(210, 153, 34, 0.15);
      }

      .approval-card h3 {
        margin: 0 0 12px;
        color: var(--warning);
        font-size: 18px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .approval-card p {
        margin: 0 0 24px;
        color: var(--text-muted);
        line-height: 1.6;
        font-size: 15px;
      }

      .approval-summary {
        margin-top: 1rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .approval-details {
        margin-bottom: 1.5rem;
      }

      .approval-actions {
        display: flex;
        gap: 16px;
      }

      .btn-approve {
        background: var(--success);
        color: #05080a;
      }

      .btn-approve:hover {
        background: #fff;
        box-shadow: 0 0 20px rgba(63, 185, 80, 0.3);
      }

      .btn-reject {
        background: transparent;
        border: 1px solid var(--danger);
        color: var(--danger);
      }

      .btn-reject:hover {
        background: var(--danger);
        color: #05080a;
      }

      @media (max-width: 1100px) {
        .app-container {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <div class="app-container">
      <aside class="sidebar">
        <div class="brand">
          <h1>AIRIA OPERATOR</h1>
          <p>Autonomous Enterprise Orchestration Engine powered by Airia Agents.</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Command Input</h2>
            <div id="activeIndicator" class="status-dot"></div>
          </div>
          <div class="input-group">
            <textarea id="goalInput" placeholder="Enter high-level operational goal...">Onboard Acme Corp (Enterprise Plan, 200 seats)</textarea>
            <div class="button-row">
              <button id="runButton" class="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                EXECUTE
              </button>
              <button id="resetButton" class="btn-secondary">RESET</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Operational Telemetry</h2>
          </div>
          <div class="telemetry-grid">
            <div class="telemetry-item">
              <span class="telemetry-label">Tasks Initialized</span>
              <span id="summaryTasks" class="telemetry-value">0</span>
            </div>
            <div class="telemetry-item">
              <span class="telemetry-label">Email Dispatch</span>
              <span id="summaryEmail" class="telemetry-value">OFFLINE</span>
            </div>
            <div class="telemetry-item">
              <span class="telemetry-label">Slack Integration</span>
              <span id="summarySlack" class="telemetry-value">OFFLINE</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <div class="card log-container">
          <div class="card-header">
            <h2>Live Orchestration Stream</h2>
            <div class="status-dot active"></div>
          </div>
          <div id="log" class="log-stream">
            <div class="log-entry" style="opacity: 0.5; border: none;">
              <span class="entry-message">Waiting for command input...</span>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div id="approvalModal" class="approval-overlay" role="dialog" aria-modal="true">
      <div class="approval-card">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Governance Check Required
        </h3>
        <p id="approvalMessage" class="approval-summary">Outbound external communication requires mandatory human validation.</p>
        <div id="approvalDetails" class="approval-details"></div>
        <div class="approval-actions">
          <button id="approveBtn" class="btn-approve">APPROVE DISPATCH</button>
          <button id="rejectBtn" class="btn-reject">REJECT</button>
        </div>
      </div>
    </div>

    <script>
      const log = document.getElementById('log')
      const goalInput = document.getElementById('goalInput')
      const runButton = document.getElementById('runButton')
      const resetButton = document.getElementById('resetButton')
      const approvalModal = document.getElementById('approvalModal')
      const approvalMessage = document.getElementById('approvalMessage')
      const approveBtn = document.getElementById('approveBtn')
      const rejectBtn = document.getElementById('rejectBtn')
      const summaryTasks = document.getElementById('summaryTasks')
      const summaryEmail = document.getElementById('summaryEmail')
      const summarySlack = document.getElementById('summarySlack')
      const activeIndicator = document.getElementById('activeIndicator')

      let currentWorkflowId = null
      let source = null

      function addLine(event) {
        // Clear placeholder
        if (log.children.length === 1 && log.children[0].style.opacity === '0.5') {
          log.innerHTML = ''
        }

        const entry = document.createElement('div')
        entry.className = 'log-entry'
        
        const timestamp = new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        
        let dataHtml = ''
        if (event.data && Object.keys(event.data).length > 0) {
          dataHtml = \`<div class="entry-data">\${JSON.stringify(event.data, null, 2)}</div>\`
        }

        entry.innerHTML = \`
          <div class="entry-header">
            <span class="entry-timestamp">\${timestamp}</span>
            <span class="entry-agent">\${event.agent}</span>
            <span class="entry-status status-\${event.status}">\${event.status.replace('_', ' ')}</span>
          </div>
          <span class="entry-message">\${event.message}</span>
          \${dataHtml}
        \`
        
        log.appendChild(entry)
        log.scrollTop = log.scrollHeight
      }

      function setSummary(data) {
        if (!data) {
          summaryTasks.textContent = '0'
          summaryEmail.textContent = 'OFFLINE'
          summaryEmail.style.color = ''
          summarySlack.textContent = 'OFFLINE'
          summarySlack.style.color = ''
          return
        }
        summaryTasks.textContent = String(data.tasks_created)
        summaryEmail.textContent = data.email_sent ? 'DISPATCHED' : 'PENDING'
        summaryEmail.style.color = data.email_sent ? 'var(--success)' : 'var(--warning)'
        summarySlack.textContent = data.slack_sent ? 'ACTIVE' : 'PENDING'
        summarySlack.style.color = data.slack_sent ? 'var(--success)' : 'var(--warning)'
      }

      function setApproval(open, eventData) {
        if (eventData) {
          approvalMessage.textContent = eventData.message
          const details = document.getElementById('approvalDetails')
          if (eventData.data && eventData.data.actions) {
            details.innerHTML = '<ul style="text-align: left; margin: 1rem 0; padding-left: 1.5rem; color: var(--text-muted); font-size: 0.9rem;">' + 
              eventData.data.actions.map(a => \`<li style="margin-bottom: 0.4rem;">\${a}</li>\`).join('') + 
              '</ul>'
          } else {
            details.innerHTML = ''
          }
        }
        if (open) {
          approvalModal.classList.add('active')
        } else {
          approvalModal.classList.remove('active')
        }
      }

      async function handleApproval(decision) {
        if (!currentWorkflowId) return
        await fetch('/api/workflow/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_id: currentWorkflowId, decision }),
        })
        setApproval(false)
      }

      async function runWorkflow() {
        const goal = goalInput.value.trim()
        if (!goal) return

        if (source) {
          source.close()
        }
        log.innerHTML = ''
        setSummary(null)
        setApproval(false)
        activeIndicator.classList.add('active')

        const run = await fetch('/api/workflow/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal }),
        }).then((r) => r.json())

        currentWorkflowId = run.workflow_id

        source = new EventSource('/api/workflow/' + currentWorkflowId + '/stream')

        source.addEventListener('workflow_snapshot', (message) => {
          const snapshot = JSON.parse(message.data)
          ;(snapshot.events || []).forEach(addLine)
          if (snapshot.awaitingApproval) {
            const approvalEvent = [...snapshot.events].reverse().find(e => e.status === 'paused_approval')
            setApproval(true, approvalEvent)
          }
          setSummary(snapshot.summary)
          if (snapshot.status === 'completed' || snapshot.status === 'failed' || snapshot.status === 'rejected') {
            activeIndicator.classList.remove('active')
          }
        })

        source.addEventListener('workflow_event', (message) => {
          const event = JSON.parse(message.data)
          addLine(event)

          if (event.status === 'paused_approval') {
            setApproval(true, event)
          }

          if (event.status === 'completed' && event.stepId === 'finalize') {
            activeIndicator.classList.remove('active')
            fetch('/api/workflow/' + currentWorkflowId)
              .then((r) => r.json())
              .then((data) => setSummary(data.summary))
          }

          if (event.status === 'rejected' || event.status === 'failed') {
            activeIndicator.classList.remove('active')
            setApproval(false)
          }
        })
      }

      runButton.addEventListener('click', runWorkflow)
      approveBtn.addEventListener('click', () => handleApproval('approve'))
      rejectBtn.addEventListener('click', () => handleApproval('reject'))
      resetButton.addEventListener('click', async () => {
        await fetch('/api/system/reset', { method: 'POST' })
        if (source) source.close()
        source = null
        currentWorkflowId = null
        log.innerHTML = '<div class="log-entry" style="opacity: 0.5; border: none;"><span class="entry-message">Waiting for command input...</span></div>'
        setSummary(null)
        setApproval(false)
        activeIndicator.classList.remove('active')
      })
    </script>
  </body>
</html>`
}
