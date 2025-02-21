import { createRoot } from "react-dom/client";
import { Application } from "./Application";

/**
 * Starts up the entire application
 */
async function bootstrapApplication() {
  // you can await async initialization code here
  // ...

  // create the React application
  const appElement = document.getElementById("app");
  const root = createRoot(appElement);
  root.render(<Application />);
}

// this is the main entrypoint to everything
bootstrapApplication();
