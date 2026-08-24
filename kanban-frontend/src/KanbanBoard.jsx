import { useEffect, useRef, useState } from "react";

const WS_HOST = "ws://localhost:8000";

const COLUMN_ACCENTS = {
  todo: "#94a3b8",
  in_progress: "#f59e0b",
  done: "#10b981",
};

export default function KanbanBoard({ boardId, onLeave }) {
  const [board, setBoard] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [newCardText, setNewCardText] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_HOST}/ws/${encodeURIComponent(boardId)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "you") {
        setMe({ name: msg.name, color: msg.color });
      } else if (msg.type === "state") {
        setBoard(msg.board);
        setOnlineUsers(msg.online_users);
      }
    };

    return () => ws.close();
  }, [boardId]);

  function send(payload) {
    wsRef.current.send(JSON.stringify(payload));
  }

  function handleAddCard(columnKey) {
    const text = (newCardText[columnKey] || "").trim();
    if (!text) return;
    send({ action: "add_card", column: columnKey, text });
    setNewCardText((prev) => ({ ...prev, [columnKey]: "" }));
  }

  function handleDeleteCard(columnKey, cardId) {
    send({ action: "delete_card", column: columnKey, card_id: cardId });
  }

  function handleDragStart(e, cardId, columnKey) {
    e.dataTransfer.setData("cardId", cardId);
    e.dataTransfer.setData("fromColumn", columnKey);
  }

  function handleDrop(e, toColumn) {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("cardId");
    const fromColumn = e.dataTransfer.getData("fromColumn");
    if (fromColumn === toColumn) return;
    send({
      action: "move_card",
      card_id: cardId,
      from_column: fromColumn,
      to_column: toColumn,
    });
  }

  if (!board) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#64748b" }}>Connecting to “{boardId}”…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{boardId}</h1>
          <button onClick={onLeave} style={styles.leaveButton}>
            ← Switch board
          </button>
        </div>

        <div style={styles.presenceRow}>
          {onlineUsers.map((u, i) => (
            <div
              key={i}
              title={u.name}
              style={{
                ...styles.avatar,
                background: u.color,
                border: me && u.name === me.name ? "2px solid #0f172a" : "2px solid white",
              }}
            >
              {u.name.split(" ").map((w) => w[0]).join("")}
            </div>
          ))}
          <span style={styles.onlineCount}>
            {onlineUsers.length} online
          </span>
        </div>
      </header>

      <div style={styles.board}>
        {Object.entries(board.columns).map(([columnKey, column]) => (
          <div
            key={columnKey}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, columnKey)}
            style={styles.column}
          >
            <div
              style={{
                ...styles.columnHeader,
                borderTop: `3px solid ${COLUMN_ACCENTS[columnKey] || "#94a3b8"}`,
              }}
            >
              <span>{column.title}</span>
              <span style={styles.countBadge}>{column.cards.length}</span>
            </div>

            <div style={styles.cardList}>
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id, columnKey)}
                  style={styles.card}
                >
                  <span>{card.text}</span>
                  <button
                    onClick={() => handleDeleteCard(columnKey, card.id)}
                    style={styles.deleteButton}
                    title="Delete card"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.addCardRow}>
              <input
                value={newCardText[columnKey] || ""}
                onChange={(e) =>
                  setNewCardText((prev) => ({ ...prev, [columnKey]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddCard(columnKey)}
                placeholder="Add a card…"
                style={styles.addCardInput}
              />
              <button
                onClick={() => handleAddCard(columnKey)}
                style={styles.addCardButton}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 32px",
    background: "white",
    borderBottom: "1px solid #e2e8f0",
  },
  title: { margin: 0, fontSize: "20px", color: "#0f172a" },
  leaveButton: {
    marginTop: "4px",
    border: "none",
    background: "none",
    color: "#64748b",
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
  },
  presenceRow: { display: "flex", alignItems: "center", gap: "6px" },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    color: "white",
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "-8px",
  },
  onlineCount: { marginLeft: "12px", fontSize: "13px", color: "#64748b" },
  board: {
    display: "flex",
    gap: "20px",
    padding: "32px",
    overflowX: "auto",
    flex: 1,
  },
  column: {
    background: "white",
    borderRadius: "10px",
    width: "280px",
    minWidth: "280px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 16px",
    fontWeight: 600,
    fontSize: "14px",
    color: "#334155",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  },
  countBadge: {
    background: "#f1f5f9",
    borderRadius: "12px",
    padding: "1px 8px",
    fontSize: "12px",
    color: "#64748b",
  },
  cardList: { padding: "0 12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
  card: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#1e293b",
    cursor: "grab",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteButton: {
    border: "none",
    background: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
    lineHeight: 1,
  },
  addCardRow: { display: "flex", gap: "6px", padding: "12px" },
  addCardInput: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    outline: "none",
  },
  addCardButton: {
    border: "none",
    background: "#4f46e5",
    color: "white",
    borderRadius: "6px",
    width: "32px",
    fontSize: "16px",
    cursor: "pointer",
  },
};
