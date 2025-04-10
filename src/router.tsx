import { createHashRouter } from "react-router-dom";
import { HomePage } from "./ui/HomePage";
import { InMemoryPage } from "./ui/InMemoryPage";
import { PerformanceTestingPage } from "./ui/PerformanceTestingPage";
import { DocumentsPage as SimpleBackendDocumentsPage } from "./ui/simple-backend/DocumentsPage";
import { DocumentEditorPage } from "./ui/simple-backend/DocumentEditorPage";

export const router = createHashRouter([
  {
    index: true,
    element: <HomePage />,
  },
  {
    path: "in-memory",
    element: <InMemoryPage />,
  },
  {
    path: "performance-testing",
    element: <PerformanceTestingPage />,
  },
  {
    path: "simple-backend",
    element: <SimpleBackendDocumentsPage />,
  },
  {
    path: "simple-backend/:documentName",
    element: <DocumentEditorPage />,
  },
]);
