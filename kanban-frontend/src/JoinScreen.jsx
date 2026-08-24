import { useState } from "react";

export default function JoinScreen({ onJoin }) {
  const [boardId, setBoardId] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = boardId.trim();
    if (trimmed) onJoin(trimmed);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          width: "360px",
        }}
      >
        <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#0f172a" }}>
          Boards
        </h1>
        <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: "14px" }}>
          Enter a board name to create it, or join one a teammate already
          started.
        </p>
        <input
          autoFocus
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          placeholder="e.g. team-sprint-1"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "15px",
            boxSizing: "border-box",
            marginBottom: "16px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Join board
        </button>
      </form>
    </div>
  );
}
