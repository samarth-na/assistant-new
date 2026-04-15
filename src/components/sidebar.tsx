import React from "react";

interface ChatItem {
  id: string;
  heading: string;
  messages: Array<{ role: string; content: string }>;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chatHistory: ChatItem[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  chatHistory,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) => {
  return (
    <div
      className={`left-sidebar-panel absolute left-0 top-0 z-30 w-72 h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]
        flex flex-col overflow-hidden ${isOpen ? "is-open" : "is-closed"}`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between px-6 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-[var(--color-accent)] inline-block"></span>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-text)] leading-none">
            Thread Index
          </h2>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="pressable p-1 border border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] cursor-pointer transition-all duration-150"
          title="Close sidebar"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <button
          type="button"
          onClick={onNewChat}
          className="pressable group w-full flex items-center justify-between px-4 py-2.5
            font-mono text-[10px] uppercase tracking-widest font-bold 
            border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]
            hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]
            shadow-[2px_2px_0_0_var(--color-border)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_0_var(--color-border)]
            transition-all duration-150 cursor-pointer"
        >
          <span>Init Thread</span>
          <span className="font-sans text-[14px] leading-none opacity-50 group-hover:opacity-100 transition-opacity">
            +
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-bg-secondary)]">
        {chatHistory.length === 0 && (
          <div className="border border-dashed border-[var(--color-border)] p-4 text-center mt-4">
            <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
              [ Empty Index ]
            </p>
          </div>
        )}
        {chatHistory.map((chatItem) => (
          <div
            key={chatItem.id}
            className={`history-item group relative flex items-start flex-col cursor-pointer border p-3
              transition-colors duration-150
              ${
                activeChatId === chatItem.id
                  ? "bg-[var(--color-bg)] border-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text)]"
              }`}
          >
            <button
              type="button"
              onClick={() => onSelectChat(chatItem.id)}
              className="w-full text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                  REF:{chatItem.id.slice(0, 5)}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                  {String(chatItem.messages.length).padStart(2, "0")} MSG
                </span>
              </div>
              <p
                className={`font-serif text-[13px] leading-snug line-clamp-2 ${
                  activeChatId === chatItem.id
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors"
                }`}
              >
                {chatItem.heading}
              </p>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chatItem.id);
              }}
              title="Delete chat"
              className="pressable absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100
                text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)]
                border border-transparent hover:border-[var(--color-border)]
                transition-all duration-150 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <title>Delete chat</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
