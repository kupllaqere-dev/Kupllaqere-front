# Filip World – Online Multiplayer Social Virtual World

**Bachelor's Thesis**

---

**Author:** Filip Stoenescu

**Faculty:** [FACULTY]

**Specialization:** [SPECIALIZATION]

**University:** [UNIVERSITY]

**Academic Year:** 2024–2025

**Scientific Coordinator:** [COORDINATOR NAME]

---

\newpage

## Abstract

This thesis presents the design and implementation of **Filip World**, a browser-based multiplayer social virtual world. The application allows users to create fully customizable avatars, navigate a shared 2D world in real time, interact with other players through chat, mail, a guestbook system, and in-game chess matches, and participate in a virtual economy featuring a store, inventory, and a creator submission portal.

The system is built using modern web technologies: **React** and **Phaser 3** on the client side, a **Node.js** REST API on the backend, **Supabase** for authentication, and **Socket.IO** for real-time bidirectional communication. A key technical contribution is the avatar layer compositor — a Canvas-based system that composes 30+ individual clothing and accessory layers into a single animated spritesheet, offloaded to a Web Worker to avoid main-thread freezes.

The application consists of three separate sub-applications: the main game client, an admin dashboard, and a creator portal for community-submitted content. Together, they form a complete platform covering gameplay, content creation, and administration.

---

\newpage

## Table of Contents

1. Introduction
2. Related Work and Bibliography Study
3. Technologies Used
4. System Architecture
5. Implementation
   - 5.1 Authentication and User Management
   - 5.2 Avatar System
   - 5.3 Game World and Movement
   - 5.4 Multiplayer and Real-Time Communication
   - 5.5 Social Features
   - 5.6 Virtual Economy
   - 5.7 Creator Portal
   - 5.8 Admin Dashboard
6. Testing
7. Conclusions and Future Work
8. Bibliography

---

\newpage

## 1. Introduction

### 1.1 Motivation

The web platform has evolved significantly over the past decade. What once required dedicated client software — real-time multiplayer games, social platforms, interactive media — can now be delivered entirely through a browser. Technologies like WebSockets, the HTML5 Canvas API, WebGL, and modern JavaScript engines have closed the performance gap between native and web applications considerably.

Social virtual worlds occupy a unique intersection between games and social networks. Unlike pure games, they are not goal-oriented — users explore, customize their avatar, interact with friends, and participate in community economies. Platforms like IMVU, Habbo Hotel, Club Penguin, and more recently VRChat demonstrate sustained user interest in shared virtual spaces. However, most of these platforms are either aging, discontinued, or require native client installation.

The motivation for Filip World is to explore how far a modern web stack can go in delivering a rich, persistent, social virtual world — with high-quality avatar customization, real-time multiplayer presence, social mechanics, an in-game economy, and community content creation — entirely within the browser, without plugins or native installations.

### 1.2 Objectives

The main objectives of this project are:

1. **Multiplayer real-time world**: Multiple users exist simultaneously in a shared 2D environment, with positions and animations synchronized in real time.
2. **Layered avatar system**: Each user can customize their character using clothing, accessories, and appearance items, composed into animated sprites.
3. **Social features**: Friend system, private mail, soulmate relationships, sticker guestbook, and in-game chess.
4. **Virtual economy**: An in-game store, currency (coins and gems), inventory management, and a creator submission pipeline.
5. **Three-application architecture**: Separate portals for players, creators, and administrators.
6. **Performance**: Smooth 60 FPS gameplay, responsive UI, and efficient server-client synchronization.

### 1.3 Scope

This thesis covers the full-stack implementation of Filip World, including:

- The **game client**: React-based UI, Phaser 3 game engine integration, and all player-facing features.
- The **backend REST API**: Node.js server, database design, authentication flow.
- The **real-time layer**: Socket.IO event architecture for multiplayer synchronization.
- The **creator portal**: A separate Vite/React application for community content submissions.
- The **admin dashboard**: Tools for moderation, statistics, and content approval.

### 1.4 Document Structure

The rest of this document is organized as follows. Chapter 2 reviews existing related work. Chapter 3 introduces the technologies chosen and their rationale. Chapter 4 describes the overall system architecture. Chapter 5 details the implementation of each major subsystem. Chapter 6 covers testing methodology and results. Chapter 7 concludes with a summary and directions for future work.

---

\newpage

## 2. Related Work and Bibliography Study

### 2.1 Social Virtual Worlds

Virtual worlds have been a subject of both commercial interest and academic research for decades. The concept of a persistent shared space populated by user-controlled avatars traces back to text-based MUDs (Multi-User Dungeons) of the 1980s, but the graphical web era gave rise to platforms that reached mainstream audiences.

**Habbo Hotel** (Sulake, 2000) is one of the most studied examples of a browser-based social virtual world. Built initially in Flash, it featured isometric room navigation, avatar customization, and a virtual economy. Habbo's architecture demonstrates that persistent social virtual worlds can achieve massive scale — at its peak, the platform hosted millions of registered users. Its room-based partitioning strategy (dividing the world into individual hotel rooms to limit simultaneous player count) is a classical approach to scalability in virtual worlds.

**IMVU** (2004) took a different approach: a 3D avatar chat platform with an extensive marketplace and creator economy. IMVU's "Developer Program" — allowing users to submit items for sale — is a direct inspiration for Filip World's Creator Portal. IMVU demonstrated that user-generated content is both economically viable and a driver of platform longevity.

**Club Penguin** (2005–2017) targeted a younger demographic with a cartoon-like world, minigames, and seasonal events. Its minigame integration — including chess-like puzzle games — showed that lightweight social games within a virtual world increase time-on-platform and social bonding.

### 2.2 Real-Time Web Technologies

The evolution of real-time communication in the browser is central to this project's technical foundation.

**WebSockets** (RFC 6455, 2011) formalized a persistent, full-duplex communication channel over TCP between client and server. Unlike HTTP polling, WebSockets eliminate the overhead of repeated connection establishment, enabling low-latency event-driven communication suitable for multiplayer synchronization. The Socket.IO library (Namsos et al.) builds on WebSockets with features including room management, namespace separation, automatic reconnection, and fallback transports, making it the de facto standard for real-time Node.js applications.

Fălcușan (2017), in his thesis on FLIB — a browser multiplayer action game — studied the performance of Socket.IO-based synchronization targeting 60 FPS update rates. His findings showed that the server's game loop, running at 60 Hz, was the primary bottleneck, and that WebSocket communication itself introduced acceptable latency for action games. Filip World adopts a similar architecture but relaxes the tick rate requirement (using ~20 Hz position updates with client-side interpolation), as a social world prioritizes smooth movement over frame-perfect precision.

### 2.3 HTML5 Canvas and Game Engines

The HTML5 Canvas API provides a scriptable 2D drawing surface backed by GPU-accelerated compositing. For complex game scenes, however, raw Canvas operations are cumbersome. Purpose-built frameworks abstract scene management, input, physics, and animation.

**Phaser 3** (Photon Storm, 2018) is an open-source 2D game framework built on WebGL (with Canvas fallback) and designed for high-performance browser games. Phaser provides a scene system, sprite management, animation state machines, a camera with bounds and lerp, and a complete asset loader. Its usage of WebGL via the PIXI.js renderer means it benefits from GPU compositing for all sprites.

**PixiJS** (Goodboy Digital) is the rendering core underlying Phaser and is also used directly in parts of this project. PixiJS focuses exclusively on fast 2D rendering and is commonly used in conjunction with React for hybrid UI/game interfaces.

### 2.4 Avatar Layered Compositing

Avatar customization in virtual worlds typically uses one of two approaches:

1. **Pre-composited images**: Items are combined server-side and a single image is sent to clients. This reduces client load but limits customization responsiveness.
2. **Client-side layer compositing**: Items are rendered independently and composited on the client. This enables instant preview and avoids round-trips but requires careful performance management.

Filip World uses client-side compositing via the HTML5 Canvas API, compositing 30+ layers of clothing and appearance data into a single spritesheet per player. This approach is comparable to systems described in the Spine animation tool documentation and the architecture of IMVU's avatar renderer. The key performance challenge — blocking the main thread during composition — is addressed using Web Workers, a browser API for background threads introduced in HTML5.

### 2.5 Authentication as a Service

Modern web applications increasingly delegate authentication to third-party providers. **Supabase** is an open-source Firebase alternative built on PostgreSQL, providing OAuth, row-level security, and real-time subscriptions. Its integration with Google OAuth eliminates the complexity of implementing secure session management from scratch, while its JWT-based tokens integrate cleanly with custom backend APIs.

---

\newpage

## 3. Technologies Used

### 3.1 Frontend

#### 3.1.1 React 19

React is a declarative JavaScript library for building user interfaces, developed by Meta. The component model — where UI is expressed as a function of state — makes complex interactive interfaces maintainable. Filip World uses React for all non-game UI: the HUD (heads-up display), store, inventory, chat box, friend panel, mail, profile viewer, and modals.

React 19 introduces concurrent rendering improvements and a simplified approach to server components, though Filip World uses React in client-only mode (SPA). The project uses functional components exclusively, with hooks (`useState`, `useEffect`, `useRef`, `useCallback`) for state and side-effect management.

#### 3.1.2 Phaser 3

Phaser 3 is the core game engine for the 2D world. It handles:
- **Scene management**: Loading assets, creating sprites, and updating each frame.
- **Sprite animation**: State machine-based animation sequences (idle, walk directions).
- **Camera**: Follows the local player with configurable bounds and smooth lerp.
- **Depth sorting**: Y-based depth ordering for a perspective illusion.
- **Asset loading**: Image, spritesheet, and JSON loading with progress tracking.

Phaser runs in a `<canvas>` element embedded within a React component, bridging the declarative React world with Phaser's imperative game loop.

#### 3.1.3 Vite

Vite is a next-generation build tool that uses native ES modules in development and Rollup for production bundling. It provides near-instant hot module replacement (HMR), making the development iteration cycle significantly faster than Webpack-based alternatives. The project uses three separate Vite applications — one per portal — each with its own configuration.

#### 3.1.4 Styled Components

Styled Components is a CSS-in-JS library that allows writing CSS directly in JavaScript using tagged template literals. This approach scopes styles to components, eliminates class name collisions, and enables dynamic styling based on props. The entire Filip World HUD, menus, and modals are styled using Styled Components.

#### 3.1.5 Socket.IO Client

The Socket.IO client library provides the real-time communication layer on the frontend. It handles connection management, event emission, event subscription, and automatic reconnection. The client communicates with the Socket.IO server over a WebSocket connection with polling fallback.

### 3.2 Backend

#### 3.2.1 Node.js

Node.js is a server-side JavaScript runtime built on V8. Its event-driven, non-blocking I/O model makes it well-suited for high-concurrency applications like game servers, where thousands of simultaneous connections must be managed without blocking threads. Filip World's backend API is a Node.js Express application handling REST endpoints.

#### 3.2.2 Express.js

Express is a minimal and flexible Node.js web framework that provides routing, middleware, and request/response handling. The Filip World backend uses Express to define API routes for authentication, inventory, store, friends, mail, and other domains.

#### 3.2.3 Socket.IO Server

Socket.IO provides the WebSocket server layer for real-time events. It integrates with the Express HTTP server, sharing the same port. Socket.IO's room system is used to group players and broadcast events selectively (e.g., guestbook events are scoped to players viewing the same guestbook).

#### 3.2.4 Supabase

Supabase provides two services used in this project:

1. **Authentication**: Google OAuth login via Supabase Auth. The client initiates OAuth via the Supabase JS library, and on redirect, exchanges the code for a session. The session JWT is then exchanged with the Filip World backend to issue a custom `fv_token`.
2. **Database**: PostgreSQL-backed storage for all game data. Supabase exposes this via a REST API and real-time subscriptions, though Filip World accesses the database primarily through the custom Node.js backend.

### 3.3 Development Tools

#### 3.3.1 ESLint

ESLint is a static analysis tool that identifies problematic patterns in JavaScript code. Configured with React-specific rules, it enforces consistent code style and catches common bugs during development.

#### 3.3.2 Git

Git is the version control system used throughout development. The project maintains a single repository (`fv-game`) containing all three sub-applications. Git commits document the evolution of features, with a history of over 370 commits at the time of writing.

---

\newpage

## 4. System Architecture

### 4.1 Overview

Filip World follows a **client-server architecture** with three distinct client applications and a shared backend. The architecture can be visualized as follows:

```
┌─────────────────────────────────────────────────────┐
│                      Clients                         │
│                                                      │
│  ┌───────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Game Client  │  │  Admin   │  │   Creator    │  │
│  │ (React+Phaser)│  │ Portal   │  │   Portal     │  │
│  │   Port 5173   │  │Port 5174 │  │  Port 5175   │  │
│  └───────┬───────┘  └────┬─────┘  └──────┬───────┘  │
└──────────┼───────────────┼───────────────┼───────────┘
           │               │               │
      WebSocket +      REST API         REST API
      REST API           only             only
           │               │               │
           └───────────────┴───────────────┘
                           │
              ┌────────────▼────────────┐
              │    Node.js Backend      │
              │   Express + Socket.IO   │
              │     Port 3000           │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │         Supabase        │
              │   (Auth + PostgreSQL)   │
              └─────────────────────────┘
```

### 4.2 Multi-Application Structure

The project is structured as a monorepo containing three independent Vite/React applications:

| Application | Port | Purpose | Users |
|---|---|---|---|
| Game Client | 5173 | Main game world, HUD, social features | Players |
| Admin Portal | 5174 | Moderation, statistics, content management | Administrators |
| Creator Portal | 5175 | Item design and submission | Content creators |

Each application has its own `package.json`, `vite.config.js`, and `src/` directory. They share only the backend API and the Supabase project.

### 4.3 Game Client Architecture

The game client is the most complex application. It integrates two rendering systems:

1. **React** — manages the application shell, authentication state, and all overlay UI (HUD, menus, modals, chat).
2. **Phaser 3** — renders the game world inside a `<canvas>` element managed by React.

These two systems communicate via a shared reference: React holds a ref to the Phaser game instance and passes callbacks to Phaser scenes. Phaser scenes emit events that React listens to via custom event emitters.

```
┌──────────────────────────────────────────────────┐
│                  React Layer                      │
│                                                   │
│  App.jsx (auth, global state)                     │
│    ├─ Game.jsx (Phaser container)                 │
│    │    └─ <canvas> ← Phaser renders here         │
│    ├─ HUD.jsx (inventory, store, profile)         │
│    ├─ ChatBox.jsx                                 │
│    ├─ PlayerProfile.jsx                           │
│    ├─ ChessWindow.jsx                             │
│    ├─ AngelModal.jsx                              │
│    └─ Guestbook/ ...                              │
│                                                   │
│  SocketManager.js (global Socket.IO wrapper)      │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│                  Phaser Layer                     │
│                                                   │
│  PhaserConfig.js (scene setup)                    │
│    ├─ GameLoop.js (fixed-timestep update)         │
│    ├─ MapManager.js (world loading, colliders)    │
│    ├─ LocalPlayer.js (local sprite control)       │
│    ├─ PlayerManager.js (remote player sprites)    │
│    ├─ MovementManager.js (pathfinding)            │
│    ├─ MultiplayerHandler.js (socket wiring)       │
│    └─ ChatBubbleManager.js (in-world chat)        │
│                                                   │
│  Avatar System                                    │
│    ├─ LayerConfig.js (render order, slots)        │
│    ├─ AvatarCompositor.js (canvas compositing)   │
│    ├─ AvatarCompositorWorker.js (Web Worker)      │
│    └─ WorldAvatarSystem.js (Phaser textures)      │
└──────────────────────────────────────────────────┘
```

### 4.4 Backend Architecture

The Node.js backend is a RESTful API server with Socket.IO integrated on the same HTTP server. It is organized into route handlers by domain:

- `/api/auth` — Login, registration, guest login, profile management
- `/api/users` — User status and profile viewing
- `/api/items` — Inventory, equipping, outfit management
- `/api/store` — Purchasing, selling, wishlist
- `/api/friends` — Friend list, requests, status
- `/api/mail` — Inbox, outbox, composition
- `/api/soulmate` — Relationship system
- `/api/guestbook` — Sticker placement and management
- `/api/chess` — Game state management
- `/api/admin` — Admin-only moderation endpoints
- `/api/creator` — Creator submission endpoints

Socket.IO runs alongside Express on port 3000. On connection, a socket is associated with an authenticated user. Events are namespaced and rooms are used to scope broadcasts.

### 4.5 Data Flow: Player Movement

To illustrate the data flow in a multiplayer scenario, consider player movement:

1. Player clicks a destination on the map.
2. `MovementManager` computes the target position and begins animating the local sprite.
3. A `player:moved` event is emitted via Socket.IO to the server at ~20 Hz.
4. The server broadcasts this event to all other connected clients.
5. Remote clients receive `player:moved` and update the corresponding sprite's target position.
6. `PlayerManager` smoothly interpolates each remote player's position between received snapshots.
7. Avatar animations (walk left/right/up/down) are synchronized alongside position data.

This approach — client-side prediction with server broadcast — is standard in social virtual worlds where latency tolerance is higher than in action games.

---

\newpage

## 5. Implementation

### 5.1 Authentication and User Management

#### 5.1.1 Authentication Flow

Filip World supports two authentication methods:

1. **Google OAuth via Supabase**: Users sign in with their Google account. The Supabase JS client initiates the OAuth flow with `supabase.auth.signInWithOAuth({ provider: 'google' })`, redirecting to Google's consent screen and back to the application. On return, the Supabase session is established and the access token is used to identify the user with the backend.

2. **Guest Login**: Users can skip account creation by hitting `POST /api/auth/guest`, which returns a temporary user object and token. Guest sessions are ephemeral.

After authentication, the backend issues a custom `fv_token` (stored in `localStorage`) which is sent as a `Bearer` token in all subsequent API requests. The token is refreshed automatically via Supabase's `onAuthStateChange` listener.

```javascript
// Listening for auth state changes and syncing the fv_token
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const data = await res.json();
    localStorage.setItem('fv_token', data.token);
  }
});
```

#### 5.1.2 First-Time Setup

New users are flagged with `needsSetup: true` in their profile. When this flag is detected after login, React renders the `CharacterSetup` component, prompting the user to select a display name and gender. Gender affects which base character sprite is used and determines the avatar's physical proportions. After setup, `needsSetup` is cleared and the user enters the game world.

#### 5.1.3 User Profile

Each user profile contains:

- `name` — Display name visible in-world
- `gender` — Determines base sprite (`female_new.png` or `men-test.png`)
- `bio` — Text description shown on profile
- `selectedBadge` — Active badge displayed next to the player's name
- `coins` / `gems` — Currency balances
- `level` — Player level
- Profile view settings: saved pose index, zoom, and pan for the profile display

### 5.2 Avatar System

The avatar system is the most technically complex component of Filip World. It allows players to equip 30+ items across distinct body layers and see the result as an animated sprite in the game world.

#### 5.2.1 Layer Configuration

`LayerConfig.js` defines the complete specification of the avatar:

- **Layer order**: A ranked list of all possible layers (e.g., body base, tattoos, underwear, socks, shoes, bottoms, tops, coat, neckwear, hair, hat, sunglasses, halo, horns…). The order determines which layers render on top of which.
- **Slot definitions**: Each equippable item slot is mapped to one or more layers. For example, "bottoms" maps to a single layer, while "shoes" may map to two (the shoe body and a lace overlay).
- **Conflict rules**: Certain slots are mutually exclusive. Equipping a "one-piece" outfit automatically removes any equipped "tops" and "bottoms". Equipping "boots" hides the "socks" layer.
- **Animation metadata**: Per-animation frame counts and row positions in the spritesheet (e.g., idle: row 0, 6 frames; walk-left: row 1, 6 frames).

#### 5.2.2 Compositing Pipeline

When a player's outfit changes, the avatar compositor is triggered:

1. **Image loading**: Each equipped item's image URL is fetched. A promise-based cache prevents re-fetching images that are already loaded.

2. **Layer sorting**: The equipped items are sorted by their layer index from `LayerConfig.js`.

3. **Canvas drawing**: An off-screen HTML5 Canvas (3060×4500px) is created. Starting from the base character layer, each item is drawn in sequence using `ctx.drawImage()`. Each row of the canvas corresponds to an animation direction:
   - Row 0 (y: 0–899): Idle (6 frames × 510px)
   - Row 1 (y: 900–1799): Walk left
   - Row 2 (y: 1800–2699): Walk right
   - Row 3 (y: 2700–3599): Walk up (4 frames)
   - Row 4 (y: 3600–4499): Walk down (4 frames)

4. **Web Worker offloading**: The compositing is performed inside a Web Worker (`AvatarCompositorWorker.js`). This prevents the main thread from freezing during the expensive multi-layer Canvas draw operations. The worker receives the list of image URLs and layer order via `postMessage()`, performs the composition using `OffscreenCanvas`, and returns the resulting `ImageBitmap` to the main thread.

5. **Phaser texture registration**: The returned `ImageBitmap` is registered as a Phaser texture with `this.textures.addImage()`. The game world sprite for that player is then updated to use the new texture key with the correct spritesheet frame configuration.

```
Player equips item
       │
       ▼
AvatarCompositor.compose(outfit)
       │
       ├─ Load all item images (cached)
       │
       ├─ Sort by LayerConfig order
       │
       ├─ Send to Web Worker
       │         │
       │         ├─ OffscreenCanvas 3060×4500
       │         ├─ Draw base + each layer
       │         └─ Return ImageBitmap
       │
       ├─ Register as Phaser texture
       │
       └─ Update sprite in game world
```

#### 5.2.3 Profile View System

Each player can configure how their avatar is displayed on their profile: which idle pose frame (0–5), zoom level, and pan position. These settings are persisted via `PATCH /api/auth/profile-view` and loaded when another player opens a profile with `GET /api/users/{userId}/profile-view`. This creates a personalized "avatar portrait" effect unique to each player.

#### 5.2.4 AvatarCanvas Component

A separate `AvatarCanvas.jsx` React component renders a standalone preview of a player's avatar using the same compositing pipeline. It is used in the player profile modal and in the Creator Portal's item preview. The component accepts an outfit definition as props and re-renders whenever the outfit changes, showing the player an accurate preview before saving.

### 5.3 Game World and Movement

#### 5.3.1 Map Design

The game world is a single large scene: **6272×1080 pixels**, rendered from a PNG background image (`Garden.png`). The large horizontal dimension creates a scrollable world wider than the screen, with the camera following the player.

Walkable zones are defined as polygon collision regions stored in `colliders.json`. A custom Vite dev server plugin (`saveCollidersPlugin`) exposes a development endpoint that allows saving collision geometry edited in-game directly to the JSON file — a built-in world editor workflow.

#### 5.3.2 Camera

Phaser's camera system follows the local player sprite with smooth lerp (gradual interpolation toward the target position). Camera bounds prevent it from showing areas outside the map. The camera zoom is fixed, but responsive scaling adapts the entire game viewport to the browser window.

#### 5.3.3 Depth and Perspective

To create a 2D isometric-style depth illusion, each sprite's depth value is set equal to its Y coordinate. Sprites lower on the screen (higher Y) appear in front of sprites higher on the screen (lower Y). Phaser's depth sorting re-orders sprites each frame accordingly.

Additionally, sprite scale is interpolated based on Y position: characters lower on the map appear slightly larger, reinforcing the perspective illusion.

#### 5.3.4 Player Movement

**Local player**: The `MovementManager` handles click-to-move. When the player clicks a map location, the target position is validated against walkable zones, and the sprite begins moving at 300 px/s. Keyboard arrows also control movement in 8 directions. The active animation (walk-left, walk-right, walk-up, walk-down) is selected based on the movement direction.

**Remote players**: Remote player positions arrive via Socket.IO at ~20 Hz. Between updates, the `PlayerManager` extrapolates positions using the last known velocity. A velocity clamp (max 450 px/s) prevents teleporting from spurious updates. The result is smooth movement that does not stutter even when updates are slightly irregular.

#### 5.3.5 Fixed-Timestep Game Loop

The game logic runs at a fixed timestep of 16.67ms (60 Hz target) via `GameLoop.js`. This decouples physics and state logic from the rendering frame rate:

```javascript
const FIXED_STEP = 1000 / 60;
let accumulator = 0;

function update(delta) {
  accumulator += delta;
  while (accumulator >= FIXED_STEP) {
    fixedUpdate(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }
  render(accumulator / FIXED_STEP); // interpolation alpha
}
```

`render()` receives an alpha value representing how far into the current step we are, enabling sub-frame interpolation for ultra-smooth sprite positions.

### 5.4 Multiplayer and Real-Time Communication

#### 5.4.1 Socket.IO Architecture

All real-time communication passes through a single Socket.IO connection, managed by `SocketManager.js`. The manager wraps the Socket.IO client, providing typed event emission and subscription methods used throughout the application.

On connection, the client emits `player:join` with the user's profile data. The server stores the player in an in-memory map and broadcasts `player:joined` to all other clients.

#### 5.4.2 Event Categories

**Player presence and movement:**
- `player:join` / `player:joined` / `player:left` — Lifecycle events
- `player:moved` — Position + animation state (emitted at ~20 Hz)
- `game:state` — Server sends the full list of online players on join
- `player:outfit` — Outfit change broadcast (triggers remote avatar recompose)
- `player:bio`, `player:badge` — Profile update broadcasts

**Chat:**
- `chat:message` — Global chat message broadcast
- `chat:whisper` — Private message between two users
- `chat:history` — Recent message history on join
- `chat:error` — Server-side validation errors

**Friends:**
- `friends:online` — Initial online friends list
- `friend:online` / `friend:offline` — Status change events
- `friends:refresh` — Trigger full friend list reload

**Chess:**
- `chess:invite` / `chess:invite:received` — Game invitation flow
- `chess:accept` / `chess:accept:received` — Acceptance confirmation
- `chess:move` / `chess:move:received` — Move transmission
- `chess:resign` / `chess:resign:received` — Resignation

**Guestbook:**
- `guestbook:join` / `guestbook:leave` — Room management (scoped to a specific user's guestbook)
- `guestbook:addSticker` / `guestbook:stickerAdded` — Sticker placement
- `guestbook:deleteSticker` / `guestbook:stickerDeleted` — Sticker removal

**Other:**
- `mail:new` — New mail notification
- `soulmate:refresh` — Relationship status change

#### 5.4.3 Chat Bubbles

When a player sends a chat message, a floating text bubble appears above their in-world sprite for a few seconds. `ChatBubbleManager.js` manages the lifecycle of these bubbles — creating them on `chat:message` events, positioning them relative to the player sprite, and removing them after a timeout. This creates a natural, immersive chat experience without requiring the user to constantly look at the chat panel.

### 5.5 Social Features

#### 5.5.1 Friend System

The friend system allows players to add other players as friends. The flow:

1. Player A sends a friend request to Player B via `POST /api/friends/request`.
2. Player B sees a pending request notification in their friend panel.
3. Player B accepts or declines via `POST /api/friends/accept` or `/decline`.
4. On acceptance, both players' friend lists update and Socket.IO notifies both parties.
5. The friend panel shows online/offline status for each friend in real time.

#### 5.5.2 Soulmate System

The soulmate feature allows two players to designate each other as "soulmates" — a special relationship status displayed on their profiles. The flow mirrors the friend request system but is exclusive: a player can have at most one soulmate at a time. Soulmate status is displayed with a distinct visual indicator on the profile page and in-world.

#### 5.5.3 Mail System

Players can send private mail messages to any other player. The mail system supports:

- **Threaded conversations**: Messages between the same two players are grouped into a thread.
- **Unread count**: The HUD displays a notification badge when unread mail exists.
- **Real-time notification**: `mail:new` Socket.IO events alert the recipient without requiring a page reload.
- **In-game UI**: The mail interface is accessible from the HUD with a compose, inbox, and sent view.

#### 5.5.4 Guestbook

Each player profile has a sticker-based guestbook. Visitors can place decorative stickers (selected from a picker) at custom positions on the guestbook canvas. Features include:

- **Real-time placement**: Stickers appear instantly for anyone else viewing the same guestbook.
- **Persistence**: Sticker positions, rotations, and scales are saved to the database.
- **Ownership rules**: Sticker placers can delete their own stickers; the profile owner can delete any sticker.
- **Room scoping**: Socket.IO rooms ensure guestbook events are only broadcast to players viewing the same guestbook.

#### 5.5.5 Chess

Players can challenge each other to a chess match. The implementation uses `chess.js` for move validation and game state management. The flow:

1. Player A sends an invite via the UI, emitting `chess:invite` to the server.
2. Player B receives a `chess:invite:received` event and sees a modal.
3. On acceptance, both players see the `ChessWindow` component.
4. Each move is validated by `chess.js` on the client, then broadcast via `chess:move`.
5. The opponent receives `chess:move:received` and the board updates.
6. Game-ending states (checkmate, resignation) are detected and broadcast.

### 5.6 Virtual Economy

#### 5.6.1 Currencies

Filip World has two currencies:

- **Coins** — Soft currency, earned through gameplay (not yet implemented) or by selling items. Used for most store purchases.
- **Gems** — Premium currency, intended for real-money purchase. Used for premium items.

Balances are stored server-side and returned with the user profile. All transactions are validated server-side to prevent client-side manipulation.

#### 5.6.2 Store

The store displays items available for purchase, organized by category. Players browse items, see their coin/gem prices, and purchase with a single click. The backend validates the purchase, deducts currency, and adds the item to the player's inventory. A wishlist feature allows saving items for later.

#### 5.6.3 Inventory and Outfits

The inventory displays all items a player owns, organized by category. Players click items to preview them on their avatar before equipping. Outfits — full sets of equipped items — can be saved and loaded, allowing players to switch between multiple looks quickly.

Players can also sell items back to the store for a fraction of their original price.

### 5.7 Creator Portal

The Creator Portal (`/creator/`) is a separate Vite/React application that allows community members to submit custom items for inclusion in the Filip World store.

#### 5.7.1 Submission Flow

1. Creator logs in (Google OAuth, same Supabase project).
2. Creates a new submission: name, category (hat, top, bottom, etc.), gender compatibility, and one or more color variants (each with an image upload).
3. A live avatar preview (`AvatarCanvas`) shows the item composited on a character.
4. The submission is posted to `POST /api/items/submit` with a `FormData` payload containing all variant images.
5. The submission enters `pending` status.

#### 5.7.2 Submission Sets

Creators can submit items as a **set** — a grouped collection (e.g., top + bottom + shoes designed to coordinate). Set submissions are reviewed and approved as a unit.

#### 5.7.3 Review by Admins

Admins see pending submissions in the Admin Portal's Submissions page. They can approve (with pricing configuration) or reject each submission. On approval, the items are automatically added to the store and the creator receives royalty currency.

### 5.8 Admin Dashboard

The Admin Dashboard (`/admin/`) provides moderation and management tools:

- **Dashboard**: Summary statistics (total players, items, active sessions) rendered as recharts charts.
- **Players**: Browse, search, and manage player accounts.
- **Items**: View and edit all items in the store.
- **Online**: See currently connected players in real time.
- **Mail**: Browse all in-game mail for moderation.
- **Submissions**: Review and approve/reject creator submissions.

Admin sessions use a separate token (`fv_admin_token`) and all admin endpoints are protected by server-side role validation.

---

\newpage

## 6. Testing

### 6.1 Manual Testing

The primary testing approach during development was **manual functional testing** — running the application in a browser and verifying each feature's behavior. This was supplemented by browser DevTools for network inspection, Console logging for real-time debugging, and the Phaser Debug overlay for game world diagnostics.

**Test scenarios for core features:**

| Feature | Scenario | Expected Result |
|---|---|---|
| Authentication | Login with Google | User profile loaded, redirected to game |
| Authentication | Guest login | Temporary profile, enters game |
| Avatar | Equip/unequip items | Avatar updates in real time in HUD and world |
| Avatar | Gender selection | Correct base sprite used |
| Movement | Click to move | Player navigates to target, correct animation |
| Movement | Keyboard arrows | 8-directional movement |
| Multiplayer | Two browser windows | Both players see each other move |
| Chat | Send global message | Message appears in chat and as bubble |
| Chat | Send whisper | Message visible only to recipient |
| Store | Purchase item | Currency deducted, item appears in inventory |
| Store | Insufficient funds | Error message displayed |
| Friends | Send/accept request | Friend appears in friend list |
| Chess | Full match | Moves validated, checkmate detected |
| Guestbook | Place sticker | Sticker appears on second browser viewing same guestbook |
| Creator Portal | Submit item | Submission appears in Admin Portal |
| Admin | Approve submission | Item appears in store |

### 6.2 Multiplayer Stress Testing

To test the real-time synchronization under multiple simultaneous connections, multiple browser windows were opened pointing to the same local server. Observations:

- Up to 5 simultaneous clients: Smooth synchronization, <50ms perceived latency.
- Movement interpolation: Eliminated visible jitter for players moving at constant speed.
- Chat: Messages delivered to all clients within <100ms on local network.

### 6.3 Performance Testing

**Avatar compositor performance** was profiled using the Chrome DevTools Performance panel. Key measurements:

- Main-thread compositing (baseline, 30 layers): ~180–250ms per composition — noticeably blocking on low-end hardware.
- Web Worker compositing (same 30 layers): ~170–230ms total, but main-thread blocked for <5ms (message passing overhead only).
- This confirmed the Web Worker approach was necessary for a smooth user experience.

**Frame rate**: The game world consistently maintained 60 FPS on modern hardware during single-player testing. With 5 remote players, frame rate remained stable at 60 FPS, with CPU cost increasing due to per-player interpolation and animation updates.

**Memory**: Each composited avatar spritesheet (3060×4500, RGBA) occupies approximately 55MB uncompressed in memory. In practice, GPU texture compression reduces this significantly. An LRU-style cache limits the number of fully composited avatars held simultaneously.

### 6.4 Browser Compatibility

The application was tested on:

| Browser | Version | Result |
|---|---|---|
| Chrome | 124+ | Full support |
| Firefox | 125+ | Full support |
| Edge | 124+ | Full support |
| Safari | 17+ | Full support (OffscreenCanvas supported) |

Web Workers with `OffscreenCanvas` — required for the avatar compositor — are supported in all modern browsers as of 2024.

---

\newpage

## 7. Conclusions and Future Work

### 7.1 Conclusions

This thesis presented the design and implementation of Filip World, a browser-based multiplayer social virtual world. The project demonstrates that modern web technologies — React, Phaser 3, Socket.IO, Canvas API, and Web Workers — are sufficient to build a rich, real-time, multi-user virtual environment without native client installation.

The key technical achievement of the project is the avatar layer compositor: a Canvas-based system that combines 30+ independently sourced image layers into a single animated spritesheet in real time, offloaded to a background Web Worker to maintain UI responsiveness. This system enables a level of avatar customization comparable to dedicated 3D avatar platforms, achieved entirely in the browser.

The three-application architecture (game client, creator portal, admin dashboard) cleanly separates concerns between the target audiences and enables independent development and deployment of each portal. The creator submission pipeline — from design to admin review to automatic store integration — closes the loop on a user-generated content economy without requiring backend code changes to add new items.

The real-time multiplayer layer, built on Socket.IO, successfully synchronizes player presence, movement, chat, guestbook interactions, chess matches, and friendship events across all connected clients. Client-side interpolation produces smooth visual results despite a ~20 Hz server broadcast rate.

### 7.2 Limitations

- **No server-side game logic**: Player positions are not validated on the server, leaving the movement system open to client-side manipulation. This is acceptable for a social world but would require server-side validation for competitive features.
- **No horizontal scaling**: The current Socket.IO architecture uses a single server process. Scaling to multiple server instances would require a shared state solution (e.g., Redis adapter for Socket.IO).
- **Avatar memory**: In rooms with many uniquely-customized players, holding all composited avatar textures simultaneously is memory-intensive. An eviction strategy for infrequently-seen avatars would help.
- **No automated tests**: The project relies on manual testing. Unit tests for the avatar compositor, integration tests for the API, and end-to-end tests with Playwright would significantly improve confidence during refactoring.

### 7.3 Future Work

1. **Voice chat**: Integrate WebRTC-based proximity voice chat, where players within a certain distance can hear each other.
2. **Multiple maps and rooms**: Add additional navigable areas, with rooms as separate Socket.IO namespaces to limit per-room player counts.
3. **Gameplay mechanics**: Introduce minigames, quests, or seasonal events to add goal-oriented content alongside the social layer.
4. **Mobile support**: Adapt the touch input model and responsive layout for mobile browsers.
5. **Server-side rendering**: Pre-render avatar images server-side for use in profile pages and notifications, reducing client-side compositing demand.
6. **Automated testing**: Implement Jest unit tests for business logic and Playwright end-to-end tests for critical user flows.
7. **Creator monetization**: Implement a real-money revenue share system for creator royalties.

---

\newpage

## 8. Bibliography

1. Sulake Corporation. *Habbo Hotel*. https://www.habbo.com. Accessed 2024.

2. IMVU Inc. *IMVU Developer Program Documentation*. https://developer.imvu.com. Accessed 2024.

3. Fălcușan, Sergiu. *FLIB – Joc multiplayer online de acțiune* [FLIB – Online Multiplayer Action Game]. Bachelor's Thesis, Technical University of Cluj-Napoca, Faculty of Automation and Computer Science, 2016–2017.

4. Fette, I. and Melnikov, A. *The WebSocket Protocol*. RFC 6455, Internet Engineering Task Force (IETF), December 2011. https://datatracker.ietf.org/doc/html/rfc6455.

5. Socket.IO. *Socket.IO Documentation*. https://socket.io/docs. Accessed 2024.

6. Phaser. *Phaser 3 Documentation*. https://newdocs.phaser.io. Accessed 2024.

7. PixiJS. *PixiJS Documentation*. https://pixijs.com/guides. Accessed 2024.

8. Meta Open Source. *React Documentation*. https://react.dev. Accessed 2024.

9. Supabase Inc. *Supabase Documentation*. https://supabase.com/docs. Accessed 2024.

10. Evan You. *Vite Documentation*. https://vitejs.dev. Accessed 2024.

11. Web Workers API. *MDN Web Docs — Using Web Workers*. Mozilla Developer Network. https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers. Accessed 2024.

12. HTML Living Standard. *The canvas element*. WHATWG. https://html.spec.whatwg.org/multipage/canvas.html. Accessed 2024.

13. chess.js. *chess.js — A JavaScript chess library*. https://github.com/jhlywa/chess.js. Accessed 2024.

14. Glen Maddern and Max Stoiber. *Styled Components Documentation*. https://styled-components.com/docs. Accessed 2024.

15. Fielding, Roy T. *Architectural Styles and the Design of Network-based Software Architectures*. Doctoral Dissertation, University of California, Irvine, 2000.

---

*This thesis was written by Filip Stoenescu.*
*[UNIVERSITY] — [FACULTY] — [SPECIALIZATION]*
*Academic Year 2024–2025*
