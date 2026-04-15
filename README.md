# Local AI Assistant

A powerful, privacy-first AI chat application that runs entirely on your machine. No cloud dependencies, no data leaves your device — just you and your AI assistant.

Built for developers who want full control over their AI experience without sacrificing convenience.

## Why Use Assistant?

- **Privacy First** — Your conversations never leave your machine
- **Local & Fast** — No API calls or internet required after setup
- **Open Source** — Full transparency, no vendor lock-in
- **Customizable** — Tweak system prompts and temperature to your liking

## Features

- Real-time AI chat with streaming responses
- Multiple model support (switch between models instantly)
- Chat history persistence (your chats are saved locally)
- Dark mode (easy on the eyes)
- Customizable system prompts
- Temperature control (adjust creativity vs precision)
- Multiple chat threads (organize conversations)

## Tech Stack

- **Framework** — Next.js
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **AI Engine** — Ollama
- **Storage** — localStorage

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [Ollama](https://ollama.com)

### Installation

Install dependencies:

```bash
npm i
```

Pull the models you want to use:

```bash
ollama pull qwen2.5:3b
ollama pull llama3.2:1b
```

### Running

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5137](http://localhost:5137) and start chatting!

## Available Models

Head to [Ollama Library](https://ollama.com/library) to browse and install models. Popular choices:

- *deepseek r1:3b** — General purpose, excellent reasoning
- **Qwen 3.5:4b** — Strong coding capabilities

---

See [Issues](https://github.com/anomalyco/assistant/issues) for planned features and progress.

---

## Contributing

Contributions welcome! Open an issue or PR to get started.

---

**Built with care for developers, by developers.**
