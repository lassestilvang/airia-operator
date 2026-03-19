export function renderAppHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Airia Autonomous Operator</title>
    <style>
      :root {
        --bg: #0e1a21;
        --panel: #132734;
        --panel-2: #163140;
        --text: #e6f2ff;
        --muted: #98b6cc;
        --accent: #27c89a;
        --warning: #ffbe55;
        --danger: #ff7a7a;
        --line: #244a5f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial;
        color: var(--text);
        background:
          radial-gradient(1200px 500px at -10% -10%, #1f4659 0%, transparent 65%),
          radial-gradient(1200px 600px at 110% -20%, #214558 0%, transparent 60%),
          var(--bg);
        min-height: 100vh;
      }
      .shell {
        width: min(1100px, 92vw);
        margin: 24px auto;
        display: grid;
        gap: 18px;
      }
      .card {
        border: 1px solid var(--line);
        background: linear-gradient(180deg, var(--panel), var(--panel-2));
        border-radius: 14px;
        padding: 16px;
      }
      h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
      }
      .sub {
        color: var(--muted);
        margin: 0;
      }
      .row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 14px;
      }
      input {
        flex: 1;
        min-width: 260px;
        border-radius: 10px;
        border: 1px solid var(--line);
        background: #0f2430;
        color: var(--text);
        padding: 10px 12px;
        font-size: 14px;
      }
      button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        cursor: pointer;
        font-weight: 700;
      }
      .primary { background: var(--accent); color: #072c21; }
      .secondary { background: #1d3f52; color: var(--text); }
      .danger { background: var(--danger); color: #2d0505; }
      .warning { background: var(--warning); color: #3b2a05; }
      .log {
        min-height: 260px;
        max-height: 480px;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #0b1c25;
        padding: 8px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace;
        font-size: 13px;
      }
      .line {
        padding: 8px;
        border-bottom: 1px solid #173443;
      }
      .line:last-child { border-bottom: 0; }
      .line .meta { color: var(--muted); font-size: 11px; }
      .badge {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 999px;
        border: 1px solid var(--line);
        font-size: 11px;
        margin-right: 6px;
      }
      .badge.running { color: var(--warning); border-color: #6f5524; }
      .badge.completed { color: var(--accent); border-color: #1f5f4a; }
      .badge.paused_approval { color: #ffd98c; border-color: #8a6730; }
      .badge.failed, .badge.rejected { color: var(--danger); border-color: #6a3434; }
      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .summary .item {
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 10px;
      }
      .summary .label { color: var(--muted); font-size: 12px; }
      .summary .value { margin-top: 4px; font-size: 18px; font-weight: 800; }
      .approval {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .approval.open { display: flex; }
      .approval .modal {
        width: min(560px, 96vw);
        border: 1px solid #8a6730;
        background: #1e2f3a;
        border-radius: 14px;
        padding: 16px;
      }
      .muted { color: var(--muted); }
      @media (max-width: 760px) {
        .summary { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="card">
        <h1>Airia Auto-Operator</h1>
        <p class="sub">API-first setup, visible orchestration, human approval before external email.</p>
        <div class="row">
          <input id="goalInput" value="Onboard Acme Corp (Enterprise Plan, 200 seats)" />
          <button class="primary" id="runButton">Run Workflow</button>
          <button class="secondary" id="resetButton">Clear Operational State</button>
        </div>
      </section>

      <section class="card">
        <h2>Live Execution Log</h2>
        <p class="sub">Planner → CRM → Docs → Ops → Governance → Comms</p>
        <div id="log" class="log"></div>
      </section>

      <section class="card">
        <h2>Final Summary</h2>
        <div class="summary">
          <div class="item">
            <div class="label">Tasks Created</div>
            <div class="value" id="summaryTasks">-</div>
          </div>
          <div class="item">
            <div class="label">Email Sent</div>
            <div class="value" id="summaryEmail">-</div>
          </div>
          <div class="item">
            <div class="label">Slack Notified</div>
            <div class="value" id="summarySlack">-</div>
          </div>
        </div>
      </section>
    </main>

    <div id="approvalModal" class="approval" role="dialog" aria-modal="true">
      <div class="modal">
        <h3>Human Approval Required</h3>
        <p id="approvalMessage" class="muted">Approve sending onboarding email?</p>
        <div class="row">
          <button id="approveBtn" class="primary">Approve</button>
          <button id="rejectBtn" class="danger">Reject</button>
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

      let currentWorkflowId = null
      let source = null

      function addLine(event) {
        const row = document.createElement('div')
        row.className = 'line'
        row.innerHTML = [
          '<span class="badge ' + event.status + '">' + event.status + '</span>',
          '<strong>' + event.agent + '</strong> · ' + event.message,
          '<div class="meta">' + new Date(event.timestamp).toLocaleTimeString() + ' · ' + event.stepId + '</div>',
        ].join('')
        log.appendChild(row)
        log.scrollTop = log.scrollHeight
      }

      function setSummary(data) {
        if (!data) return
        summaryTasks.textContent = String(data.tasks_created)
        summaryEmail.textContent = data.email_sent ? 'Yes' : 'No'
        summarySlack.textContent = data.slack_sent ? 'Yes' : 'No'
      }

      function setApproval(open, text) {
        if (text) approvalMessage.textContent = text
        approvalModal.classList.toggle('open', open)
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
            setApproval(true, 'Approve sending onboarding email?')
          }
          setSummary(snapshot.summary)
        })

        source.addEventListener('workflow_event', (message) => {
          const event = JSON.parse(message.data)
          addLine(event)

          if (event.status === 'paused_approval') {
            const recipient = event.data && event.data.contact_email ? ' to ' + event.data.contact_email : ''
            setApproval(true, 'Approve sending onboarding email' + recipient + '?')
          }

          if (event.status === 'completed' && event.stepId === 'finalize') {
            fetch('/api/workflow/' + currentWorkflowId)
              .then((r) => r.json())
              .then((data) => setSummary(data.summary))
          }

          if (event.status === 'rejected' || event.status === 'failed') {
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
        log.innerHTML = ''
        setSummary(null)
        setApproval(false)
      })
    </script>
  </body>
</html>`
}
