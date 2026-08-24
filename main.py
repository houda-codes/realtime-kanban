from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Tuple
import json
import random
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# BOARDS: one board is identified by a "board_id" (a room name, chosen
# by whoever creates/joins it). Multiple boards can exist at once,
# fully independent of each other. New board_ids get a fresh default
# board automatically the first time someone joins them.
# ---------------------------------------------------------------------

def new_board() -> dict:
    return {
        "columns": {
            "todo": {"title": "To Do", "cards": []},
            "in_progress": {"title": "In Progress", "cards": []},
            "done": {"title": "Done", "cards": []},
        }
    }


boards: Dict[str, dict] = {}

# For each board_id, a list of (websocket, username, color) tuples —
# this is how we know who is currently looking at that specific board.
rooms: Dict[str, List[Tuple[WebSocket, str, str]]] = {}

ADJECTIVES = ["Swift", "Quiet", "Brave", "Clever", "Bright", "Calm", "Bold"]
ANIMALS = ["Fox", "Owl", "Otter", "Falcon", "Panda", "Wolf", "Hawk"]
COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"]


def random_username() -> str:
    return f"{random.choice(ADJECTIVES)} {random.choice(ANIMALS)}"


def get_board(board_id: str) -> dict:
    if board_id not in boards:
        boards[board_id] = new_board()
        rooms[board_id] = []
    return boards[board_id]


async def broadcast_room(board_id: str):
    """
    Sends the current board AND the current list of online users to
    every client connected to this specific board_id. Other boards
    are untouched — this is what makes rooms independent.
    """
    online_users = [
        {"name": name, "color": color} for (_, name, color) in rooms[board_id]
    ]
    payload = json.dumps({
        "type": "state",
        "board": boards[board_id],
        "online_users": online_users,
    })
    for (connection, _, _) in rooms[board_id]:
        await connection.send_text(payload)


def find_card(board: dict, card_id: str):
    for column in board["columns"].values():
        for card in column["cards"]:
            if card["id"] == card_id:
                return card
    return None


@app.websocket("/ws/{board_id}")
async def websocket_endpoint(websocket: WebSocket, board_id: str):
    await websocket.accept()

    board = get_board(board_id)
    username = random_username()
    color = random.choice(COLORS)
    rooms[board_id].append((websocket, username, color))

    # Tell this client their own assigned identity right away.
    await websocket.send_text(json.dumps({
        "type": "you",
        "name": username,
        "color": color,
    }))

    # Let everyone in the room (including the new person) see the
    # current board + updated online-user list.
    await broadcast_room(board_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            action = message.get("action")

            if action == "move_card":
                card = find_card(board, message["card_id"])
                from_col = board["columns"].get(message["from_column"])
                to_col = board["columns"].get(message["to_column"])
                if card and from_col and to_col and card in from_col["cards"]:
                    from_col["cards"].remove(card)
                    to_col["cards"].append(card)

            elif action == "add_card":
                column = board["columns"].get(message["column"])
                text = message.get("text", "").strip()
                if column and text:
                    column["cards"].append({
                        "id": str(uuid.uuid4()),
                        "text": text,
                    })

            elif action == "delete_card":
                column = board["columns"].get(message["column"])
                if column:
                    column["cards"] = [
                        c for c in column["cards"] if c["id"] != message["card_id"]
                    ]

            await broadcast_room(board_id)

    except WebSocketDisconnect:
        rooms[board_id] = [
            entry for entry in rooms[board_id] if entry[0] != websocket
        ]
        # Someone left — update the online-users list for everyone else.
        # Guard against the room having just emptied out entirely.
        if board_id in rooms and rooms[board_id]:
            await broadcast_room(board_id)
