# Real-Time Collaborative Kanban Board

A multiplayer Kanban board where every card move, add, and delete syncs live across everyone viewing the same board — no refresh needed. Built to explore real-time architecture: WebSockets, server-authoritative shared state, and live presence.

**🔗 Live demo:** https://realtime-kanban-opal.vercel.app/
*(Note: the backend is on Render's free tier, so it may take ~30 seconds to wake up on first load.)*


## What it does

- **Real-time sync** — drag a card, and everyone looking at that board sees it move instantly, powered by WebSockets rather than polling.
- **Multiple independent boards** — type any board name to create or join a room; each board's state is fully isolated from the others.
- **Live presence** — see who else is currently viewing the board, represented as colored avatars that update the moment someone joins or leaves.
- **Full card management** — add, delete, and drag cards between columns (To Do / In Progress / Done).
- **Server-authoritative state** — the backend holds the single source of truth for every board; clients never resolve conflicts themselves, which avoids the classic bugs of multi-user apps (two people editing the same thing and disagreeing about the result).

## Tech stack

**Backend:** FastAPI, native WebSockets, Python
**Frontend:** React (Vite), native HTML5 drag-and-drop
**Infrastructure:** Docker + docker-compose, GitHub Actions (CI), deployed on Render (backend) + Vercel (frontend)

## Architecture

```
┌─────────────┐         WebSocket          ┌──────────────┐
│   Client A   │ ◄─────────────────────────► │              │
└─────────────┘                              │   FastAPI    │
┌─────────────┐         WebSocket            │   Backend    │
│   Client B   │ ◄─────────────────────────► │  (in-memory  │
└─────────────┘                              │ board state) │
┌─────────────┐         WebSocket            │              │
│   Client C   │ ◄─────────────────────────► │              │
└─────────────┘                              └──────────────┘
```

Each board lives entirely in server memory. Clients don't hold their own copy of "truth" — every action (move/add/delete) is sent to the server, applied there, and the *entire updated board* is broadcast back to everyone connected to that board. This keeps every client perfectly in sync with zero conflict-resolution logic on the frontend.

## Running it locally

**Backend:**
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd kanban-frontend
npm install
npm run dev
```

Open `http://localhost:5173` in two browser tabs, join the same board name in both, and try dragging a card — it should update in both instantly.

**With Docker instead:**
```bash
docker compose up --build
```

## What I learned building this

This was my first project working with WebSockets and real-time multi-user state, coming from mostly building request/response (REST) APIs before. The main shift was realizing the server has to be the single source of truth — trying to let each client manage its own state and merge changes gets complicated fast, even for something as simple as a Kanban board. I also set up CI/CD with GitHub Actions and containerized both services with Docker, which was new for me going into this project.

---

*Part of a portfolio of full-stack projects — see my [other repos](https://github.com/houda-codes) for more.*