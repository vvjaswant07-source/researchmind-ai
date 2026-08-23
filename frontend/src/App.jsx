import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./index.css";

const agents = [
  {
    id: 1,
    name: "Research Agent",
    icon: "🔎",
    description: "Searches the web and collects relevant research information.",
    task: "Enter a research topic and the agent will collect relevant information.",
  },
  {
    id: 2,
    name: "PDF Analysis Agent",
    icon: "📄",
    description: "Reads and analyzes uploaded PDF documents.",
    task: "Upload a PDF and ask questions about its contents.",
  },
  {
    id: 3,
    name: "Knowledge Agent",
    icon: "🧠",
    description: "Retrieves information from your private knowledge base.",
    task: "Ask questions using information stored in your knowledge base.",
  },
  {
    id: 4,
    name: "Report Writer Agent",
    icon: "📝",
    description: "Creates structured research reports automatically.",
    task: "Give a topic and generate a professional research report.",
  },
  {
    id: 5,
    name: "Citation Agent",
    icon: "🔗",
    description: "Generates and manages citations and references.",
    task: "Add your sources and generate properly formatted citations.",
  },
  {
    id: 6,
    name: "Fact Checker Agent",
    icon: "✅",
    description: "Checks claims and identifies potentially incorrect information.",
    task: "Enter a claim and the agent will analyze its reliability.",
  },
  {
    id: 7,
    name: "Visualization Agent",
    icon: "📊",
    description: "Creates useful charts and visual representations.",
    task: "Provide research data and generate useful visualizations.",
  },
  {
    id: 8,
    name: "Summary Agent",
    icon: "📋",
    description: "Converts long research material into concise summaries.",
    task: "Paste or upload content and generate a concise summary.",
  },
  {
    id: 9,
    name: "Orchestrator Agent",
    icon: "⚡",
    description:
      "Coordinates all AI agents and manages the complete workflow.",
    task:
      "Give one research request and let the orchestrator coordinate the required agents.",
  },
];

const API_BASE_URL = "https://researchmind-ai-r5f5.onrender.com";
const STORAGE_KEY = "researchmind-chat-memory";

function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function App() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [showMemory, setShowMemory] = useState(false);

  // PDF state
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Report export state
  const [exportingFormat, setExportingFormat] = useState(null);

  const savedMemory = useMemo(() => loadMemory(), []);

  useEffect(() => {
    if (!selectedAgent || !memoryEnabled) return;

    const nextMemory = {
      ...loadMemory(),
      [selectedAgent.name]: messages,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextMemory)
    );
  }, [
    messages,
    selectedAgent,
    memoryEnabled,
  ]);

  // ==========================================================
  // OPEN AGENT
  // ==========================================================

  const openAgent = (agent) => {
    setSelectedAgent(agent);

    setInput("");
    setLoading(false);

    setSelectedFile(null);
    setDocumentId(null);
    setUploadStatus("");

    if (
      memoryEnabled &&
      savedMemory[agent.name]?.length
    ) {
      setMessages(
        savedMemory[agent.name]
      );
    } else {
      setMessages([]);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // CLOSE AGENT
  // ==========================================================

  const closeAgent = () => {
    setSelectedAgent(null);

    setInput("");
    setMessages([]);
    setLoading(false);

    setSelectedFile(null);
    setDocumentId(null);
    setUploadStatus("");
  };

  // ==========================================================
  // NEW CONVERSATION
  // ==========================================================

  const newConversation = () => {
    setInput("");
    setMessages([]);
    setLoading(false);

    setSelectedFile(null);
    setDocumentId(null);
    setUploadStatus("");

    setMenuOpen(false);
  };

  // ==========================================================
  // CLEAR MEMORY
  // ==========================================================

  const clearMemory = () => {
    localStorage.removeItem(
      STORAGE_KEY
    );

    setMessages([]);
    setShowMemory(false);
    setMenuOpen(false);
  };

  // ==========================================================
  // SELECT PDF
  // ==========================================================

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      setSelectedFile(null);
      setDocumentId(null);

      setUploadStatus(
        "❌ Please select a PDF file."
      );

      event.target.value = "";

      return;
    }

    // 25 MB frontend check
    if (
      file.size >
      25 * 1024 * 1024
    ) {
      setSelectedFile(null);
      setDocumentId(null);

      setUploadStatus(
        "❌ PDF is too large. Maximum size is 25 MB."
      );

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
    setDocumentId(null);

    setUploadStatus(
      `📄 ${file.name} selected. Click Upload PDF to upload.`
    );
  };

  // ==========================================================
  // UPLOAD PDF
  // ==========================================================

  const uploadPDF = async () => {
    if (
      !selectedFile ||
      uploading
    ) {
      return;
    }

    setUploading(true);

    setUploadStatus(
      "⏳ Uploading PDF..."
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          `${API_BASE_URL}/upload-pdf`,
          {
            method: "POST",
            body: formData,
          }
        );

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Backend returned invalid JSON:\n${text}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.response ||
            `Upload failed: ${response.status}`
        );
      }

      if (!data.document_id) {
        throw new Error(
          "Backend did not return a document_id."
        );
      }

      setDocumentId(
        data.document_id
      );

      setUploadStatus(
        `✅ Uploaded: ${
          data.filename ||
          selectedFile.name
        } • ${
          data.pages ?? "?"
        } page(s) • ${
          data.characters ?? "?"
        } characters`
      );

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              `### 📄 PDF Uploaded Successfully\n\n` +
              `**File:** ${
                data.filename ||
                selectedFile.name
              }\n\n` +
              `**Pages:** ${
                data.pages ?? "N/A"
              }\n\n` +
              `**Extracted characters:** ${
                data.characters ?? "N/A"
              }\n\n` +
              `You can now ask the **PDF Analysis Agent** questions about this document.`,
          },
        ]
      );
    } catch (error) {
      setDocumentId(null);

      setUploadStatus(
        `❌ Upload Error: ${
          error.message
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================================
  // EXPORT REPORT
  // ==========================================================

  const exportReport = async (format) => {
    if (!selectedAgent || exportingFormat) return;

    const assistantMessages = messages.filter(
      (message) =>
        message.role === "assistant" &&
        message.content &&
        !message.error
    );

    if (assistantMessages.length === 0) {
      alert("Generate a report or answer first, then export it.");
      return;
    }

    const latestAssistantMessage =
      assistantMessages[assistantMessages.length - 1];

    const content = latestAssistantMessage.content.trim();

    if (!content) {
      alert("There is no report content to export.");
      return;
    }

    try {
      setExportingFormat(format);

      const response = await fetch(
        `${API_BASE_URL}/export-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/octet-stream",
          },
          body: JSON.stringify({
            content,
            title: `${selectedAgent.name} Report`,
            format,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Export failed: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.detail ||
            errorData.response ||
            errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const contentDisposition =
        response.headers.get("Content-Disposition");

      let filename = `researchmind-report.${format}`;

      const filenameMatch = contentDisposition?.match(
        /filename="?([^"]+)"?/i
      );

      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(
        `❌ ${format.toUpperCase()} export failed\n\n${error.message}`
      );
    } finally {
      setExportingFormat(null);
    }
  };

  // ==========================================================
  // RUN AGENT
  // ==========================================================

  const runAgent = async () => {
    if (
      !selectedAgent ||
      loading ||
      !input.trim()
    ) {
      return;
    }

    const userMessage =
      input.trim();

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: userMessage,
      },
    ];

    setMessages(
      updatedMessages
    );

    setInput("");
    setLoading(true);

    const conversationContext =
      updatedMessages
        .map((message) =>
          message.role === "user"
            ? `USER: ${message.content}`
            : `ASSISTANT: ${message.content}`
        )
        .join("\n\n");

    const finalPrompt = `
You are the ${selectedAgent.name} in ResearchMind AI.

Continue the user's conversation naturally.

IMPORTANT:
- Remember and use the conversation history below.
- Understand follow-up words such as "it", "this", "that", "they", "the above", etc.
- Do not restart the conversation unnecessarily.
- Answer the latest question directly.
- Use Markdown when useful.
- For research questions, give clear and useful information.
- Do not claim that you searched the web unless the backend actually performed a web search.

CONVERSATION HISTORY:

${conversationContext}

LATEST USER MESSAGE:

${userMessage}

Answer the latest user message.
`;

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/run-agent`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              agent:
                selectedAgent.name,

              prompt:
                finalPrompt,

              document_id:
                documentId,
            }),
          }
        );

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Backend returned invalid JSON:\n${text}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.response ||
            `Backend error: ${response.status}`
        );
      }

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",

            content:
              data.response ||
              "No response received.",

            visualization_url:
              data.visualization_url ||
              null,
          },
        ]
      );
    } catch (error) {
      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",

            error: true,

            content:
              `❌ Connection Error\n\n` +
              `${error.message}\n\n` +
              `Make sure FastAPI is running at ${API_BASE_URL}`,
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      runAgent();
    }
  };

  // ==========================================================
  // SCROLL
  // ==========================================================

  const scrollToAgents = () => {
    document
      .getElementById("agents")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="logo">
          <span className="logo-brain">
            🧠
          </span>

          <span>
            ResearchMind AI
          </span>
        </div>

        <nav className="nav-links">

          <a href="#agents">
            Agents
          </a>

          <a href="#workflow">
            Workflow
          </a>

          <a href="#about">
            About
          </a>

          <a href="#pricing">
            Pricing
          </a>

          <a href="#contact">
            Contact
          </a>

        </nav>

        <div className="navbar-actions">

          <button
            className="start-btn"
            onClick={scrollToAgents}
          >
            Get Started
          </button>

          <div className="menu-container">

            <button
              className="three-dot-btn"
              onClick={() =>
                setMenuOpen(
                  (value) => !value
                )
              }
              aria-label="More options"
            >
              ⋮
            </button>

            {menuOpen && (
              <div className="three-dot-menu">

                <div className="menu-title">
                  ResearchMind
                </div>

                <button
                  onClick={() =>
                    setMemoryEnabled(
                      (value) => !value
                    )
                  }
                >
                  🧠 Chat Memory

                  <span
                    className={`menu-status ${
                      memoryEnabled
                        ? "on"
                        : "off"
                    }`}
                  >
                    {memoryEnabled
                      ? "ON"
                      : "OFF"}
                  </span>
                </button>

                <button
                  onClick={
                    newConversation
                  }
                >
                  🆕 New Conversation
                </button>

                <button
                  onClick={() => {
                    setShowMemory(
                      true
                    );

                    setMenuOpen(
                      false
                    );
                  }}
                >
                  💾 View Memory
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(
                      false
                    );

                    alert(
                      "Settings panel can be connected here."
                    );
                  }}
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={
                    clearMemory
                  }
                >
                  🗑️ Clear Memory
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(
                      false
                    );

                    alert(
                      "ResearchMind AI Support"
                    );
                  }}
                >
                  ❓ Help & Support
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(
                      false
                    );

                    alert(
                      "ResearchMind AI — Multi-Agent Research Platform"
                    );
                  }}
                >
                  ℹ️ About ResearchMind
                </button>

              </div>
            )}

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="hero">

          <div className="hero-content">

            <div className="badge">
              ⚡ AI-Powered Research Platform
            </div>

            <h1>
              Your Complete
              <span>
                {" "}AI Research Team
              </span>
            </h1>

            <p>
              ResearchMind AI brings together
              9 specialized AI agents to
              research, analyze, verify,
              summarize, and generate
              professional research reports.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={
                  scrollToAgents
                }
              >
                Start Research →
              </button>

              <button
                className="secondary-btn"
                onClick={
                  scrollToAgents
                }
              >
                Explore Agents
              </button>

            </div>

          </div>

          <div className="hero-card">

            <div className="brain-large">
              🧠
            </div>

            <h2>
              9 AI Agents
            </h2>

            <p>
              Working together as one
              intelligent research system.
            </p>

            <div className="mini-agents">

              {agents.map(
                (agent) => (
                  <button
                    key={agent.id}
                    className="mini-agent"
                    onClick={() =>
                      openAgent(
                        agent
                      )
                    }
                    title={
                      agent.name
                    }
                  >
                    <span>
                      {agent.icon}
                    </span>

                    <small>
                      {agent.name.replace(
                        " Agent",
                        ""
                      )}
                    </small>
                  </button>
                )
              )}

            </div>

          </div>

        </section>

        {/* ===================================================
            AGENTS
        =================================================== */}

        <section
          id="agents"
          className="section agents-section"
        >

          <div className="section-heading">

            <div className="badge">
              🤖 OUR AI AGENTS
            </div>

            <h2>
              Meet Your AI Research Team
            </h2>

            <p>
              Each agent specializes in a
              different part of the research
              process.
            </p>

          </div>

          <div className="agents-grid">

            {agents.map(
              (agent) => (
                <article
                  className="agent-card"
                  key={agent.id}
                >

                  <div className="agent-number">
                    {String(
                      agent.id
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="agent-icon">
                    {agent.icon}
                  </div>

                  <h3>
                    {agent.name}
                  </h3>

                  <p>
                    {agent.description}
                  </p>

                  <button
                    onClick={() =>
                      openAgent(
                        agent
                      )
                    }
                  >
                    Open Agent →
                  </button>

                </article>
              )
            )}

          </div>

        </section>

        {/* ===================================================
            WORKFLOW
        =================================================== */}

        <section
          id="workflow"
          className="section workflow"
        >

          <div className="section-heading">

            <div className="badge">
              ⚙️ HOW IT WORKS
            </div>

            <h2>
              One Platform. Complete Research.
            </h2>

          </div>

          <div className="workflow-steps">

            {[
              [
                "01",
                "💬",
                "Ask",
                "Enter your research question.",
              ],
              [
                "02",
                "🔎",
                "Research",
                "AI agents collect and analyze information.",
              ],
              [
                "03",
                "🛡️",
                "Verify",
                "Claims and sources are checked.",
              ],
              [
                "04",
                "📄",
                "Generate",
                "Receive your final research report.",
              ],
            ].map(
              ([
                number,
                icon,
                title,
                text,
              ]) => (
                <div
                  className="workflow-card"
                  key={number}
                >

                  <span className="step-number">
                    {number}
                  </span>

                  <div className="step-icon">
                    {icon}
                  </div>

                  <h3>
                    {title}
                  </h3>

                  <p>
                    {text}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* ===================================================
            TRUST
        =================================================== */}

        <section className="trust-strip">

          <div>
            <span>🛡️</span>

            <h3>
              Reliable
            </h3>

            <p>
              AI agents verify and validate
              information.
            </p>
          </div>

          <div>
            <span>⚡</span>

            <h3>
              Fast
            </h3>

            <p>
              Get useful results in seconds,
              not hours.
            </p>
          </div>

          <div>
            <span>🔐</span>

            <h3>
              Secure
            </h3>

            <p>
              Your conversations stay in
              your browser memory.
            </p>
          </div>

          <div>
            <span>🎯</span>

            <h3>
              Accurate
            </h3>

            <p>
              Clear, structured research
              you can understand.
            </p>
          </div>

        </section>

        {/* ===================================================
            END NOTE
        =================================================== */}

        <section className="end-note">

          <div className="badge">
            📌 END NOTE
          </div>

          <h2>
            Research Smarter with
            ResearchMind AI
          </h2>

          <p>
            ResearchMind AI is designed to
            bring research, verification,
            analysis, summarization,
            citations, and reporting together
            in one intelligent workspace.
          </p>

          <p className="disclaimer">
            AI-generated information should
            be reviewed and verified before
            academic, professional, medical,
            legal, or business use.
          </p>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        id="about"
        className="footer"
      >

        <div className="footer-main">

          <div className="footer-brand">

            <h2>
              🧠 ResearchMind AI
            </h2>

            <p>
              Your complete AI research team
              for smarter, faster, and better
              research.
            </p>

            <div className="socials">

              <a href="#about">
                𝕏
              </a>

              <a href="#about">
                in
              </a>

              <a href="#about">
                ◉
              </a>

              <a href="#about">
                ▶
              </a>

            </div>

          </div>

          <div>

            <h3>
              Platform
            </h3>

            <a href="#agents">
              Agents
            </a>

            <a href="#workflow">
              Workflow
            </a>

            <a href="#pricing">
              Pricing
            </a>

            <a href="#about">
              FAQ
            </a>

          </div>

          <div id="contact">

            <h3>
              Company
            </h3>

            <a href="#about">
              About Us
            </a>

            <a href="#contact">
              Contact
            </a>

            <a href="#about">
              Careers
            </a>

            <a href="#about">
              Blog
            </a>

          </div>

          <div id="pricing">

            <h3>
              Legal
            </h3>

            <a href="#about">
              Privacy Policy
            </a>

            <a href="#about">
              Terms of Service
            </a>

            <a href="#about">
              End Note
            </a>

            <a href="#about">
              Disclaimer
            </a>

          </div>

          <div className="subscribe">

            <h3>
              Stay Updated
            </h3>

            <p>
              Subscribe to get the latest
              research updates and tips.
            </p>

            <div className="subscribe-row">

              <input
                type="email"
                placeholder="Enter your email"
              />

              <button
                onClick={() =>
                  alert(
                    "Thanks for subscribing!"
                  )
                }
              >
                Subscribe
              </button>

            </div>

          </div>

        </div>

        <div className="copyright">

          <span>
            © 2026 ResearchMind AI.
            All rights reserved.
          </span>

          <span>
            |
          </span>

          <span>
            Made with ❤️ for researchers
            worldwide.
          </span>

          <span>
            |
          </span>

          <span>
            v1.0.0
          </span>

        </div>

      </footer>

      {/* =====================================================
          AGENT WORKSPACE
      ===================================================== */}

      {selectedAgent && (

        <div
          className="agent-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAgent();
            }
          }}
        >

          <div className="agent-workspace">

            <div className="workspace-shell">

              {/* LEFT AGENT SIDEBAR */}
              <aside className="workspace-sidebar">
                <div className="sidebar-brand">
                  <div className="sidebar-logo">🧠</div>
                  <div>
                    <strong>ResearchMind <span>AI</span></strong>
                    <small>AI RESEARCH PLATFORM</small>
                  </div>
                </div>

                <div className="sidebar-search">
                  🔍 <span>AI Agents</span>
                </div>

                <div className="sidebar-section-title">AI AGENTS</div>

                <div className="sidebar-agent-list">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      className={`sidebar-agent ${selectedAgent.id === agent.id ? "active" : ""}`}
                      onClick={() => openAgent(agent)}
                    >
                      <span className="sidebar-agent-icon">{agent.icon}</span>
                      <span className="sidebar-agent-copy">
                        <strong>{agent.name}</strong>
                        <small>{agent.description}</small>
                      </span>
                    </button>
                  ))}
                </div>

                <button className="sidebar-new-chat" onClick={newConversation}>
                  ＋ New Conversation
                </button>

                <div className="sidebar-memory">
                  <div>
                    <span>Memory</span>
                    <small>{memoryEnabled ? "Enabled" : "Disabled"}</small>
                  </div>
                  <button
                    className={`memory-toggle ${memoryEnabled ? "on" : ""}`}
                    onClick={() => setMemoryEnabled((value) => !value)}
                    aria-label="Toggle memory"
                  >
                    <span />
                  </button>
                </div>
              </aside>

              {/* MAIN RESEARCH AREA */}
              <main className="workspace-main">

            {/* =================================================
                WORKSPACE TOPBAR
            ================================================= */}

            <div className="workspace-topbar">

              <div className="workspace-header">

                <div className="workspace-icon">
                  {selectedAgent.icon}
                </div>

                <div>

                  <div className="workspace-label">

                    <span className="online-dot"></span>

                    AI AGENT

                  </div>

                  <h2>
                    {selectedAgent.name}
                  </h2>

                </div>

              </div>

              <div className="workspace-actions">

                <button
                  title="New conversation"
                  onClick={
                    newConversation
                  }
                >
                  +
                </button>

                <button
                  title="Clear conversation"
                  onClick={() =>
                    setMessages([])
                  }
                >
                  🗑
                </button>

                <button
                  className="workspace-close"
                  title="Close"
                  onClick={
                    closeAgent
                  }
                >
                  ✕
                </button>

              </div>

            </div>

            <p className="workspace-description">
              {selectedAgent.description}
            </p>

            {messages.length === 0 && (

              <div className="workspace-task">
                💡 {selectedAgent.task}
              </div>

            )}

            {/* =================================================
                CHAT
            ================================================= */}

            <div className="chat-area">

              {messages.length === 0 ? (

                <div className="empty-chat">

                  <div className="empty-chat-icon">
                    {selectedAgent.icon}
                  </div>

                  <h3>
                    Start a conversation
                  </h3>

                  <p>
                    Ask your first question below.
                  </p>

                </div>

              ) : (

                messages.map(
                  (message, index) => (

                    <div
                      className={`chat-message ${
                        message.role ===
                        "user"
                          ? "user-message"
                          : "assistant-message"
                      }`}
                      key={`${message.role}-${index}`}
                    >

                      <div className="message-avatar">
                        {message.role ===
                        "user"
                          ? "👤"
                          : selectedAgent.icon}
                      </div>

                      <div className="message-content">

                        <div className="message-name">

                          {message.role ===
                          "user"
                            ? "You"
                            : selectedAgent.name}

                        </div>

                        <div
                          className={`message-text ${
                            message.error
                              ? "error-message"
                              : ""
                          }`}
                        >

                          <ReactMarkdown
                            remarkPlugins={[
                              remarkGfm,
                            ]}
                          >
                            {message.content}
                          </ReactMarkdown>

                          {/* ====================================
                              GENERATED VISUALIZATION
                          ==================================== */}

                          {message.visualization_url && (

                            <div className="visualization-result">

                              <img
                                src={`${API_BASE_URL}${message.visualization_url}`}
                                alt="Generated visualization"
                                className="visualization-image"
                              />

                            </div>

                          )}

                        </div>

                      </div>

                    </div>

                  )
                )

              )}

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading && (

                <div className="chat-message assistant-message">

                  <div className="message-avatar">
                    {selectedAgent.icon}
                  </div>

                  <div className="message-content">

                    <div className="message-name">
                      {selectedAgent.name}
                    </div>

                    <div className="typing-indicator">

                      <span></span>
                      <span></span>
                      <span></span>

                      <b>
                        Thinking...
                      </b>

                    </div>

                  </div>

                </div>

              )}

            </div>

            {/* =================================================
                NEW CHAT
            ================================================= */}

            {messages.length > 0 &&
              !loading && (

                <button
                  className="new-chat-btn"
                  onClick={
                    newConversation
                  }
                >
                  🆕 New Conversation
                </button>

              )}

            {/* =================================================
                REPORT EXPORT
            ================================================= */}

            {messages.some(
              (message) =>
                message.role === "assistant" &&
                message.content &&
                !message.error
            ) && (
              <div className="report-export-area">
                <div className="report-export-title">
                  📤 Export Result
                </div>

                <div className="report-export-buttons">
                  {[
                    ["pdf", "📄 PDF"],
                    ["docx", "📝 DOCX"],
                    ["md", "📘 Markdown"],
                    ["txt", "📃 TXT"],
                    ["html", "🌐 HTML"],
                  ].map(([format, label]) => (
                    <button
                      key={format}
                      type="button"
                      className="report-export-btn"
                      onClick={() => exportReport(format)}
                      disabled={Boolean(exportingFormat)}
                    >
                      {exportingFormat === format
                        ? "⏳ Exporting..."
                        : label}
                    </button>
                  ))}
                </div>

                <div className="report-export-hint">
                  Exports the latest AI response from this conversation.
                </div>
              </div>
            )}

            {/* =================================================
                PDF UPLOAD
            ================================================= */}

            <div className="pdf-upload-area">

              <input
                id="researchmind-pdf-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={
                  handleFileChange
                }
                disabled={
                  uploading ||
                  loading
                }
                style={{
                  display: "none",
                }}
              />

              <label
                htmlFor="researchmind-pdf-input"
                className="pdf-select-btn"
                title="Select a PDF file"
              >
                📎 Select PDF
              </label>

              <button
                type="button"
                className="pdf-upload-btn"
                onClick={
                  uploadPDF
                }
                disabled={
                  !selectedFile ||
                  uploading ||
                  loading
                }
                title="Upload selected PDF"
              >

                {uploading
                  ? "⏳ Uploading..."
                  : "⬆️ Upload PDF"}

              </button>

              {selectedFile && (

                <span
                  className="selected-file-name"
                  title={
                    selectedFile.name
                  }
                >
                  {selectedFile.name}
                </span>

              )}

            </div>

            {/* =================================================
                UPLOAD STATUS
            ================================================= */}

            {uploadStatus && (

              <div
                className={`upload-status ${
                  uploadStatus.startsWith(
                    "❌"
                  )
                    ? "upload-error"
                    : ""
                }`}
              >
                {uploadStatus}
              </div>

            )}

            {/* =================================================
                CHAT INPUT
            ================================================= */}

            <div className="chat-input-area">

              <textarea
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder={`Message ${selectedAgent.name}...`}
                rows={3}
                disabled={loading}
              />

              <button
                className="send-message-btn"
                onClick={
                  runAgent
                }
                disabled={
                  loading ||
                  !input.trim()
                }
                title="Send message"
              >

                {loading
                  ? "⏳"
                  : "➤"}

              </button>

            </div>

            <div className="input-hint">

              Press Enter to send • Shift +
              Enter for new line

              {documentId &&
                " • PDF ready for analysis"}

            </div>

              </main>

              {/* RIGHT DOCUMENT / TOOLS SIDEBAR */}
              <aside className="workspace-rightbar">
                <section className="right-panel-card">
                  <div className="right-panel-title">FILES &amp; DOCUMENTS</div>
                  <input
                    id="researchmind-sidebar-pdf-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading || loading}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="researchmind-sidebar-pdf-input" className="document-dropzone">
                    <div className="dropzone-icon">☁️</div>
                    <strong>Upload PDF Document</strong>
                    <span>Click to browse • PDF files only</span>
                  </label>
                  <button
                    type="button"
                    className="sidebar-upload-btn"
                    onClick={uploadPDF}
                    disabled={!selectedFile || uploading || loading}
                  >
                    {uploading ? "⏳ Uploading..." : "⬆️ Upload PDF"}
                  </button>
                  <div className={`document-status ${documentId ? "ready" : ""}`}>
                    {documentId ? (
                      <>
                        <strong>📄 {selectedFile?.name || "Document uploaded"}</strong>
                        <span>Ready for PDF analysis</span>
                      </>
                    ) : (
                      <>
                        <strong>No document uploaded</strong>
                        <span>Upload a PDF to analyze its content.</span>
                      </>
                    )}
                  </div>
                  {uploadStatus && <div className={`sidebar-upload-status ${uploadStatus.startsWith("❌") ? "error" : ""}`}>{uploadStatus}</div>}
                </section>

                <section className="right-panel-card memory-card-mini">
                  <div className="right-panel-title">CONVERSATION MEMORY</div>
                  <div className="memory-status-row">
                    <div>
                      <strong>{memoryEnabled ? "ENABLED" : "DISABLED"}</strong>
                      <span>Your conversations are saved for this agent.</span>
                    </div>
                    <span className={`status-pill ${memoryEnabled ? "enabled" : "disabled"}`}>{memoryEnabled ? "ON" : "OFF"}</span>
                  </div>
                </section>

                <section className="right-panel-card export-card">
                  <div className="right-panel-title">EXPORT RESULT</div>
                  <p>Export the latest AI response</p>
                  <div className="sidebar-export-buttons">
                    {[
                      ["pdf", "📄 Export as PDF"],
                      ["docx", "📝 Export as DOCX"],
                      ["md", "📘 Export as Markdown"],
                      ["txt", "📃 Export as TXT"],
                      ["html", "🌐 Export as HTML"],
                    ].map(([format, label]) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => exportReport(format)}
                        disabled={Boolean(exportingFormat) || !messages.some((message) => message.role === "assistant" && message.content && !message.error)}
                      >
                        {exportingFormat === format ? "⏳ Exporting..." : label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="right-panel-card tips-card">
                  <div className="right-panel-title">💡 TIPS</div>
                  <ul>
                    <li>Ask specific and detailed questions for better results.</li>
                    <li>Upload PDF documents for analysis.</li>
                    <li>Use follow-up questions to dive deeper.</li>
                    <li>Export useful results when your research is complete.</li>
                  </ul>
                </section>
              </aside>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          MEMORY MODAL
      ===================================================== */}

      {showMemory && (

        <div
          className="memory-modal"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowMemory(false);
            }
          }}
        >

          <div className="memory-card">

            <button
              className="memory-close"
              onClick={() =>
                setShowMemory(false)
              }
            >
              ✕
            </button>

            <div className="badge">
              🧠 CHAT MEMORY
            </div>

            <h2>
              Saved Conversations
            </h2>

            <p>
              Memory is stored locally in
              this browser when Chat Memory
              is ON.
            </p>

            <div className="memory-list">

              {Object.keys(
                loadMemory()
              ).length === 0 ? (

                <div className="memory-empty">
                  No saved conversations yet.
                </div>

              ) : (

                Object.entries(
                  loadMemory()
                ).map(
                  ([name, history]) => (

                    <button
                      key={name}
                      onClick={() => {

                        const agent =
                          agents.find(
                            (item) =>
                              item.name ===
                              name
                          );

                        if (agent) {

                          openAgent(
                            agent
                          );

                          setShowMemory(
                            false
                          );
                        }

                      }}
                    >

                      <span>
                        {
                          agents.find(
                            (item) =>
                              item.name ===
                              name
                          )?.icon ||
                          "🧠"
                        }
                      </span>

                      <strong>
                        {name}
                      </strong>

                      <small>
                        {history.length}
                        {" "}
                        messages
                      </small>

                    </button>

                  )
                )

              )}

            </div>

            <button
              className="danger-btn"
              onClick={
                clearMemory
              }
            >
              Delete All Memory
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;