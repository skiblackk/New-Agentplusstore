import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { RETELL_AGENT_ID } from "../../../shared/retell.js";
import "./AgentPlusVoice.css";

const RETELL_WIDGET_URL = "https://dashboard.retellai.com/retell-widget-v2.js";
const voicePublicKey = import.meta.env.VITE_RETELL_VOICE_PUBLIC_KEY?.trim() || "";
const whiteLabelToken = import.meta.env.VITE_RETELL_WHITE_LABEL_TOKEN?.trim() || "";
let retellWidgetLoad: Promise<void> | null = null;

function loadRetellWidget(): Promise<void> {
  const existing = document.getElementById("retell-widget") as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") return Promise.resolve();
  if (retellWidgetLoad) return retellWidgetLoad;

  if (existing) existing.remove();
  const script = document.createElement("script");
  script.id = "retell-widget";
  script.src = RETELL_WIDGET_URL;
  script.async = true;
  script.dataset.voiceAgentId = RETELL_AGENT_ID;
  script.dataset.voicePublicKey = voicePublicKey;
  script.dataset.title = "AgentPlusAI";
  script.dataset.logoUrl = `${window.location.origin}/agentplus-logo.jpeg`;
  script.dataset.fabText = "Talk to AgentPlusAI";
  script.dataset.fabIconUrl = `${window.location.origin}/agentplus-logo.jpeg`;
  if (whiteLabelToken) script.dataset.whiteLabel = whiteLabelToken;

  retellWidgetLoad = new Promise<void>((resolve, reject) => {
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      document.body.classList.add("retell-voice-ready");
      resolve();
    }, { once: true });
    script.addEventListener("error", () => {
      script.remove();
      retellWidgetLoad = null;
      reject(new Error("Retell voice widget failed to load"));
    }, { once: true });
    document.head.appendChild(script);
  });
  return retellWidgetLoad;
}

export default function AgentPlusVoice() {
  const [status, setStatus] = useState<"setup" | "loading" | "ready" | "error">(voicePublicKey ? "loading" : "setup");

  useEffect(() => {
    if (!voicePublicKey) {
      setStatus("setup");
      return;
    }
    let active = true;
    void loadRetellWidget().then(() => {
      if (active) setStatus("ready");
    }).catch(() => {
      if (active) setStatus("error");
    });
    return () => { active = false; };
  }, []);

  if (status === "ready") {
    return <span className="agentplus-voice-state is-ready" role="status"><Mic size={15} aria-hidden="true" /> Use the “Talk to AgentPlusAI” voice button on this page.</span>;
  }

  if (status === "loading") {
    return <span className="agentplus-voice-state" role="status"><Mic size={15} aria-hidden="true" /> Preparing AgentPlusAI voice…</span>;
  }

  if (status === "error") {
    return <span className="agentplus-voice-state is-error" role="status">AgentPlusAI voice could not load. Please try again later.</span>;
  }

  return <span className="agentplus-voice-state is-setup" role="status"><Mic size={15} aria-hidden="true" /> AgentPlusAI voice is awaiting Retell setup.</span>;
}
