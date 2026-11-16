import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Mic, X } from "lucide-react";
import { RETELL_ORB_SHARE_URL } from "@shared/retell";
import "./AgentPlusVoice.css";

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
      <button className="agentplus-voice-trigger" type="button" onClick={() => setOpen(true)}>
        <Mic size={17} aria-hidden="true" />
        Talk to AgentPlusAI
      </button>

      {open && createPortal(
        <div className="agentplus-voice-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="agentplus-voice-dialog" role="dialog" aria-modal="true" aria-labelledby="agentplus-voice-title">
            <div className="agentplus-voice-dialog-head">
              <div>
                <p className="eyebrow">AgentPlusAI</p>
                <h2 id="agentplus-voice-title">Talk with Aria</h2>
                <p className="agentplus-voice-help">Allow microphone access, then start or end the conversation using the controls below.</p>
              </div>
              <button className="agentplus-voice-close" type="button" onClick={() => setOpen(false)} aria-label="Close voice assistant">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="agentplus-voice-frame-wrap">
              <iframe
                title="AgentPlusAI voice assistant"
                src={RETELL_ORB_SHARE_URL}
                allow="microphone; autoplay"
                sandbox="allow-forms allow-modals allow-same-origin allow-scripts"
              />
            </div>
            <p className="agentplus-voice-attribution">Voice service provided by Retell AI.</p>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
