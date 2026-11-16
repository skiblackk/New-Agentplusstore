import { useEffect, useState } from "react";
import { ExternalLink, Mic, X } from "lucide-react";
import "./AgentPlusVoice.css";

// This is the public share URL supplied by the site owner for the voice orb.
const VOICE_AGENT_URL = "https://agent.retellai.com/orb/agent_79afac06a3ca9951c7495cbc19?token=6a4cf1e8a12c8099278a87883dd1bc42";

export default function AgentPlusVoice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        className="agentplus-voice-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Mic size={17} aria-hidden="true" />
        Talk to AgentPlusAI
      </button>
      {open && (
        <div className="agentplus-voice-overlay" onClick={() => setOpen(false)}>
          <section
            className="agentplus-voice-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="AgentPlusAI voice assistant"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="agentplus-voice-header">
              <div className="agentplus-voice-brand">
                <img src="/agentplus-logo.jpeg" alt="" aria-hidden="true" />
                <div>
                  <strong>AgentPlusAI</strong>
                  <span>Voice assistant</span>
                </div>
              </div>
              <div className="agentplus-voice-actions">
                <a href={VOICE_AGENT_URL} target="_blank" rel="noopener noreferrer">
                  Open separately <ExternalLink size={14} aria-hidden="true" />
                </a>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close voice assistant">
                  <X size={19} aria-hidden="true" />
                </button>
              </div>
            </header>
            <iframe
              className="agentplus-voice-frame"
              src={VOICE_AGENT_URL}
              title="AgentPlusAI voice assistant"
              allow="microphone; autoplay"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </section>
        </div>
      )}
    </>
  );
}
