# Capitolul 2. Tehnologii folosite

Aplicația *Neclis World* este construită pe un stack tehnologic modern, ales cu scopul de a asigura performanță în timp real, scalabilitate și o experiență fluidă pentru utilizator. Arhitectura proiectului urmează un model **monorepo** pe partea de client, cu trei aplicații Vite/React independente (clientul de joc principal, portalul administrativ și portalul creatorilor), fiecare comunicând cu un backend comun Node.js/Express prin REST API și WebSocket (Socket.IO). Baza de date este gestionată prin serviciul cloud Supabase (PostgreSQL), iar livrarea în producție se face prin platformele Vercel (frontend) și Railway (backend).

Figura 2.1 ilustrează arhitectura generală a sistemului și relațiile dintre componentele principale.

> **[Figura 2.1]** – Diagrama arhitecturală generală a aplicației Neclis World: trei clienți React (joc, admin, creator) comunică prin HTTP/REST și WebSocket cu serverul Node.js, care interacționează cu baza de date Supabase (PostgreSQL) și cu stocarea de fișiere Supabase Storage.

---

## 2.1 Frontend

Stratul de prezentare al aplicației este împărțit în trei aplicații web separate, toate construite cu aceeași combinație de baze tehnologice: **React** pentru interfața utilizator, **Vite** ca instrument de build și **Styled Components** pentru stilizare. Clientul principal de joc adaugă în plus motorul **Phaser 3** pentru lumea 2D, **PixiJS** ca renderer WebGL și **Socket.IO Client** pentru multiplayer în timp real.

### 2.1.1 React 19

React este o bibliotecă JavaScript open-source dezvoltată de Meta (Facebook), lansată în 2013 și ajunsă la versiunea 19 în 2024. Paradigma sa centrală este **UI-ul declarativ bazat pe componente**: interfața este descrisă ca o funcție a stării (*state*), iar React se ocupă eficient de actualizarea DOM-ului real atunci când starea se schimbă, prin intermediul unui **DOM virtual** (Virtual DOM).

În *Neclis World*, React 19 (versiunea `^19.2.4` în clientul principal, `^19.0.0` în admin și creator) gestionează toate elementele de interfață suprapuse peste canvas-ul jocului: HUD-ul cu inventar, chat, profiluri, magazine, sistemul de prieteni, e-mail în joc și modalele de customizare a avatarului. Separarea clară dintre logica de randare React și bucla de joc Phaser este un aspect arhitectural cheie — React nu interferează cu framerate-ul jocului.

Printre caracteristicile React 19 utilizate se numără:
- **Hooks** (`useState`, `useEffect`, `useCallback`, `useRef`) pentru gestionarea stării locale și a ciclului de viață al componentelor;
- **Context API** pentru propagarea stării de autentificare și a datelor utilizatorului;
- **Suspense** și încărcare condiționată pentru tranziția ecranelor de login/joc.

> **[Figura 2.2]** – Logo React 19. Sursa: reactjs.org

React a fost ales față de alternative precum Vue.js sau Angular datorită ecosistemului extins, maturității comunității și compatibilității excelente cu Vite și Phaser.

---

### 2.1.2 Vite

Vite (pronunțat *vit*, din franceză — „rapid") este un instrument modern de build front-end creat de Evan You (autorul Vue.js), lansat în 2020. Spre deosebire de bundlere tradiționale precum Webpack, Vite exploatează **ES Modules native** ale browserului în timpul dezvoltării, eliminând necesitatea bundling-ului complet la fiecare modificare. Rezultatul este un server de dezvoltare care pornește în câteva sute de milisecunde, indiferent de dimensiunea proiectului, și un **Hot Module Replacement (HMR)** aproape instantaneu.

Proiectul folosește trei instanțe Vite:
- **Clientul principal de joc**: Vite `^8.0.1` (cea mai recentă versiune majoră), cu plugin-ul `@vitejs/plugin-react@^6.0.1` pentru suport JSX și HMR;
- **Admin portal**: Vite `^6.3.0` cu `@vitejs/plugin-react@^4.5.0`;
- **Creator portal**: Vite `^6.3.0` cu `@vitejs/plugin-react@^4.5.0`.

Un aspect notabil este **plugin-ul personalizat** `saveCollidersPlugin` definit în `vite.config.js` al clientului principal. Acesta procesează la build-time datele de coliziune ale hărților de joc (fișiere JSON generate din editorul de hărți), optimizând modul în care sunt incluse în bundle.

Pentru producție, Vite utilizează **Rollup** (sau Rolldown în versiunile mai noi) pentru tree-shaking agresiv și generare de chunk-uri optimizate, rezultând bundle-uri mici și eficiente.

> **[Figura 2.3]** – Comparație timp de pornire server dev: Vite vs. Webpack pe un proiect de dimensiuni medii. Vite pornește în ~300ms față de ~8s pentru Webpack. Sursa: vitejs.dev/guide/why.

Variabilele de mediu în Vite sunt prefixate cu `VITE_` și expuse în cod prin `import.meta.env`: `VITE_API_URL`, `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY` sunt cele trei variabile de configurare ale aplicației.

---

### 2.1.3 Phaser 3

Phaser este cel mai popular framework JavaScript open-source pentru dezvoltarea de jocuri 2D în browser, creat de Richard Davey (Photon Storm). Versiunea 3, utilizată în proiect (`^3.90.0`), a fost rescrisă complet față de Phaser 2, oferind o arhitectură modulară bazată pe **Scene** și integrare nativă cu PixiJS ca renderer WebGL.

Phaser 3 este piesa centrală a experienței de joc din *Neclis World*. Responsabilitățile sale includ:

**Gestionarea scenelor**: Phaser organizează jocul în scene (`Phaser.Scene`). Aplicația folosește o scenă principală pentru lumea de joc, cu tranziții controlate între stări (loading, gameplay, editor).

**Sistemul de asset loading**: Phaser's `Loader` gestionează încărcarea asincronă a tuturor resurselor — spritesheeturi pentru animațiile avatarelor, imagini de fundal ale hărților, date JSON pentru coliziuni și configurații. Loader-ul suportă nativ formate PNG, WebP, JSON și spritesheeturi Phaser.

**Camera și viewport**: Camera Phaser urmărește jucătorul local cu un `lerp` (interpolare liniară) configurat, oferind o mișcare fluidă. Bounds-urile camerei sunt setate la dimensiunile hărții pentru a preveni ieșirea din lume.

**Depth sorting**: Phaser 3 permite sortarea obiectelor pe axa Z (`setDepth()`), esențial pentru perspectiva pseudo-izometrică — un avatar aflat mai jos pe ecran apare în fața obiectelor situate mai sus, creând iluzia de profunzime.

**Sistemul de coliziuni**: Datele de coliziune generate la build-time de `saveCollidersPlugin` sunt procesate de `MapManager.js` pentru a restricționa mișcarea jucătorilor, folosind un grid de tile-uri booleane.

**Animații sprite**: Phaser AnimationManager permite definirea și redarea animațiilor din spritesheeturi — fiecare avatar are animații pentru mers în 8 direcții, stând pe loc, etc.

> **[Figura 2.4]** – Schema arhitecturală a unui proiect Phaser 3: Game → SceneManager → Scene (cu subsisteme: Loader, Camera, GameObjects, Input, Physics). Sursa: phaser.io/phaser3

Configurarea Phaser se face în `PhaserConfig.js`, care definește renderer-ul (WebGL cu fallback Canvas), dimensiunile viewport-ului și lista de scene înregistrate. Phaser este inițializat după ce utilizatorul s-a autentificat, primind canvas-ul DOM creat de React.

---

### 2.1.4 PixiJS

PixiJS (`^8.17.1`) este un renderer 2D WebGL/Canvas ultra-performant, dezvoltat de Good Boy Digital. În contextul proiectului, PixiJS nu este utilizat direct de codul aplicației, ci reprezintă **layer-ul de rendering pe care Phaser 3 îl folosește intern**. Phaser delegă toate operațiunile de desenare GPU-accelerate către PixiJS, obținând astfel avantajele acestuia fără o integrare explicită.

Avantajele cheie ale PixiJS ca renderer:
- **Sprite batching**: desenează sute de sprite-uri într-un singur draw call GPU, reducând dramatic overhead-ul de render;
- **Texture Atlas**: suport nativ pentru atlase de texturi, reducând numărul de bindings GPU;
- **WebGL 2.0**: utilizează API-ul WebGL modern pentru shadere și efecte vizuale;
- **Fallback Canvas 2D**: dacă WebGL nu este disponibil (browsere vechi), PixiJS comută automat pe Canvas 2D.

Pentru *Neclis World*, unde zeci de jucători cu spritesheeturi animate sunt vizibili simultan, batching-ul PixiJS este critic pentru menținerea unui framerate constant de 60 FPS.

---

### 2.1.5 Socket.IO Client

Socket.IO (`^4.8.3`) este o bibliotecă pentru comunicare bidirecțională în timp real bazată pe WebSocket, cu fallback la long-polling HTTP. Clientul Socket.IO se conectează la serverul Socket.IO din backend la inițializarea jocului.

În *Neclis World*, Socket.IO gestionează tot stratul de **multiplayer în timp real**:

**Sincronizarea jucătorilor**: Când un jucător se mișcă, `MovementManager.js` trimite periodic (~20 ori pe secundă) evenimentul `player:move` cu poziția și animația curentă. Serverul broadcastează această informație tuturor celorlalți jucători din cameră, iar `PlayerManager.js` pe fiecare client interpolează pozițiile primite pentru a afișa mișcări fluide.

**Chat și whisper**: Mesajele de chat global (`chat:message`) și mesajele private (`chat:whisper`) sunt transmise prin Socket.IO, serverul validând și broadcastând sau rutând corespunzător.

**Sistemul de șah**: Invitațiile la șah (`chess:invite`, `chess:accept`, `chess:decline`), mutările (`chess:move`) și abandonul (`chess:resign`) sunt sincronizate în timp real prin evenimente Socket.IO dedicate.

**Guestbook stickers**: Plasarea și ștergerea sticker-elor pe guestbook-ul unui jucător este sincronizată prin evenimente `guestbook:addSticker` / `guestbook:deleteSticker`, toți utilizatorii care vizualizează același guestbook văzând modificările imediat.

**Prezență și sesiune**: Evenimente precum `friend:online`, `friend:offline`, `friend:status` și `session:kicked` gestionează starea de prezență și notificările de sesiune (de exemplu, dacă un utilizator se loghează pe alt dispozitiv).

Arhitectura event-driven a Socket.IO, bazată pe **rooms** (camere virtuale de joc), permite serverului să transmită mesaje eficient doar jucătorilor relevanți.

> **[Figura 2.5]** – Diagrama fluxului de sincronizare multiplayer: Client A trimite `player:move` → Server validează și broadcastează → Client B primește și actualizează poziția interpolată a jucătorului A.

---

### 2.1.6 Supabase JS (Client)

`@supabase/supabase-js` (`^2.105.3`) este SDK-ul oficial JavaScript pentru interacțiunea cu serviciul Supabase din browser. Supabase este o alternativă open-source la Firebase, construită peste PostgreSQL.

Pe frontend, Supabase JS este utilizat exclusiv pentru **autentificare**. Clientul Supabase (`/src/lib/supabase.js`) este inițializat cu `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY` și expune:
- **`supabase.auth.signUp()`** — înregistrare cu email și parolă;
- **`supabase.auth.signInWithPassword()`** — autentificare cu email și parolă;
- **`supabase.auth.signOut()`** — deconectare;
- **`supabase.auth.getSession()`** — obținerea sesiunii curente și a token-ului JWT.

Token-ul JWT obținut de la Supabase este trimis în headerul `Authorization: Bearer <token>` la fiecare request HTTP și Socket.IO către backend-ul Node.js, unde este validat de middleware-ul de autentificare.

---

### 2.1.7 Styled Components

Styled Components (`^6.3.12`) este o bibliotecă **CSS-in-JS** care permite scrierea stilurilor CSS direct în fișierele JavaScript/TypeScript, atașate la componente React specifice. Stilurile sunt generate dinamic la runtime și injectate în `<style>` tags, cu class names unice auto-generate pentru a evita conflictele.

```jsx
// Exemplu de utilizare în Neclis World
const ChatBox = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 300px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
`;
```

> **[Figura 2.6]** – Exemplu de cod Styled Components din aplicație: componenta ChatBox cu stiluri inline bazate pe props dinamice (de exemplu, `props.isMinimized`).

Avantajele CSS-in-JS față de CSS tradițional includ:
- **Scoping automat** — stilurile nu "scurg" în alte componente;
- **Props dinamice** — stilurile pot varia în funcție de starea componentei;
- **Co-localizare** — stilul și logica componentei sunt în același fișier;
- **Theming** — suport nativ pentru teme prin `ThemeProvider`.

Toate cele trei aplicații (joc, admin, creator) utilizează Styled Components ca soluție principală de stilizare.

---

### 2.1.8 React Router DOM

React Router DOM (`^7.6.0`) este biblioteca standard pentru **rutare declarativă** în aplicațiile React. Versiunea 7 aduce Data Router API cu suport complet pentru `loader`/`action` (data fetching la nivel de rută), dar proiectul utilizează API-ul clasic BrowserRouter pentru simplitate.

React Router DOM este utilizat în **portalul admin** și **portalul creator**, unde navigarea între pagini (login, dashboard, players, items, submissions, etc.) este gestionată prin rute. Clientul principal de joc nu utilizează React Router, deoarece este o aplicație single-page cu tranziții gestionate prin stare React și logica Phaser.

Exemplu de configurare rute admin:
```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
  <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
</Routes>
```

---

### 2.1.9 ReCharts

ReCharts (`^2.15.0`) este o bibliotecă de vizualizare a datelor pentru React, construită pe SVG și D3.js. Este utilizată exclusiv în **portalul administrativ** pentru afișarea statisticilor și analiticelor jocului.

Graficele implementate cu ReCharts în dashboard-ul admin includ:
- Grafice de linie (*LineChart*) pentru evoluția numărului de jucători în timp;
- Grafice cu bare (*BarChart*) pentru distribuția itemelor pe categorii;
- Grafice circulare (*PieChart*) pentru proporțiile rolurilor utilizatorilor.

ReCharts oferă componente declarative ușor de integrat în React, responsivitate automată și animații SVG cu zero dependențe externe.

> **[Figura 2.7]** – Screenshot dashboard admin cu grafice ReCharts: evoluție jucători activi, distribuție items pe categorie.

---

### 2.1.10 Chess.js

Chess.js (`^1.4.0`) este o bibliotecă TypeScript/JavaScript care implementează complet **logica jocului de șah**: validarea mutărilor conform regulilor oficiale FIDE, detectarea șahului, șahmat, pat, remiză, ambiguitate a mutărilor și notația algebrică standard (SAN).

În *Neclis World*, Chess.js este utilizat în componenta `ChessBoard.jsx` pentru:
- Validarea mutărilor jucătorilor (respingerea mutărilor ilegale pe client);
- Generarea tuturor mutărilor legale posibile dintr-o poziție (pentru highlight);
- Detectarea stărilor terminale (șahmat, pat, remiză prin repetare);
- Serializarea/deserializarea stării tablei în format FEN pentru sincronizarea prin Socket.IO.

Combinația Chess.js (logică) + Socket.IO (sincronizare) + React (UI tabla) oferă un minijoc de șah complet funcțional integrat natural în lumea de joc.

---

### 2.1.11 Emoji Picker React

Emoji Picker React (`^4.19.1`) este o componentă UI gata de utilizat care afișează un selector de emoji-uri în stilul celor din aplicații precum Discord sau Slack. Este utilizată în **componenta de chat** a jocului, permițând jucătorilor să insereze emoji-uri în mesajele lor.

Componenta suportă căutare după cuvinte cheie, navigare pe categorii (Smileys, People, Animals, etc.) și picker skinuri. Integrarea se face simplu prin event-ul `onEmojiClick`, care returnează caracterul unicode al emoji-ului selectat.

---

### 2.1.12 Web Workers și HTML5 Canvas API

Un aspect tehnic deosebit al aplicației este sistemul de **compoziție a avatarelor** implementat în `WorldAvatarSystem.js`. Avatarele jucătorilor sunt construite dinamic prin suprapunerea a 30+ layere de îmbrăcăminte și accesorii pe un character base, generând un spritesheet animat complet în browser.

**HTML5 Canvas API** este utilizat pentru această operațiune de compoziție pixel-by-pixel: fiecare layer (păr, tricou, pantaloni, pantofi, accesorii etc.) este desenat secvențial pe un `OffscreenCanvas`, rezultând un spritesheet PNG complet care este apoi transmis lui Phaser ca textură.

Deoarece compoziția unui avatar implică desenarea și procesarea a zeci de imagini, această operațiune ar bloca firul principal JavaScript și ar îngheta animațiile și inputul. Soluția este utilizarea **Web Workers**: compoziția rulează pe un thread de background separat, comunicând cu firul principal prin `postMessage()`. Astfel, bucla de joc Phaser continuă să ruleze la 60 FPS în timp ce avatarul se generează asincron.

```javascript
// Trimitere date către worker
avatarWorker.postMessage({ layers: equippedItems, baseSprite: base });

// Primire rezultat compus
avatarWorker.onmessage = (e) => {
  const { spritesheetBlob } = e.data;
  // Înregistrare textură în Phaser
  game.textures.addBase64(playerId, spritesheetBlob);
};
```

> **[Figura 2.8]** – Diagrama sistemului de compoziție avatar: Thread principal → postMessage cu datele layerelor → Web Worker compune canvas → postMessage cu blob PNG → Thread principal înregistrează textura în Phaser.

Această arhitectură reprezintă o utilizare avansată a API-urilor native ale browserului pentru performanță în aplicații de joc.

---

### 2.1.13 ESLint

ESLint (`^9.39.4`) este instrumentul standard de **linting** (analiză statică a codului) pentru JavaScript/TypeScript. Proiectul folosește formatul de configurare modern **flat config** (`eslint.config.js`), introdus în ESLint 8 și devenit implicit în ESLint 9.

Plugin-urile utilizate:
- `eslint-plugin-react-hooks` (`^7.0.1`) — verifică respectarea regulilor hooks React (apeluri condiționate, dependențe `useEffect`);
- `eslint-plugin-react-refresh` (`^0.5.2`) — asigură că componentele exportate sunt compatibile cu HMR-ul Vite.

ESLint este rulat automat în editorul de cod (prin extensii VS Code) și poate fi invocat manual cu `npm run lint`.

---

## 2.2 Backend

Backend-ul aplicației *Neclis World* este un server Node.js standalone, localizat în repository-ul `fv-game-back`. Acesta expune un **REST API** pentru operațiunile CRUD și un **server Socket.IO** pentru comunicarea în timp real a jocului multiplayer.

### 2.2.1 Node.js

Node.js este un runtime JavaScript open-source bazat pe motorul V8 al Chrome, care permite execuția JavaScript pe server. Modelul său de execuție este **single-threaded, event-driven, non-blocking I/O**, ideal pentru aplicații cu multe conexiuni simultane (cum este un server de joc multiplayer).

Caracteristicile Node.js care îl fac potrivit pentru *Neclis World*:
- **I/O non-blocant**: gestionarea simultană a sute de conexiuni Socket.IO fără a bloca firul principal;
- **Ecosistemul npm**: acces la mii de pachete open-source (`express`, `socket.io`, `sharp`, etc.);
- **Același limbaj ca frontend-ul**: reducerea contextului cognitiv, posibilitatea partajării unor module (validare, constante).

Backend-ul folosește modulele built-in Node.js `http` (pentru crearea serverului HTTP pe care rulează Express și Socket.IO) și `path` (pentru construirea căilor de fișiere).

Serverul este pornit cu `node --watch server.js` în development (hot-reload nativ, fără Nodemon) și `node server.js` în producție.

> **[Figura 2.9]** – Modelul event loop Node.js: o singură buclă gestionează I/O asincron (rețea, fișiere), callback-urile procesând evenimentele fără a bloca threadul. Sursa: nodejs.org

---

### 2.2.2 Express.js

Express.js (`^4.21.0`) este cel mai popular framework web minimalist pentru Node.js, oferind un strat de abstractizare peste modulul `http` nativ. Express facilitează definirea rutelor, middleware-urilor și gestionarea cererilor/răspunsurilor HTTP.

Structura rutelor în backend-ul *Neclis World*:

| Prefix rută | Fișier | Descriere |
|---|---|---|
| `/api/auth` | `routes/auth.js` | Autentificare, înregistrare, guest login |
| `/api/users` | `routes/users.js` | Profile utilizatori |
| `/api/items` | `routes/items.js` | Gestionare items, upload |
| `/api/store` | `routes/store.js` | Magazine, cumpărare items |
| `/api/inventory` | `routes/inventory.js` | Inventar jucător |
| `/api/friends` | `routes/friends.js` | Sistem de prieteni |
| `/api/soulmate` | `routes/soulmate.js` | Sistem soulmate |
| `/api/mail` | `routes/mail.js` | Sistem de mesagerie |
| `/api/guestbook` | `routes/guestbook.js` | Guestbook comentarii |
| `/api/guestbook-stickers` | `routes/guestbook-stickers.js` | Sticker canvas |
| `/api/admin` | `routes/admin.js` | Operațiuni administrative |
| `/api/creator` | `routes/creator.js` | Portalul creatorilor |

Express este inițializat în `server.js`, unde sunt aplicate middleware-urile globale (CORS, JSON parsing, trust proxy) și înregistrate toate router-ele.

**Middleware-uri Express custom**:
- `middleware/auth.js` — verifică Bearer token-ul Supabase;
- `middleware/admin.js` — verifică rolul admin;
- `middleware/creator.js` — verifică rolul creator/admin.

---

### 2.2.3 Socket.IO (Server)

Socket.IO server (`^4.7.5`) rulează pe același port cu Express, partajând instanța de server HTTP. Aceasta este o abordare comună: Express gestionează cererile HTTP, iar Socket.IO preia conexiunile WebSocket pe același port.

```javascript
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
httpServer.listen(PORT);
```

**Arhitectura rooms**: Socket.IO organizează jucătorii în **rooms** (camere virtuale). Fiecare hartă de joc este o cameră distinctă — când un jucător intră pe o hartă, este adăugat în room-ul corespunzător (`socket.join(mapName)`). Broadcast-ul evenimentelor de joc (mișcare, chat) se face la nivel de room, astfel încât jucătorii pe hărți diferite nu primesc evenimente irelevante.

**Starea in-memory a jocului**: Server-ul menține în memorie:
- `players` — map de `socketId → { userId, username, position, outfit, map }`;
- `chatHistory` — ultimele N mesaje de chat per hartă;
- `onlineUsers` (din `lib/online.js`) — timestamps de activitate pentru calculul statutului (online/away/offline).

**Sistemul de prezență** (`lib/online.js`): Un mecanism custom calculează statusul de prezență al fiecărui jucător bazat pe timestamp-ul ultimei activități. Dacă un jucător nu a trimis niciun eveniment în ultimele 15 minute, statusul său devine "away". La deconectare, statusul devine "offline" și prietenii online sunt notificați printr-un broadcast selectiv.

> **[Figura 2.10]** – Diagrama fluxului Socket.IO pentru sincronizarea mișcării jucătorilor: `player:move` emit → server validare → `player:moved` broadcast to room (excluzând emițătorul).

---

### 2.2.4 Supabase JS (Server)

Pe backend, `@supabase/supabase-js` (`^2.49.4`) este folosit cu **service role key** (cheie cu drepturi administrative complete), care ocolește Row Level Security (RLS). Aceasta permite serverului să efectueze orice operațiune pe baza de date fără restricțiile impuse utilizatorilor obișnuiți.

Clientul Supabase server este inițializat în `lib/supabase.js`:
```javascript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

Opțiunile `autoRefreshToken: false` și `persistSession: false` sunt importante pe server, unde nu există o sesiune utilizator de menținut — fiecare request este autentificat independent.

Supabase JS pe server este utilizat pentru:
- Query-uri de citire/scriere în toate tabelele bazei de date;
- Validarea token-urilor JWT Supabase din headerele request-urilor;
- Upload/download de fișiere în Supabase Storage;
- Operațiuni administrative (creare conturi, gestionare roluri).

---

### 2.2.5 Sharp

Sharp (`^0.34.5`) este o bibliotecă Node.js pentru **procesarea de imagini** de înaltă performanță, bazată pe biblioteca nativă libvips. Este semnificativ mai rapidă decât alternative JavaScript pure datorită procesării native a imaginilor.

În *Neclis World*, Sharp este utilizat în ruta `POST /api/items/upload` pentru:

1. **Validarea formatului**: verificarea magic bytes-ilor PNG înainte de procesare;
2. **Conversia PNG → WebP**: fișierele uploadate de creatori sunt convertite din PNG în format WebP cu calitate 85%, reducând dimensiunea cu 20-40% față de PNG;
3. **Generarea thumbnail-urilor**: din spritesheetul complet (de exemplu, 256×(256×animFrames) px), Sharp extrage primul frame și îl redimensionează la 256×256 px pentru thumbnail-ul afișat în magazin și inventar.

```javascript
const webpBuffer = await sharp(buffer)
  .webp({ quality: 85 })
  .toBuffer();

const thumbnailBuffer = await sharp(buffer)
  .extract({ left: 0, top: 0, width: 256, height: 256 })
  .resize(256, 256)
  .toBuffer();
```

Procesarea imaginilor pe server garantează că toate imaginile din baza de date respectă formatul și dimensiunile corecte, indiferent de ce uploadează utilizatorul.

---

### 2.2.6 Multer

Multer (`^2.1.1`) este un middleware Express pentru gestionarea **form data multipart/form-data**, formatul standard pentru upload-ul de fișiere în HTTP. Multer procesează request-urile de tip form-data și pune fișierele și câmpurile text la dispoziție în `req.file` / `req.files` și `req.body`.

Configurarea în proiect:
```javascript
const upload = multer({
  storage: multer.memoryStorage(), // stochează în RAM, nu pe disc
  limits: { fileSize: 2 * 1024 * 1024 }, // limită 2MB
});
```

Utilizarea `memoryStorage` (în loc de `diskStorage`) este o alegere deliberată: fișierul nu este niciodată scris pe discul serverului, ci este procesat direct în memorie de Sharp și încărcat în Supabase Storage. Aceasta elimină necesitatea de a gestiona fișiere temporare și este potrivită pentru un server stateless (Railway nu garantează persistența fișierelor pe disc).

---

### 2.2.7 CORS

CORS (`^2.8.6`) (Cross-Origin Resource Sharing) este un mecanism de securitate al browserului care restricționează request-urile HTTP din domenii diferite. Pachetul `cors` pentru Express configurează headerele HTTP necesare pentru a permite accesul frontend-ului la API.

```javascript
app.use(cors({ origin: "*" }));
```

Configurația `origin: "*"` permite accesul din orice origine, potrivit pentru perioada de dezvoltare și pentru un joc public. Opțional, în producție, aceasta poate fi restricționată la domeniile Vercel ale aplicației.

---

### 2.2.8 Express Rate Limit

Express Rate Limit (`^8.3.2`) implementează **limitarea ratei de request-uri** (rate limiting) per IP, o măsură esențială de securitate împotriva atacurilor brute-force și abuzurilor.

Limitele configurate în `routes/auth.js`:

| Endpoint | Limită | Fereastra de timp | Scop |
|---|---|---|---|
| `POST /login` | 10 cereri | 15 minute | Prevenire brute-force parole |
| `POST /register` | 5 cereri | 1 oră | Prevenire creare masivă conturi |
| `POST /guest` | 10 cereri | 1 oră | Prevenire abuz sesiuni guest |

La depășirea limitei, serverul returnează automat HTTP 429 Too Many Requests cu un mesaj de eroare, fără ca logica aplicației să fie invocată.

---

### 2.2.9 UUID

UUID (`^13.0.0`) generează **identificatori unici universali** (Universally Unique Identifiers), esențiali pentru identificarea unică a resurselor distribuite fără coordonare centralizată.

În backend-ul *Neclis World*, UUID v4 (random) este utilizat pentru:
- ID-uri de thread-uri de mail;
- ID-uri de sticker-e din guestbook;
- ID-uri temporare generate pe server înainte de inserția în baza de date.

Tabelele bazei de date folosesc `gen_random_uuid()` la nivel PostgreSQL (funcție nativă Supabase/PostgreSQL) pentru generarea UUID-urilor primare, dar în unele cazuri UUID-ul este generat în cod Node.js pentru a fi disponibil înainte de inserție.

---

### 2.2.10 dotenv

dotenv (`^17.3.1`) este o bibliotecă minimalistă care încarcă variabilele de mediu din fișierul `.env` în `process.env`. Aceasta este practica standard pentru gestionarea configurației sensibile (chei API, URL-uri de baze de date) în aplicații Node.js.

Variabilele de mediu utilizate de backend:
```
PORT=3000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_STORAGE_BUCKET=kupllaqere
SERVER_URL=https://api.neclisworld.com
```

Fișierul `.env` nu este niciodată comis în git (inclus în `.gitignore`). În producție (Railway), variabilele sunt configurate direct în panoul de control al platformei.

---

## 2.3 Baza de date

### 2.3.1 PostgreSQL prin Supabase

Baza de date a aplicației *Neclis World* este un **PostgreSQL** gestionat prin **Supabase**. PostgreSQL este cel mai avansat sistem de baze de date relaționale open-source, cu suport pentru tipuri de date complexe (JSON, arrays, UUID), tranzacții ACID, indecși avansați și proceduri stocate.

Supabase este o platformă BaaS (Backend-as-a-Service) care oferă o instanță PostgreSQL gestionată în cloud, împreună cu:
- **Authentication** — sistem complet de autentificare cu JWT;
- **Auto-generated REST API** — API PostgREST automat din schema bazei de date;
- **Storage** — stocare de obiecte S3-compatibilă;
- **Real-time subscriptions** — notificări în timp real prin WebSocket bazate pe WAL (Write-Ahead Log) PostgreSQL;
- **Dashboard** — interfață web pentru administrarea bazei de date.

> **[Figura 2.11]** – Arhitectura Supabase: PostgreSQL + PostgREST (API auto-generat) + GoTrue (autentificare) + Realtime (WAL → WebSocket) + Storage (S3 API). Sursa: supabase.com/docs/architecture.

---

### 2.3.2 Schema bazei de date

Schema bazei de date este definită în fișierele SQL din directorul `/db/` și `/migrations/` ale backend-ului. Tabelele principale sunt:

**`profiles`** — Contul și profilul fiecărui jucător:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  roles TEXT[] DEFAULT '{}',
  coins INTEGER DEFAULT 500,
  gems INTEGER DEFAULT 10,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  bio TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  presence_status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`items`** — Toate itemele din joc (echipamente, decoruri):
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  slot TEXT,
  price_coins INTEGER DEFAULT 0,
  price_gems INTEGER DEFAULT 0,
  image_url TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`inventory`** — Items deținute de jucători:
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);
```

**`friendships`** — Relații de prietenie și cereri:
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);
```

**`submissions`** — Items trimise de creatori pentru aprobare admin:
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  image_url TEXT,
  thumbnail_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`mail`** — Sistemul de mesagerie internă cu thread-uri:
```sql
CREATE TABLE mail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`guestbook_stickers`** — Canvas de sticker-e pe profilurile jucătorilor:
```sql
CREATE TABLE guestbook_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  placed_by UUID REFERENCES profiles(id),
  sticker_item_id UUID REFERENCES items(id),
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT NOW()
);
```

> **[Figura 2.12]** – Diagrama relațională (ERD) a bazei de date Neclis World cu tabelele principale și relațiile FK dintre ele: profiles → inventory → items, profiles → friendships, profiles → mail, profiles → guestbook_stickers.

---

### 2.3.3 Row Level Security (RLS)

Row Level Security (RLS) este o funcționalitate PostgreSQL care permite definirea de **politici de securitate la nivel de rând**, astfel încât utilizatorii pot accesa prin API-ul auto-generat Supabase doar rândurile pentru care au permisiune.

De exemplu, o politică RLS pentru tabelul `inventory`:
```sql
CREATE POLICY "Users can only see own inventory"
ON inventory FOR SELECT
USING (auth.uid() = user_id);
```

Această politică garantează că niciun utilizator nu poate citi inventarul altui utilizator prin Supabase client direct, chiar dacă ar construi manual un request PostgREST. Deoarece backend-ul Node.js folosește `service_role key` (care ocolește RLS), RLS protejează în principal accesul direct al clienților la Supabase.

---

### 2.3.4 Supabase Storage

Supabase Storage este un serviciu de stocare a obiectelor compatibil S3, utilizat pentru stocarea imaginilor items-elor jocului. Fișierele sunt organizate în **bucket-uri** — proiectul folosește bucket-ul `kupllaqere`.

Structura de fișiere în storage:
```
kupllaqere/
├── items/
│   ├── {itemId}.webp          (imaginea completă spritesheet)
│   └── thumbnails/
│       └── {itemId}_thumb.webp (thumbnail 256×256)
└── submissions/
    └── {submissionId}.webp     (items în așteptare aprobare)
```

Funcțiile din `lib/storage.js` abstractizează operațiunile:
- `uploadFile(bucket, path, buffer, contentType)` — upload fișier;
- `deleteFiles(bucket, paths[])` — ștergere în batch.

URL-urile publice ale imaginilor sunt generate cu `supabase.storage.from(bucket).getPublicUrl(path)` și stocate în coloana `image_url` a tabelului `items`, de unde sunt citite direct de clienți.

---

### 2.3.5 Migrații și evoluția schemei

Schema bazei de date este versionată prin fișiere SQL în directorul `/migrations/`. Migrațiile folosesc pattern-ul **`IF NOT EXISTS`** pentru a fi idempotente (pot fi rulate de mai multe ori fără erori):

- `schema.sql` — Schema completă de la zero (pentru instalări noi);
- `migration.sql` — Script aditiv pentru actualizarea unui deployment existent;
- `add_presence_status.sql` — Adăugarea coloanei `presence_status` în `profiles`;
- `drop_google_id.sql` — Eliminarea coloanei `google_id` după migrarea la auth Supabase pur;
- `guestbook_stickers.sql` — Crearea tabelelor pentru sistemul de sticker-e.

Această abordare de migrații manuale este simplă și adecvată pentru un proiect de dimensiuni medii. Un ORM cu migrații automate (Prisma, Drizzle) ar fi o evoluție naturală pentru proiecte mai mari.

---

## 2.4 Production

Livrarea aplicației în producție combină două platforme cloud complementare: **Vercel** pentru hostingul frontend-ului (aplicații Vite/React statice) și **Railway** pentru backend-ul Node.js cu WebSocket.

### 2.4.1 Vercel

Vercel este o platformă cloud specializată în hostingul aplicațiilor web frontend, creată de autorii Next.js. Oferă un workflow de **deployment continuu (CD)** integrat cu GitHub: la fiecare `git push` pe branch-ul `main`, Vercel declanșează automat un build Vite și publică noua versiune în câteva zeci de secunde.

**Cum funcționează deployment-ul Vercel pentru Neclis World**:
1. Vercel detectează un proiect Vite din `package.json`;
2. Rulează comanda de build (`vite build`), generând fișiere statice în `/dist`;
3. Publică directorul `/dist` pe rețeaua CDN globală Vercel (150+ edge locations);
4. Atribuie un URL unic pentru preview deployments și actualizează URL-ul de producție.

**Avantajele Vercel** față de hosting tradițional:
- **CDN global**: fișierele statice sunt servite din locația geografică cel mai apropiată de utilizator, reducând latența;
- **HTTPS automat**: certificate SSL/TLS gestionate automat;
- **Preview deployments**: fiecare Pull Request primește un URL de preview unic;
- **Zero configurare**: Vite este detectat automat, fără fișiere de configurare suplimentare.

Cele trei aplicații frontend (joc, admin, creator) pot fi deployate ca proiecte Vercel separate sau dintr-un monorepo cu setări per-director, fiecare cu URL propriu și variabile de mediu `VITE_*` configurate în dashboard-ul Vercel.

> **[Figura 2.13]** – Fluxul de deployment Vercel: git push → GitHub → Webhook Vercel → Build Vite → CDN Deploy → URL actualizat.

---

### 2.4.2 Railway

Railway este o platformă cloud **PaaS (Platform-as-a-Service)** care simplifică deployment-ul și gestionarea aplicațiilor backend. Spre deosebire de Vercel (optimizat pentru static/serverless), Railway rulează **procese server cu stare lungă (long-running processes)**, potrivit pentru un server Node.js cu Socket.IO care menține conexiuni WebSocket persistente.

**Cum funcționează deployment-ul Railway pentru Neclis World**:
1. Railway detectează un proiect Node.js din `package.json`;
2. Rulează `npm install` și pornește serverul cu `npm start` (`node server.js`);
3. Asignează un URL HTTPS public, rutând traficul HTTP și WebSocket către procesul Node.js;
4. Monitorizează procesul și îl repornește automat în caz de crash (*auto-restart*).

**De ce Railway și nu alte platforme (Heroku, Render)**:
- **Suport nativ WebSocket**: Railway rutează traficul TCP/WebSocket fără configurare suplimentară, esențial pentru Socket.IO;
- **Deploy din GitHub**: continuous deployment similar Vercel, fără pipeline-uri CI/CD complexe;
- **Variabile de mediu**: gestionate securizat prin panoul web, fără a expune valorile în codul sursă;
- **Scaling vertical facil**: resursele CPU/RAM pot fi ajustate din dashboard.

**Considerații tehnice Socket.IO pe Railway**:
Socket.IO necesită **sticky sessions** pe infrastructuri cu multiple instanțe (load balancing). Railway, în configurația implicită cu o singură instanță, nu necesită configurare suplimentară. La scalare orizontală, ar fi necesară adăugarea **Redis adapter** pentru Socket.IO (`@socket.io/redis-adapter`) pentru sincronizarea stării între instanțe.

> **[Figura 2.14]** – Arhitectura de producție completă: Utilizator → Vercel CDN (React bundle) → Railway Node.js (REST API + Socket.IO) → Supabase (PostgreSQL + Storage). HTTPS la toate nivelurile.

**Variabilele de mediu în Railway**: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET` și `SERVER_URL` sunt configurate direct în dashboard-ul Railway, Railway setând automat variabila `PORT` la valoarea portului alocat containerului.

---

## Rezumat tehnologii utilizate

Tabelul 2.1 oferă o privire de ansamblu asupra întregului stack tehnologic al aplicației *Neclis World*.

| Tehnologie | Versiune | Categorie | Rol |
|---|---|---|---|
| React | 19.2 | Frontend | Framework UI |
| Vite | 8.0 / 6.3 | Frontend | Build tool & Dev server |
| Phaser 3 | 3.90 | Frontend | Motor joc 2D |
| PixiJS | 8.17 | Frontend | Renderer WebGL |
| Socket.IO Client | 4.8 | Frontend | Client WebSocket |
| Supabase JS | 2.105 | Frontend | Client Auth |
| Styled Components | 6.3 | Frontend | CSS-in-JS |
| React Router DOM | 7.6 | Frontend | Rutare SPA |
| ReCharts | 2.15 | Frontend | Vizualizare date (admin) |
| Chess.js | 1.4 | Frontend | Logică șah |
| Emoji Picker React | 4.19 | Frontend | UI component picker |
| Web Workers API | Native | Frontend | Threading background |
| HTML5 Canvas API | Native | Frontend | Compoziție avatar |
| ESLint | 9.39 | Dev Tools | Linting cod |
| Node.js | 18+ | Backend | Runtime server |
| Express.js | 4.21 | Backend | Framework REST API |
| Socket.IO Server | 4.7 | Backend | Server WebSocket |
| Supabase JS | 2.49 | Backend | Client DB (service role) |
| Sharp | 0.34 | Backend | Procesare imagini |
| Multer | 2.1 | Backend | Upload fișiere |
| CORS | 2.8 | Backend | Middleware CORS |
| Express Rate Limit | 8.3 | Backend | Rate limiting |
| UUID | 13.0 | Backend | Generare ID-uri unice |
| dotenv | 17.3 | Backend | Config mediu |
| PostgreSQL | 15+ | Baza de date | RDBMS principal |
| Supabase | Cloud | Baza de date | PostgreSQL managed + Auth + Storage |
| Vercel | Cloud | Producție | Hosting frontend (CDN) |
| Railway | Cloud | Producție | Hosting backend (PaaS) |

> **Tabelul 2.1** – Stack-ul tehnologic complet al aplicației Neclis World.

Alegerea acestui stack reflectă prioritățile proiectului: **performanță în timp real** (Phaser + Socket.IO + WebWorkers), **productivitate de dezvoltare** (React + Vite + Supabase), **securitate** (JWT + RLS + rate limiting) și **deployment simplificat** (Vercel + Railway cu CD din GitHub).
