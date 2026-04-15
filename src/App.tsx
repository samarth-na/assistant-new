import {
  memo,
  useEffect,
  useState,
  useRef,
  useReducer,
  useCallback,
  useLayoutEffect,
  FormEvent,
  KeyboardEvent,
} from "react";

import ChatSelector, { ModelOption } from "./components/model";
import Sidebar from "./components/sidebar";
import Markdown from "./components/Markdown";
import ollama from "ollama/browser";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  heading: string;
  messages: Message[];
}

type MessagesAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; content: string } }
  | { type: "SET_MESSAGES"; payload: Message[] };

const newId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const logDev = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log("[chat]", ...args);
  }
};

const normalizeMessages = (value: unknown): Message[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Partial<Message>;
      const role = candidate.role === "assistant" ? "assistant" : candidate.role === "user" ? "user" : null;
      if (!role) return null;
      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : newId(),
        role,
        content: typeof candidate.content === "string" ? candidate.content : "",
      };
    })
    .filter((msg): msg is Message => msg !== null);
};

const normalizeChats = (value: unknown): Chat[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Partial<Chat>;
      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : newId(),
        heading: typeof candidate.heading === "string" ? candidate.heading : "New chat",
        messages: normalizeMessages(candidate.messages),
      };
    })
    .filter((chat): chat is Chat => chat !== null);
};

const loadChats = (): Chat[] => {
  try {
    const stored = localStorage.getItem("chats");
    return stored ? normalizeChats(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
};

const saveChat = (chatObj: Chat): Chat[] => {
  const chats = loadChats();
  const idx = chats.findIndex((c) => c.id === chatObj.id);
  if (idx !== -1) chats[idx] = chatObj;
  else chats.unshift(chatObj);
  localStorage.setItem("chats", JSON.stringify(chats));
  return chats;
};

const deleteChat = (id: string): Chat[] => {
  const chats = loadChats().filter((c) => c.id !== id);
  localStorage.setItem("chats", JSON.stringify(chats));
  return chats;
};

const messagesReducer = (state: Message[], action: MessagesAction): Message[] => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return [...state, action.payload];
    case "UPDATE_MESSAGE":
      return state.map((msg) =>
        msg.id === action.payload.id ? { ...msg, content: action.payload.content } : msg
      );
    case "SET_MESSAGES":
      return action.payload;
    default:
      return state;
  }
};

const MemoizedChatSelector = memo(ChatSelector);

const THEMES = ["cool-white", "warm-white", "dark", "pure-black"] as const;
type Theme = (typeof THEMES)[number];

const isTheme = (value: string | null): value is Theme =>
  value !== null && (THEMES as readonly string[]).includes(value);

function App() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState("qwen2.5:1.5b");
  const [messages, dispatch] = useReducer(messagesReducer, []);
  const abortRef = useRef<AbortController | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState(newId);
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem("theme");
    return isTheme(storedTheme) ? storedTheme : "cool-white";
  });

  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const themeClassNames = THEMES.map((t) => `theme-${t}`);
    root.classList.remove(...themeClassNames);
    root.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setChatHistory(loadChats());
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const response = await ollama.list();
        if (response.models && response.models.length > 0) {
          const models: ModelOption[] = response.models.map((m) => {
            // Simplify name: "qwen2.5:1.5b" -> "qwen2.5" (maybe just keep it if user likes tags)
            // Actually, keep it simple, just use the tag.
            return {
              model: m.model, // usually the full name like 'llama3:latest' or 'qwen2.5:1.5b'
              name: m.name.replace(/:latest$/, ''), // remove :latest for cleaner display
            };
          });
          setAvailableModels(models);
          
          // Fallback if current chat isn't in the list
          setChat((currentChat) => {
            if (!models.find(m => m.model === currentChat)) {
              return models[0].model;
            }
            return currentChat;
          });
        } else {
          setAvailableModels([]);
          setModelsError("No models installed.");
        }
      } catch (err: unknown) {
        setModelsError("Ollama isn't running");
        console.error("Failed to fetch models:", err);
      } finally {
        setModelsLoading(false);
      }
    };
    
    fetchModels();
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveChatId(newId());
    dispatch({ type: "SET_MESSAGES", payload: [] });
    setPrompt("");
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    const found = loadChats().find((c) => c.id === id);
    if (found) {
      setActiveChatId(found.id);
      dispatch({ type: "SET_MESSAGES", payload: found.messages });
    }
  }, []);

  const handleDeleteChat = useCallback(
    (id: string) => {
      const updated = deleteChat(id);
      setChatHistory(updated);
      if (activeChatId === id) handleNewChat();
    },
    [activeChatId, handleNewChat]
  );

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault();
      if (!prompt.trim()) return;
      if (modelsLoading || modelsError) return;
      if (!availableModels.some((model) => model.model === chat)) return;

      const currentPrompt = prompt;
      const userMsg: Message = { id: newId(), role: "user", content: currentPrompt };
      const assistantMessageId = newId();
      const conversation: Message[] = [...messages, userMsg];

      setIsLoading(true);
      dispatch({ type: "ADD_MESSAGE", payload: userMsg });
      dispatch({
        type: "ADD_MESSAGE",
        payload: { id: assistantMessageId, role: "assistant", content: "" },
      });
      setPrompt("");
      logDev("request:start", { model: chat, messages: conversation.length });

      const controller = new AbortController();
      abortRef.current = controller;

      let assistantText = "";
      let receivedChunk = false;
      try {
        const response = await ollama.chat({
          model: chat,
          messages: conversation,
          stream: true,
        });

        for await (const part of response) {
          if (controller.signal.aborted) break;
          const chunk = part.message?.content || "";
          if (chunk) receivedChunk = true;
          assistantText += chunk;
          dispatch({
            type: "UPDATE_MESSAGE",
            payload: { id: assistantMessageId, content: assistantText },
          });
          if (receivedChunk && assistantText.length === chunk.length) {
            logDev("request:first_chunk", { model: chat, chunkLength: chunk.length });
          }
        }

        if (!controller.signal.aborted && !assistantText.trim()) {
          logDev("request:fallback_non_stream", { model: chat, hadChunks: receivedChunk });
          const fallback = await ollama.chat({
            model: chat,
            messages: conversation,
            stream: false,
          });
          assistantText = fallback.message?.content || "";
          dispatch({
            type: "UPDATE_MESSAGE",
            payload: { id: assistantMessageId, content: assistantText },
          });
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error:", error);
          dispatch({
            type: "UPDATE_MESSAGE",
            payload: { id: assistantMessageId, content: `Error: ${error.message}` },
          });
        }
      } finally {
        logDev("request:end", {
          model: chat,
          aborted: controller.signal.aborted,
          assistantLength: assistantText.length,
          receivedChunk,
        });
        setIsLoading(false);
        abortRef.current = null;

        const heading =
          messages.find((m) => m.role === "user")?.content || currentPrompt;
        const updated = saveChat({
          id: activeChatId,
          heading,
          messages: [
            ...conversation,
            { id: assistantMessageId, role: "assistant", content: assistantText },
          ],
        });
        setChatHistory(updated);
      }
    },
    [prompt, messages, chat, activeChatId, modelsLoading, modelsError, availableModels]
  );

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: Event) => {
      const ke = e as unknown as KeyboardEvent;
      if ((ke.ctrlKey || ke.metaKey) && ke.key === "c" && isLoading) {
        e.preventDefault();
        handleCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isLoading]);

  useLayoutEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [messages, prefersReducedMotion]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCycleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const currentIndex = THEMES.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      return THEMES[nextIndex];
    });
  }, []);

  return (
    <div className="app-shell h-screen flex overflow-hidden relative">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />

      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div className="app-topbar flex items-center justify-between px-6 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="pressable p-1.5 border border-transparent hover:border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors duration-150"
              title="Toggle sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <title>Toggle sidebar</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
            v2.1 / System Ready
          </span>
        </div>

        <div className="flex items-center gap-4 relative">
            <button
              type="button"
              onClick={handleCycleTheme}
              className="pressable p-1.5 border border-transparent hover:border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors duration-150"
              title={`Switch Theme (${theme.replace("-", " ")})`}
              aria-label={`Switch theme, current ${theme.replace("-", " ")}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <title>Switch Theme</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.75a5.25 5.25 0 110 10.5 5.25 5.25 0 010-10.5zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setRightSidebarOpen((o) => !o)}
              className="pressable px-3 py-1.5 flex items-center gap-2 border border-transparent hover:border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors duration-150"
              title="Toggle Models Sidebar"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest">{chat}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <title>Models</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`app-chatpane flex-1 min-h-0 flex justify-center px-6 ${modelsError ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col w-full max-w-3xl h-full overflow-hidden">
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto px-6 py-8 space-y-8 relative"
            >
              {modelsError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent pointer-events-auto z-10 p-6 text-center">
                  <p className="text-[var(--color-text-muted)] text-lg mb-4 font-serif italic">
                    {modelsError === "Ollama isn't running" 
                      ? "Ollama isn't running — please start it to continue chatting"
                      : modelsError}
                  </p>
                  {modelsError === "Ollama isn't running" && (
                    <a 
                      href="https://ollama.com/download" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-sans text-[11px] uppercase tracking-wider font-semibold border-b border-[var(--color-text)] text-[var(--color-text)] hover:opacity-70 transition-opacity"
                    >
                      Download and install Ollama
                    </a>
                  )}
                </div>
              )}
              {messages.length === 0 && !modelsError && (
                <div className="flex flex-col items-center justify-center h-full pt-32">
                  <p className="idle-state-float font-serif text-[var(--color-text-muted)] italic text-lg">
                    Start a conversation
                  </p>
                </div>
              )}

              {messages.map((message: Message, index: number) => (
                <div
                  key={message.id}
                  className={`message-row flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  data-role={message.role}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="chat-message-user whitespace-pre-wrap text-right">
                        {message.content}
                      </p>
                    ) : (
                      <>
                        <div className="chat-message-assistant">
                          <Markdown content={message.content} />
                          {index === messages.length - 1 && isLoading && (
                            <span className="inline-block w-1 h-4 ml-1 bg-[oklch(45%_0.15_160)] animate-pulse align-text-bottom" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="app-composer px-6 py-6 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-4xl mx-auto w-full">
                <div className="input-shell relative border border-[var(--color-border)] focus-within:border-[var(--color-accent)] transition-colors duration-200 bg-[var(--color-bg)] shadow-[4px_4px_0_0_var(--color-bg-secondary)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2 bg-[var(--color-bg-secondary)]">
                    <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-none bg-[var(--color-accent)]" />
                      INPUT THREAD
                    </span>
                    <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
                      {chat}
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={3}
                    className="w-full p-4 font-mono text-[13px] border-none bg-transparent resize-none focus:outline-none focus:ring-0 text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
                    {modelsLoading ? "model waking up..." : "shift+enter ↵ new line"}
                  </span>
                  <div className="flex items-center gap-3">
                    {isLoading && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="pressable px-4 py-2 font-mono text-[11px] uppercase tracking-widest font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] 
                          hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]
                          transition-colors duration-150 cursor-pointer"
                      >
                        [ cancel ]
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        !prompt.trim() ||
                        modelsLoading ||
                        !!modelsError ||
                        !availableModels.some((model) => model.model === chat)
                      }
                      className={`pressable send-button ${isLoading ? "is-sending" : ""} group flex items-center gap-3 px-6 py-2 font-mono text-[11px] uppercase tracking-widest font-bold border transition-all duration-150 cursor-pointer
                        ${
                          isLoading ||
                          !prompt.trim() ||
                          modelsLoading ||
                          !!modelsError ||
                          !availableModels.some((model) => model.model === chat)
                            ? "border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed bg-transparent"
                            : "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)] shadow-[2px_2px_0_0_var(--color-text)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_0_var(--color-text)]"
                        }`}
                    >
                      Transmit
                      <span className="font-sans text-[14px] leading-none font-normal group-disabled:opacity-50">
                        ↗
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar for Models */}
      <div
        className={`right-sidebar-panel absolute top-0 right-0 z-30 w-72 h-full bg-[var(--color-bg)] border-l border-[var(--color-border)] flex flex-col overflow-hidden ${
          rightSidebarOpen ? "is-open" : "is-closed"
        }`}
        aria-hidden={!rightSidebarOpen}
      >
          <div className="flex items-center justify-between px-6 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]">
              Model Selection
            </h2>
            <button
              type="button"
              onClick={() => setRightSidebarOpen(false)}
              className="pressable p-1 border border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] cursor-pointer transition-all duration-150"
              title="Close models sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <title>Close sidebar</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-[var(--color-bg)]">
            <MemoizedChatSelector 
              chat={chat} 
              setChat={setChat} 
              models={availableModels} 
              isLoadingModels={modelsLoading} 
            />
          </div>
      </div>
    </div>
  );
}

export default App;
