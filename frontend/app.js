/**
 * STEM Chat and Benchmark UI Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // State
  let conversationHistory = [];
  let isGenerating = false;

  // DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const promptInput = document.getElementById("prompt-input");
  const btnSend = document.getElementById("btn-send");
  const btnNewChat = document.getElementById("btn-new-chat");
  const btnClearChat = document.getElementById("btn-clear-chat");
  const welcomeCard = document.getElementById("welcome-card");
  const serverStatus = document.getElementById("server-status");
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

  // Tab Switching
  function switchTab(target) {
    if (target === "chat") {
      tabChat.classList.add("active");
      tabBenchmarks.classList.remove("active");
      chatView.classList.add("active");
      benchmarksView.classList.remove("active");
    } else {
      tabBenchmarks.classList.add("active");
      tabChat.classList.remove("active");
      benchmarksView.classList.add("active");
      chatView.classList.remove("active");
      loadBenchmarks();
    }
  }

  tabChat.addEventListener("click", () => switchTab("chat"));
  tabBenchmarks.addEventListener("click", () => switchTab("benchmarks"));
  btnRefreshBenchmarks.addEventListener("click", () => loadBenchmarks());

  // Check Backend Health
  async function checkHealth() {
    try {
      const res = await fetch("/health");
      if (res.ok) {
        const data = await res.json();
        if (data.model_loaded) {
          serverStatus.textContent = `Online (${data.device})`;
          serverStatus.className = "badge-status";
        } else {
          serverStatus.textContent = "Weights Pending";
          serverStatus.className = "badge-status offline";
        }
      } else {
        serverStatus.textContent = "Offline";
        serverStatus.className = "badge-status offline";
      }
    } catch (e) {
      serverStatus.textContent = "Offline";
      serverStatus.className = "badge-status offline";
    }
  }

  setInterval(checkHealth, 10000);
  checkHealth();

  // Clean hidden chain of thought tokens
  function filterHiddenCoT(rawText) {
    if (!rawText) return "";
    // Strip <think>...</think> blocks
    return rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }

  // Render Math with KaTeX
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

  // Append Message
  function appendMessage(role, text, metrics = null) {
    if (welcomeCard) {
      welcomeCard.style.display = "none";
    }

    const row = document.createElement("div");
    row.className = `message-row ${role}-row`;

    const avatar = document.createElement("div");
    avatar.className = `avatar ${role}-avatar`;
    avatar.textContent = role === "user" ? "U" : "AI";

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

    // If assistant metrics exist, render latency & token metrics
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

      // Update global speed pill
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
    return bubble;
  }

  // Show Loading Indicator
  function showLoading() {
    const row = document.createElement("div");
    row.className = "message-row assistant-row loading-row";
    row.id = "loading-row";

    const avatar = document.createElement("div");
    avatar.className = "avatar assistant-avatar";
    avatar.textContent = "AI";

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
  }

  function hideLoading() {
    const loadingRow = document.getElementById("loading-row");
    if (loadingRow) {
      loadingRow.remove();
    }
  }

  // Handle Form Submission
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    const text = promptInput.value.trim();
    if (!text || isGenerating) return;

    promptInput.value = "";
    promptInput.style.height = "auto";
    isGenerating = true;
    btnSend.disabled = true;

    // Add user message to history
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

  // New / Clear Chat
  btnNewChat.addEventListener("click", () => {
    conversationHistory = [];
    chatMessages.innerHTML = "";
    if (welcomeCard) {
      welcomeCard.style.display = "block";
      chatMessages.appendChild(welcomeCard);
    }
    promptInput.value = "";
  });

  btnClearChat.addEventListener("click", () => {
    conversationHistory = [];
    chatMessages.innerHTML = "";
    if (welcomeCard) {
      welcomeCard.style.display = "block";
      chatMessages.appendChild(welcomeCard);
    }
  });

  // Benchmarks Loader
  async function loadBenchmarks() {
    try {
      const res = await fetch("/benchmarks");
      if (!res.ok) return;
      const data = await res.json();

      const official = data.official_model_card_results;
      const local = data.local_benchmark_results;

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
            <td>${row.mmlu_redux.toFixed(2)}%</td>
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
          card.className = "metric-card";
          card.style.marginBottom = "14px";
          card.innerHTML = `
            <div class="metric-header">
              <h3>${run.benchmark_name}</h3>
              <span class="category-tag">${new Date(run.timestamp).toLocaleString()}</span>
            </div>
            <div class="metric-list">
              <div class="metric-row"><span>Total Evaluated</span><strong>${run.total_evaluated} questions</strong></div>
              <div class="metric-row"><span>Output Tokens</span><strong>${run.total_output_tokens}</strong></div>
              <div class="metric-row"><span>Avg Generation Speed</span><strong class="highlight-val">${run.average_tokens_per_sec.toFixed(2)} t/s</strong></div>
            </div>
          `;
          localBenchmarksContainer.appendChild(card);
        });
      } else {
        localBenchmarksContainer.innerHTML = `
          <div class="empty-state">
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

  // Load benchmarks initially in background
  loadBenchmarks();
});
