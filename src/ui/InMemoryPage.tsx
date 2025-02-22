import { useState } from "react";
import { readNodesFromXmlString } from "../mung/readNodesFromXmlString";
import { Node } from "../mung/Node";
import { Explorer } from "./explorer/Explorer";

export function InMemoryPage() {
  const [mungNodes, setMungNodes] = useState<Node[] | null>(null);

  async function handleFileUpload(input: HTMLInputElement) {
    if (input === null) return;
    if (input.files === null) return;
    if ((input.files?.length ?? 0) === 0) return;

    const uploadedMungXml = await input.files[0].text();

    const nodes = readNodesFromXmlString(uploadedMungXml);
    setMungNodes(nodes);
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {mungNodes === null && (
        <>
          <h1>In Memory</h1>
          <p>Upload MuNG file:</p>
          <input type="file" onChange={(e) => handleFileUpload(e.target)} />
        </>
      )}

      {mungNodes !== null && <Explorer initialNodes={mungNodes} />}
    </div>
  );
}
