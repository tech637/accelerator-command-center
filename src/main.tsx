import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const collectIconLinks = () =>
  Array.from(document.querySelectorAll("link[rel*='icon']")).map((el) => ({
    rel: el.getAttribute("rel"),
    href: el.getAttribute("href"),
  }));

// #region agent log
fetch("http://127.0.0.1:7295/ingest/21c5ce40-04a5-45db-a461-3a464b2322c8", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f97cd0" },
  body: JSON.stringify({
    sessionId: "f97cd0",
    runId: "favicon-debug-1",
    hypothesisId: "A",
    location: "src/main.tsx:startup",
    message: "Initial head favicon state",
    data: {
      path: window.location.pathname,
      title: document.title,
      iconLinks: collectIconLinks(),
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

window.addEventListener("load", () => {
  // #region agent log
  fetch("http://127.0.0.1:7295/ingest/21c5ce40-04a5-45db-a461-3a464b2322c8", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f97cd0" },
    body: JSON.stringify({
      sessionId: "f97cd0",
      runId: "favicon-debug-1",
      hypothesisId: "B",
      location: "src/main.tsx:windowLoad",
      message: "Post-load favicon state",
      data: {
        path: window.location.pathname,
        iconLinks: collectIconLinks(),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
});

createRoot(document.getElementById("root")!).render(<App />);
