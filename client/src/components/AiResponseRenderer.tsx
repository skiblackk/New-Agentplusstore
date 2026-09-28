import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, Lightbulb, Quote, TriangleAlert } from "lucide-react";
import "./AiResponseRenderer.css";

type AiResponseRendererProps = { content: string; className?: string };

function CodeBlock({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const language = className?.match(/language-(\w+)/)?.[1];
  if (inline) return <code className="ai-inline-code" {...props}>{children}</code>;
  return (
    <div className="ai-code-block">
      <div className="ai-code-toolbar"><span>{language || "code"}</span><button type="button" onClick={() => { void navigator.clipboard?.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }}><>{copied ? <Check size={13} /> : <Copy size={13} />}</> {copied ? "Copied" : "Copy"}</button></div>
      <pre><code className={className} {...props}>{children}</code></pre>
    </div>
  );
}

export function AiResponseRenderer({ content, className = "" }: AiResponseRendererProps) {
  return (
    <div className={`ai-report ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="ai-report-title">{children}</h1>,
          h2: ({ children }) => <h2 className="ai-report-section-title">{children}</h2>,
          h3: ({ children }) => <h3 className="ai-report-subtitle">{children}</h3>,
          h4: ({ children }) => <h4 className="ai-report-kicker">{children}</h4>,
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          hr: () => <div className="ai-report-divider" role="separator" />,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => <aside className="ai-callout ai-callout-insight"><Quote size={17} /><div>{children}</div></aside>,
          table: ({ children }) => <div className="ai-table-wrap"><table>{children}</table></div>,
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer noopener">{children}<ExternalLink size={12} /></a>,
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,
        }}
      >{content.replace(/\\r/g, "")}</ReactMarkdown>
    </div>
  );
}

export function AiSystemCallout({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "insight" }) {
  return <aside className={`ai-callout ai-callout-${tone}`}><>{tone === "warning" ? <TriangleAlert size={17} /> : <Lightbulb size={17} />}</><div>{children}</div></aside>;
}
