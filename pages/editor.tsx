import React from "react";
import NotedEditor from "../src/components/NotedEditor";

export default function EditorPage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <NotedEditor />
    </div>
  );
}