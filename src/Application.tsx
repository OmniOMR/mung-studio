import { StrictMode } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";

export function Application() {
  return (
    <CssVarsProvider>
      <CssBaseline />

      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    </CssVarsProvider>
  );
}
