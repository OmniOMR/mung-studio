/**
 * Starts up the entire application
 */
async function bootstrapApplication() {
  // Debugging tool that displays react re-renders of components.
  // Must be imported before React and React DOM.
  // https://github.com/aidenybai/react-scan
  if (process.env.NODE_ENV === "development") {
    await import("react-scan");
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
