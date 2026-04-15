import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownProps {
  content: string;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const components: Components = {
  code({ inline, className, children, ...props }: CodeProps) {
    const lang = className?.replace("language-", "") || "";

    if (inline) {
      return (
        <code
          className="font-mono text-[0.85em] bg-[var(--color-bg-secondary)] text-[var(--color-text)] px-1.5 py-0.5 rounded border border-[var(--color-border)]"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="my-3 rounded border border-[var(--color-border)] overflow-hidden">
        {lang && (
          <div className="px-3 py-1 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
            <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
              {lang}
            </span>
          </div>
        )}
        <pre className="px-4 py-3 bg-[color-mix(in_oklab,var(--color-bg-secondary)_68%,var(--color-bg))] overflow-x-auto">
          <code
            className="font-mono text-[13px] leading-relaxed text-[var(--color-text)]"
            {...props}
          >
            {children}
          </code>
        </pre>
      </div>
    );
  },

  p({ children }) {
    return <p className="my-2 first:mt-0 last:mb-0">{children}</p>;
  },

  h1({ children }) {
    return (
      <h1 className="font-serif text-lg font-semibold text-[var(--color-text)] mt-5 mb-2 first:mt-0">
        {children}
      </h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="font-serif text-base font-semibold text-[var(--color-text)] mt-4 mb-2 first:mt-0">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="font-serif text-sm font-semibold text-[var(--color-text)] mt-3 mb-1.5 first:mt-0">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    return (
      <h4 className="font-serif text-sm font-medium text-[var(--color-text-muted)] mt-3 mb-1 first:mt-0">
        {children}
      </h4>
    );
  },

  ul({ children }) {
    return <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="text-[var(--color-text-muted)]">{children}</li>;
  },

  a({ href, children }) {
    return (
      <a
        href={href}
        className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] underline underline-offset-2 decoration-[color-mix(in_oklab,var(--color-accent)_55%,transparent)]"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },

  blockquote({ children }) {
    return (
      <blockquote className="my-3 pl-3 border-l-2 border-[var(--color-accent)] text-[var(--color-text-muted)] italic">
        {children}
      </blockquote>
    );
  },

  hr() {
    return <hr className="my-4 border-[var(--color-border)]" />;
  },

  strong({ children }) {
    return (
      <strong className="font-semibold text-[var(--color-text)]">
        {children}
      </strong>
    );
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },

  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-[var(--color-border)]">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-[var(--color-bg-secondary)]">{children}</thead>;
  },
  th({ children }) {
    return (
      <th className="px-3 py-1.5 text-left font-mono text-xs font-semibold text-[var(--color-text)] border border-[var(--color-border)]">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="px-3 py-1.5 font-mono text-xs text-[var(--color-text-muted)] border border-[var(--color-border)]">
        {children}
      </td>
    );
  },
};

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  return (
    <div className="font-mono text-sm leading-relaxed text-[var(--color-text-muted)] markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(Markdown);
