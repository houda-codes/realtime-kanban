import { useState } from "react";
import JoinScreen from "./JoinScreen";
import KanbanBoard from "./KanbanBoard";

export default function App() {
  const [boardId, setBoardId] = useState(null);

  if (!boardId) {
    return <JoinScreen onJoin={setBoardId} />;
  }

  return <KanbanBoard boardId={boardId} onLeave={() => setBoardId(null)} />;
}
