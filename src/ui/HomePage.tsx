import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <>
      <h1>MuNG Studio</h1>

      <p>Welcome sailor!</p>

      <Link to="in-memory">Preview MuNG file by uploading it</Link>
    </>
  );
}
