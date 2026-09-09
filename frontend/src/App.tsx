import * as React from "react";
import AccessGate from "./components/AccessGate";
import { hasAccessCode } from "./config/api";

// Keep the public access gate light. The authenticated clinical workspace,
// Material UI, Socket.IO, and department routes load only after validation.
const WorkspaceApp = React.lazy(() => import("./WorkspaceApp"));

function App() {
  const [unlocked, setUnlocked] = React.useState(hasAccessCode);

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <React.Suspense
      fallback={
        <main className="min-h-screen grid place-items-center text-text-dim" aria-busy="true" aria-live="polite">
          Opening the clinical workspace…
        </main>
      }
    >
      <WorkspaceApp />
    </React.Suspense>
  );
}

export default App;
