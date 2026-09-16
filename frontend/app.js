/**
 * Aryabhata 2.0 — STEM Reasoning Lab Application Logic
 * Integrates Hero Inquiry, AI Tutor Chat, Adaptive DAG, BKT Mastery & Chart.js Benchmarks
 * Strictly preserves 100% of existing API endpoints, payloads, and response shapes.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  let conversationHistory = [];
  let isGenerating = false;
  let benchmarkChartInstance = null;

  // DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const promptInput = document.getElementById("prompt-input");
  const btnSend = document.getElementById("btn-send");
  const btnNewChat = document.getElementById("btn-new-chat");
  const btnClearChat = document.getElementById("btn-clear-chat");
  const welcomeCard = document.getElementById("welcome-card");
  const serverStatus = document.getElementById("server-status");
  const statusPulse = document.getElementById("status-pulse");
  const globalSpeedPill = document.getElementById("global-speed-pill");
  const globalSpeedVal = document.getElementById("global-speed-val");

  const tabChat = document.getElementById("tab-chat");
  const tabBenchmarks = document.getElementById("tab-benchmarks");
  const chatView = document.getElementById("chat-view");
  const benchmarksView = document.getElementById("benchmarks-view");
  const btnRefreshBenchmarks = document.getElementById("btn-refresh-benchmarks");

  const inDistTableBody = document.getElementById("in-dist-table-body");
  const oodTableBody = document.getElementById("ood-table-body");
  const localBenchmarksContainer = document.getElementById("local-benchmarks-container");
  const mathAmbientLayer = document.getElementById("math-ambient-layer");

  // Hero Quick Inquiry Elements
  const heroQuickPrompt = document.getElementById("hero-quick-prompt");
  const heroQuickSubmit = document.getElementById("hero-quick-submit");

  // =========================================================================
  // 1. Ambient Floating Mathematical Glyphs Generator
  // =========================================================================
  function initAmbientMathLayer() {
    if (!mathAmbientLayer) return;
    
    // Respect OS prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const glyphs = ["π", "ε", "∑", "∫", "Δ", "√", "∞", "θ", "λ", "∇", "±", "≈", "ƒ(x)", "∂", "∏", "Ω", "ℏ", "φ"];
    const totalGlyphs = 28;

    for (let i = 0; i < totalGlyphs; i++) {
      const span = document.createElement("span");
      span.className = "math-glyph";
      span.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];

      const startX = Math.random() * 96; // vw
      const startY = Math.random() * 95; // vh
      const fontSize = 16 + Math.random() * 26; // px
      const opacity = 0.04 + Math.random() * 0.12;
      const duration = 20 + Math.random() * 25; // seconds
      const delay = Math.random() * 10 * -1;
      const dx = (Math.random() - 0.5) * 60;
      const dy = (Math.random() - 0.5) * 60;
      const drot = (Math.random() - 0.5) * 40;

      span.style.left = `${startX}vw`;
      span.style.top = `${startY}vh`;
      span.style.fontSize = `${fontSize}px`;
      span.style.opacity = opacity.toFixed(3);
      span.style.animationDuration = `${duration.toFixed(1)}s`;
      span.style.animationDelay = `${delay.toFixed(1)}s`;
      span.style.setProperty("--dx", `${dx.toFixed(0)}px`);
      span.style.setProperty("--dy", `${dy.toFixed(0)}px`);
      span.style.setProperty("--drot", `${drot.toFixed(0)}deg`);

      mathAmbientLayer.appendChild(span);
    }
  }

  initAmbientMathLayer();

  // =========================================================================
  // 2. Tab & Navigation View Management
  // =========================================================================
  function switchTab(target) {
    if (target === "chat") {
      tabChat.classList.add("active");
      tabBenchmarks.classList.remove("active");
      chatView.classList.add("active");
      benchmarksView.classList.remove("active");
      const ws = document.getElementById("workspace-section");
      if (ws) ws.scrollIntoView({ behavior: "smooth" });
    } else {
      tabBenchmarks.classList.add("active");
      tabChat.classList.remove("active");
      const mb = document.getElementById("model-benchmarks");
      if (mb) mb.scrollIntoView({ behavior: "smooth" });
      loadBenchmarks();
    }
  }

  tabChat.addEventListener("click", () => switchTab("chat"));
  tabBenchmarks.addEventListener("click", () => switchTab("benchmarks"));
  if (btnRefreshBenchmarks) {
    btnRefreshBenchmarks.addEventListener("click", () => loadBenchmarks());
  }

  // Smooth Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // =========================================================================
  // 3. Health Status Polling (GET /health)
  // =========================================================================
  async function checkHealth() {
    try {
      const res = await fetch("/health");
      if (res.ok) {
        const data = await res.json();
        if (data.model_loaded) {
          serverStatus.textContent = `Online (${data.device})`;
          serverStatus.className = "badge-status";
          if (statusPulse) statusPulse.style.backgroundColor = "var(--accent-green)";
        } else {
          serverStatus.textContent = "Weights Pending";
          serverStatus.className = "badge-status offline";
          if (statusPulse) statusPulse.style.backgroundColor = "var(--accent-amber)";
        }
      } else {
        serverStatus.textContent = "Offline";
        serverStatus.className = "badge-status offline";
        if (statusPulse) statusPulse.style.backgroundColor = "var(--accent-orange)";
      }
    } catch (e) {
      serverStatus.textContent = "Offline";
      serverStatus.className = "badge-status offline";
      if (statusPulse) statusPulse.style.backgroundColor = "var(--accent-orange)";
    }
  }

  setInterval(checkHealth, 10000);
  checkHealth();

  // =========================================================================
  // 4. Mathematical Formatting & KaTeX
  // =========================================================================
  function filterHiddenCoT(rawText) {
    if (!rawText) return "";
    return rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }

  function renderMath(element) {
    if (window.renderMathInElement) {
      window.renderMathInElement(element, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    }
  }

  // Auto-render KaTeX on whole document once loaded
  renderMath(document.body);

  // =========================================================================
  // 5. Append Message & Motion One Animations
  // =========================================================================
  function appendMessage(role, text, metrics = null) {
    if (welcomeCard) {
      welcomeCard.style.display = "none";
    }

    const row = document.createElement("div");
    row.className = `message-row ${role}-row`;

    const avatar = document.createElement("div");
    avatar.className = `avatar ${role}-avatar`;
    avatar.textContent = role === "user" ? "U" : "आ";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    const cleanedText = role === "assistant" ? filterHiddenCoT(text) : text;
    if (window.marked) {
      contentDiv.innerHTML = marked.parse(cleanedText);
    } else {
      contentDiv.textContent = cleanedText;
    }

    bubble.appendChild(contentDiv);

    // Assistant Performance & Token Stats
    if (role === "assistant" && metrics) {
      const meta = document.createElement("div");
      meta.className = "message-meta";

      const timeSpan = document.createElement("span");
      timeSpan.textContent = `⏱️ ${metrics.generation_time.toFixed(2)}s`;
      meta.appendChild(timeSpan);

      const speedSpan = document.createElement("span");
      speedSpan.textContent = `⚡ ${metrics.tokens_per_sec.toFixed(1)} t/s`;
      meta.appendChild(speedSpan);

      const tokenSpan = document.createElement("span");
      tokenSpan.textContent = `📊 In: ${metrics.input_tokens} | Out: ${metrics.output_tokens}`;
      meta.appendChild(tokenSpan);

      const copyBtn = document.createElement("button");
      copyBtn.className = "btn-copy";
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg> Copy
      `;
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(cleanedText).then(() => {
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg> Copy
            `;
          }, 2000);
        });
      });
      meta.appendChild(copyBtn);

      bubble.appendChild(meta);

      if (globalSpeedPill && globalSpeedVal) {
        globalSpeedPill.style.display = "inline-flex";
        globalSpeedVal.textContent = `${metrics.tokens_per_sec.toFixed(1)} t/s`;
      }
    }

    if (role === "user") {
      row.appendChild(bubble);
      row.appendChild(avatar);
    } else {
      row.appendChild(avatar);
      row.appendChild(bubble);
    }

    chatMessages.appendChild(row);
    renderMath(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Motion One: Smooth spring entrance
    if (window.Motion && window.Motion.animate) {
      window.Motion.animate(
        row,
        { opacity: [0, 1], transform: ["translateY(16px) scale(0.98)", "translateY(0px) scale(1)"] },
        { duration: 0.35, easing: [0.16, 1, 0.3, 1] }
      );
    }

    return bubble;
  }

  // =========================================================================
  // 6. Loading Indicator
  // =========================================================================
  function showLoading() {
    const row = document.createElement("div");
    row.className = "message-row assistant-row loading-row";
    row.id = "loading-row";

    const avatar = document.createElement("div");
    avatar.className = "avatar assistant-avatar";
    avatar.textContent = "आ";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const loader = document.createElement("div");
    loader.className = "loading-indicator";
    loader.innerHTML = `
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    `;

    bubble.appendChild(loader);
    row.appendChild(avatar);
    row.appendChild(bubble);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (window.Motion && window.Motion.animate) {
      window.Motion.animate(
        row,
        { opacity: [0, 1], transform: ["translateY(10px)", "translateY(0px)"] },
        { duration: 0.25 }
      );
    }
  }

  function hideLoading() {
    const loadingRow = document.getElementById("loading-row");
    if (loadingRow) {
      loadingRow.remove();
    }
  }

  // =========================================================================
  // 7. Handle Form Submission (POST /chat)
  // =========================================================================
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    const text = promptInput.value.trim();
    if (!text || isGenerating) return;

    promptInput.value = "";
    promptInput.style.height = "auto";
    isGenerating = true;
    btnSend.disabled = true;

    conversationHistory.push({ role: "user", content: text });
    appendMessage("user", text);

    showLoading();

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory
        })
      });

      hideLoading();

      if (response.ok) {
        const data = await response.json();
        const assistantText = data.response || "No response received.";
        conversationHistory.push({ role: "assistant", content: assistantText });
        appendMessage("assistant", assistantText, {
          generation_time: data.generation_time,
          tokens_per_sec: data.tokens_per_sec,
          input_tokens: data.input_tokens,
          output_tokens: data.output_tokens
        });
      } else {
        const err = await response.json().catch(() => ({ detail: "Network request failed" }));
        appendMessage("assistant", `**Error**: ${err.detail || "Server communication error."}`);
      }
    } catch (err) {
      hideLoading();
      appendMessage("assistant", `**Connection Error**: Failed to reach inference backend (${err.message}).`);
    } finally {
      isGenerating = false;
      btnSend.disabled = false;
      promptInput.focus();
    }
  }

  chatForm.addEventListener("submit", handleSubmit);

  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  });

  // Example Prompt Buttons
  document.querySelectorAll(".example-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) {
        promptInput.value = prompt;
        handleSubmit();
      }
    });
  });

  // Quick Strategy Action Buttons
  document.querySelectorAll(".strategy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      let text = "";
      if (action === "hint") text = "Can you provide a gentle hint for this problem without giving away the full solution?";
      else if (action === "example") text = "Could you demonstrate a similar worked example to help me understand the concept?";
      else if (action === "explain") text = "Can you re-explain the underlying mathematical principle step by step?";
      else if (action === "practice") text = "Please give me a practice problem on this topic to test my understanding.";

      if (text) {
        promptInput.value = text;
        handleSubmit();
      }
    });
  });

  // Hero Quick Inquiry Handler
  function handleHeroInquiry() {
    if (!heroQuickPrompt) return;
    const q = heroQuickPrompt.value.trim();
    if (!q) return;

    heroQuickPrompt.value = "";
    promptInput.value = q;
    
    // Smooth scroll down to workspace
    const ws = document.getElementById("workspace-section");
    if (ws) ws.scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      handleSubmit();
    }, 400);
  }

  if (heroQuickSubmit) {
    heroQuickSubmit.addEventListener("click", handleHeroInquiry);
  }
  if (heroQuickPrompt) {
    heroQuickPrompt.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleHeroInquiry();
      }
    });
  }

  // New / Clear Chat
  btnNewChat.addEventListener("click", () => {
    conversationHistory = [];
    chatMessages.innerHTML = "";
    if (welcomeCard) {
      welcomeCard.style.display = "block";
      chatMessages.appendChild(welcomeCard);
      renderMath(welcomeCard);
    }
    promptInput.value = "";
  });

  btnClearChat.addEventListener("click", () => {
    conversationHistory = [];
    chatMessages.innerHTML = "";
    if (welcomeCard) {
      welcomeCard.style.display = "block";
      chatMessages.appendChild(welcomeCard);
      renderMath(welcomeCard);
    }
  });

  // =========================================================================
  // 8. Chart.js Benchmark Visualization
  // =========================================================================
  function renderBenchmarkChart(official) {
    const canvas = document.getElementById("benchmark-chart");
    if (!canvas || !window.Chart) return;

    if (benchmarkChartInstance) {
      benchmarkChartInstance.destroy();
    }

    const ctx = canvas.getContext("2d");
    const labels = ["JEE Adv. '25", "NEET '25", "JEE Main '25", "AIME", "HMMT", "GPQA"];

    const datasets = [
      {
        label: "Aryabhata 2.0 (Ours)",
        data: [86.51, 84.66, 87.80, 86.67, 78.96, 74.86],
        backgroundColor: "#1d4ed8",
        borderColor: "#1e40af",
        borderWidth: 1.5,
        borderRadius: 6,
        order: 1
      },
      {
        label: "Gemini 2.5 Flash",
        data: [96.81, 90.00, 87.26, 66.61, 59.13, 75.09],
        backgroundColor: "#6366f1",
        borderColor: "#4f46e5",
        borderWidth: 1,
        borderRadius: 4,
        order: 2
      },
      {
        label: "GPT-5 Mini",
        data: [93.65, 87.33, 87.07, 83.33, 70.97, 75.46],
        backgroundColor: "#0ea5e9",
        borderColor: "#0284c7",
        borderWidth: 1,
        borderRadius: 4,
        order: 3
      },
      {
        label: "Qwen3-30B (Thinking)",
        data: [90.48, 86.00, 84.89, 84.58, 51.88, 73.31],
        backgroundColor: "#cbd5e1",
        borderColor: "#94a3b8",
        borderWidth: 1,
        borderRadius: 4,
        order: 4
      }
    ];

    benchmarkChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#334155",
              font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 12, weight: "600" },
              boxWidth: 14,
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: "#0f172a",
            titleColor: "#f8fafc",
            bodyColor: "#38bdf8",
            borderColor: "#334155",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`
            }
          }
        },
        scales: {
          x: {
            grid: { color: "#f1f5f9" },
            ticks: { color: "#64748b", font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 11, weight: "600" } }
          },
          y: {
            min: 40,
            max: 100,
            grid: { color: "#f1f5f9" },
            ticks: {
              color: "#64748b",
              font: { family: "'Fira Code', monospace", size: 11, weight: "600" },
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }

  // =========================================================================
  // 9. Benchmarks Data Loader (GET /benchmarks)
  // =========================================================================
  async function loadBenchmarks() {
    try {
      const res = await fetch("/benchmarks");
      if (!res.ok) return;
      const data = await res.json();

      const official = data.official_model_card_results;
      const local = data.local_benchmark_results;

      // Render Visual Comparison Chart
      renderBenchmarkChart(official);

      // Populate In-Dist Table
      if (official && official.in_distribution && official.in_distribution.comparison_table) {
        inDistTableBody.innerHTML = "";
        official.in_distribution.comparison_table.forEach((row) => {
          const tr = document.createElement("tr");
          if (row.highlight) tr.className = "highlight-row";
          tr.innerHTML = `
            <td><strong>${row.model}</strong></td>
            <td>${row.jee_adv_2025.toFixed(2)}%</td>
            <td>${row.neet_2025.toFixed(2)}%</td>
            <td>${row.jee_main_2025.toFixed(2)}%</td>
            <td>${row.jee_main_2026.toFixed(2)}%</td>
            <td><strong>${row.avg.toFixed(2)}%</strong></td>
          `;
          inDistTableBody.appendChild(tr);
        });
      }

      // Populate OOD Table
      if (official && official.out_of_distribution && official.out_of_distribution.comparison_table) {
        oodTableBody.innerHTML = "";
        official.out_of_distribution.comparison_table.forEach((row) => {
          const tr = document.createElement("tr");
          if (row.highlight) tr.className = "highlight-row";
          tr.innerHTML = `
            <td><strong>${row.model}</strong></td>
            <td>${row.aime.toFixed(2)}%</td>
            <td>${row.hmmt.toFixed(2)}%</td>
            <td>${row.gpqa.toFixed(2)}%</td>
            <td>${row.mmlu_pro.toFixed(2)}%</td>
            <td><strong>${row.avg.toFixed(2)}%</strong></td>
          `;
          oodTableBody.appendChild(tr);
        });
      }

      // Populate Local Benchmarks
      if (local && local.has_local_results && local.results.length > 0) {
        localBenchmarksContainer.innerHTML = "";
        local.results.forEach((run) => {
          const card = document.createElement("div");
          card.className = "glass-panel";
          card.style.marginBottom = "14px";
          card.innerHTML = `
            <div class="kpi-meta" style="margin-bottom: 12px;">
              <h3 style="font-size: 0.95rem; font-weight: 700; color: #fff;">${run.benchmark_name}</h3>
              <span class="kpi-pill neon">${new Date(run.timestamp).toLocaleString()}</span>
            </div>
            <div style="display: flex; gap: 20px; font-size: 0.84rem;">
              <div><span style="color: var(--text-muted);">Total Evaluated:</span> <strong>${run.total_evaluated}</strong></div>
              <div><span style="color: var(--text-muted);">Output Tokens:</span> <strong>${run.total_output_tokens}</strong></div>
              <div><span style="color: var(--text-muted);">Avg Speed:</span> <strong style="color: var(--accent-cyan);">${run.average_tokens_per_sec.toFixed(2)} t/s</strong></div>
            </div>
          `;
          localBenchmarksContainer.appendChild(card);
        });
      } else {
        localBenchmarksContainer.innerHTML = `
          <div class="empty-state" id="empty-local-state">
            <div class="empty-icon">📁</div>
            <p class="empty-title">No local benchmark results available.</p>
            <span class="empty-sub">To evaluate on local datasets, run: <code>python scripts/run_benchmark.py --dataset path/to/data.jsonl</code></span>
          </div>
        `;
      }
    } catch (e) {
      console.error("Failed to load benchmarks:", e);
    }
  }

  // Initial load
  loadBenchmarks();
});
