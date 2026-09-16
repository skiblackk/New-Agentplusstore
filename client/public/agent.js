(function () {
  const script = document.currentScript;
  const agentKey = script && script.getAttribute('data-agent');
  if (!agentKey) return;
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = 'Ask our AI assistant';
  Object.assign(button.style, {position:'fixed',right:'20px',bottom:'20px',zIndex:'2147483647',background:'#ff7800',color:'#171715',border:'0',borderRadius:'999px',padding:'14px 18px',font:'700 13px system-ui',boxShadow:'0 10px 30px rgba(0,0,0,.22)',cursor:'pointer'});
  button.addEventListener('click', function () { window.open('https://agentplus.store/?agent=' + encodeURIComponent(agentKey), '_blank', 'noopener'); });
  document.body.appendChild(button);
})();
