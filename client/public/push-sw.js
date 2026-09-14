self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "AgentPlus", {
    body: data.body || "A new lead is ready for follow-up.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "agentplus-lead",
    data: { url: data.url || "/agentplus.admin" },
    renotify: true
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/agentplus.admin";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => "focus" in client);
    if (existing) { existing.navigate(target); return existing.focus(); }
    return clients.openWindow(target);
  }));
});
