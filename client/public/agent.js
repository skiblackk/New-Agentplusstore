(function () {
  const script = document.currentScript;
  const agentKey = script && script.getAttribute('data-agent');
  if (!agentKey) return;
  const apiOrigin = new URL(script.src, window.location.href).origin;
  const mount = function () {
    if (document.querySelector('[data-agentplus-widget]')) return;
    const host = document.createElement('div');
    host.setAttribute('data-agentplus-widget', 'true');
    document.body.appendChild(host);
    const root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = `
      <style>
        :host { all: initial; }
        .ap-launcher { position:fixed; right:22px; bottom:22px; z-index:2147483647; border:0; border-radius:999px; padding:14px 18px; background:#ff7800; color:#171715; box-shadow:0 12px 34px rgba(0,0,0,.25); font:700 13px/1 system-ui,sans-serif; cursor:pointer; transition:transform .18s ease,box-shadow .18s ease; }
        .ap-launcher:hover { transform:translateY(-2px); box-shadow:0 16px 40px rgba(0,0,0,.3); }
        .ap-panel { display:none; position:fixed; right:22px; bottom:82px; z-index:2147483647; width:min(390px,calc(100vw - 30px)); height:min(620px,calc(100vh - 110px)); overflow:hidden; border:1px solid rgba(255,255,255,.14); border-radius:22px; background:#171715; color:#f7f6f1; box-shadow:0 24px 80px rgba(0,0,0,.36); font:14px/1.5 system-ui,sans-serif; }
        .ap-panel.open { display:flex; flex-direction:column; animation:apIn .18s ease-out; }
        @keyframes apIn { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:none; } }
        .ap-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:18px; border-bottom:1px solid rgba(255,255,255,.12); }
        .ap-name { display:flex; flex-direction:column; gap:2px; font-weight:800; } .ap-name small { color:#bcbab2; font-weight:500; }
        .ap-close { border:0; background:transparent; color:#d9d6cb; font-size:22px; cursor:pointer; }
        .ap-thread { flex:1; overflow:auto; padding:16px; background:linear-gradient(180deg,#1c1b18,#141412); }
        .ap-msg { max-width:88%; margin:0 0 12px; padding:11px 13px; border-radius:14px; white-space:pre-wrap; }
        .ap-msg.user { margin-left:auto; background:#ff7800; color:#171715; border-bottom-right-radius:4px; }
        .ap-msg.agent { background:#282722; color:#f7f6f1; border-bottom-left-radius:4px; }
        .ap-msg small { display:block; margin-bottom:5px; color:#a8a59c; font-size:10px; text-transform:uppercase; letter-spacing:.1em; font-weight:800; }
        .ap-msg.user small { color:#6d3100; }
        .ap-empty { display:flex; height:100%; flex-direction:column; justify-content:center; align-items:center; text-align:center; color:#aaa79d; padding:20px; } .ap-empty strong { color:#fff; font-size:17px; margin-bottom:7px; }
        .ap-sources { display:flex; flex-direction:column; gap:4px; margin-top:10px; padding-top:9px; border-top:1px solid rgba(255,255,255,.12); font-size:11px; } .ap-sources a { color:#ffad67; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ap-controls { display:flex; align-items:center; gap:7px; padding:10px 14px 0; background:#171715; } .ap-research { border:1px solid rgba(255,255,255,.2); border-radius:999px; background:transparent; color:#d9d6cb; padding:6px 9px; font:600 11px system-ui,sans-serif; cursor:pointer; } .ap-research.active { background:#ff7800; border-color:#ff7800; color:#171715; }
        .ap-compose { display:flex; gap:8px; padding:10px 14px 14px; background:#171715; } .ap-compose input { min-width:0; flex:1; border:1px solid rgba(255,255,255,.18); border-radius:10px; padding:11px; background:#26251f; color:#fff; outline:none; font:14px system-ui,sans-serif; } .ap-compose input:focus { border-color:#ff7800; } .ap-send { border:0; border-radius:10px; padding:0 13px; background:#ff7800; color:#171715; font-weight:800; cursor:pointer; } .ap-send:disabled { opacity:.5; cursor:wait; }
      </style>
      <button class="ap-launcher" type="button">Ask our AI assistant</button>
      <section class="ap-panel" aria-label="AI assistant chat">
        <header class="ap-head"><div class="ap-name"><span class="ap-title">AI assistant</span><small>Answers from business context and research</small></div><button class="ap-close" type="button" aria-label="Close chat">×</button></header>
        <div class="ap-thread"><div class="ap-empty"><strong>Ask a real question.</strong><span>I’ll answer directly from the business context, and can research the live web when needed.</span></div></div>
        <div class="ap-controls"><button class="ap-research" type="button">Research live web</button></div>
        <form class="ap-compose"><input aria-label="Message" placeholder="Ask about our business…" autocomplete="off" /><button class="ap-send" type="submit">Send</button></form>
      </section>`;
    const launcher = root.querySelector('.ap-launcher');
    const panel = root.querySelector('.ap-panel');
    const close = root.querySelector('.ap-close');
    const thread = root.querySelector('.ap-thread');
    const form = root.querySelector('.ap-compose');
    const input = root.querySelector('.ap-compose input');
    const send = root.querySelector('.ap-send');
    const research = root.querySelector('.ap-research');
    const title = root.querySelector('.ap-title');
    let messages = [];
    let researchMode = false;
    const add = (role, content, sources) => {
      const item = document.createElement('article'); item.className = 'ap-msg ' + role;
      item.innerHTML = '<small>' + (role === 'user' ? 'You' : 'AI assistant') + '</small><div></div>';
      item.querySelector('div').textContent = content;
      if (sources && sources.length) { const sourceBox = document.createElement('div'); sourceBox.className = 'ap-sources'; sourceBox.innerHTML = '<strong>Research sources</strong>'; sources.forEach(function (source) { const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = source.title || source.url; sourceBox.appendChild(link); }); item.appendChild(sourceBox); }
      const empty = thread.querySelector('.ap-empty'); if (empty) empty.remove(); thread.appendChild(item); thread.scrollTop = thread.scrollHeight;
    };
    const loadConfig = async function () { try { const response = await fetch(apiOrigin + '/api/embed/' + encodeURIComponent(agentKey)); const data = await response.json(); if (data.agent && data.agent.name) title.textContent = data.agent.name; } catch (_) {} };
    const ask = async function (event) { event.preventDefault(); const content = input.value.trim(); if (!content || send.disabled) return; input.value = ''; add('user', content); messages.push({ role:'user', content:content }); send.disabled = true; send.textContent = '…'; const thinking = document.createElement('article'); thinking.className = 'ap-msg agent ap-thinking'; thinking.innerHTML = '<small>AI assistant</small><div>Thinking ' + (researchMode ? 'with live research' : 'from business context') + '…</div>'; thread.appendChild(thinking); thread.scrollTop = thread.scrollHeight; try { const response = await fetch(apiOrigin + '/api/embed/' + encodeURIComponent(agentKey) + '/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages:messages, research:researchMode }) }); const data = await response.json(); thinking.remove(); const answer = data.content || data.error || 'I could not answer that right now.'; add('agent', answer, data.sources); messages.push({ role:'assistant', content:answer }); } catch (_) { thinking.remove(); add('agent', 'I could not connect right now. Please try again in a moment.'); } finally { send.disabled = false; send.textContent = 'Send'; } };
    launcher.addEventListener('click', function () { panel.classList.toggle('open'); if (panel.classList.contains('open')) input.focus(); }); close.addEventListener('click', function () { panel.classList.remove('open'); }); research.addEventListener('click', function () { researchMode = !researchMode; research.classList.toggle('active', researchMode); }); form.addEventListener('submit', ask); void loadConfig();
  };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
