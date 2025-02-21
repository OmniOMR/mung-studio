import { createHashRouter } from "react-router-dom";
import { HomePage } from "./ui/HomePage";

export const router = createHashRouter([
  {
    index: true,
    element: <HomePage />,
  },
  // {
  //   path: "",
  //   element: <LegalRoot />,
  // },
]);
