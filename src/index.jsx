/**
 * Starts up the entire application
 */
async function bootstrapApplication() {
  console.info("[mung-studio] Vite mode:", import.meta.env.MODE, "DEV:", import.meta.env.DEV);

  // Debugging tool that displays react re-renders of components.
  // Must be imported before React and React DOM.
  // https://github.com/aidenybai/react-scan
  if (import.meta.env.DEV) {
    const { scan } = await import("react-scan");
    if (typeof window !== "undefined") {
      scan({ enabled: true });
    }
  }

  // import dependencies
  const { createRoot } = await import("react-dom/client");
  const { Application } = await import("./Application");

  // you can await async initialization code here
  // ...

  // create the React application
  const appElement = document.getElementById("app");
  const root = createRoot(appElement);
  root.render(<Application />);
}

// this is the main entrypoint to everything
bootstrapApplication();
