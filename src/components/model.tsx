import React from "react";

export interface ModelOption {
  model: string;
  name: string;
}

interface ChatSelectorProps {
  chat: string;
  setChat: (chat: string) => void;
  models: ModelOption[];
  isLoadingModels: boolean;
}

const ChatSelector: React.FC<ChatSelectorProps> = ({ chat, setChat, models, isLoadingModels }) => {
  if (isLoadingModels) {
    return (
      <div className="flex flex-row gap-1.5 flex-wrap items-center">
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] animate-pulse uppercase tracking-widest">
          SYNCING...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {models.map(({ model, name }) => (
        <button
          type="button"
          key={model}
          onClick={() => setChat(model)}
          className={`pressable w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest cursor-pointer
            transition-all duration-150 border
            ${
              chat === model
                ? "bg-[var(--color-bg)] border-[var(--color-accent)] text-[var(--color-accent)] shadow-[2px_2px_0_0_var(--color-border)] translate-x-[-1px] translate-y-[-1px]"
                : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text)]"
            }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

export default ChatSelector;
