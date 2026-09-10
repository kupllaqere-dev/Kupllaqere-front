import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import * as S from "./GameStyles";
import {
  preloadMap,
  createMap,
  ensureMapLoaded,
  getMap,
  DEFAULT_MAP,
} from "../game/MapManager";
import SocketManager from "../network/SocketManager";
import MultiplayerHandler from "../game/MultiplayerHandler";
import { createPhaserGame } from "../game/PhaserConfig";
import { fetchOutfit, updateOutfit } from "../api/items";
import { fetchFarm, plantSeed, harvestPlot, renameFarm } from "../api/farm";
import ChatBox from "./ChatBox";
import LoadingOverlay from "./LoadingOverlay";
import PlayerProfile from "./PlayerProfile";
import PlayerContextMenu from "./PlayerContextMenu";
import PlantPicker from "./PlantPicker";
import RenamePopup from "./RenamePopup";
import PlanterSystem, {
  SEEDS,
  GROW_MS,
  DEFAULT_PLANTER_NAME,
  PLANTER_NAME_MAX,
  getSeed,
} from "../game/PlanterSystem";
import SeedField from "../game/SeedField";
import TreeSystem, { FRUITS, FRUIT_GROW_MS } from "../game/TreeSystem";
import PlayerManager from "../game/PlayerManager";
import MovementManager from "../game/MovementManager";
import {
  preloadLocalPlayer,
  createLocalPlayer,
  updateLocalPlayer,
  repositionLocalPlayer,
} from "../game/LocalPlayer";
import { getSlotKey, getConflictSlots, LAYER_ORDER } from "../game/avatar/LayerConfig.js";

export default function Game({ user, onEquippedChange, onOutfitChange, onSkinColorChange, equipRef, unequipRef, applyLookBatchRef, changeMapRef, onSocketReady, onOnlinePlayersChange, onMapChange, onCoinsEarned, onXpEarned, seedInventory, onSeedCountChange, onBalancesChanged }) {
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const mpRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [whisperMessages, setWhisperMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [worldPlayerMenu, setWorldPlayerMenu] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingReady, setLoadingReady] = useState(false);
  const equippedRef = useRef({});
  const outfitRef = useRef({});
  const skinColorRef = useRef(null);
  const outfitSaveTimerRef = useRef(null);
  const pendingOutfitPayloadRef = useRef(null);
  const chatBoxRef = useRef(null);
  const worldMenuRef = useRef(null);

  // Phaser-side refs — written in create(), read in React callbacks.
  const localPlayerRef = useRef(null);
  const sceneRef = useRef(null);
  const movementRef = useRef(null);
  // Mutable holder so the Phaser update loop always reads the live zone list
  // rather than the array captured when the scene was created.
  const worldRef = useRef({ mapId: DEFAULT_MAP, walkableZones: [] });
  const teleportingRef = useRef(false);
  // Label of the map being travelled to, or null when not teleporting.
  const [teleportTo, setTeleportTo] = useState(null);
  const [teleportProgress, setTeleportProgress] = useState(1);

  // Farm props (Farm map only). Each system owns its own plot/fruit state;
  // React only renders the picker and the payout toast on top of them.
  const planterRef = useRef(null);
  const treeRef = useRef(null);
  // Seeds lying on the ground, on maps that drop them (the Garden).
  const seedFieldRef = useRef(null);
  // { kind: "seed" | "fruit", index, x, y }
  const [plantMenu, setPlantMenu] = useState(null);
  const plantMenuRef = useRef(null);
  // { x, y, value } while the planter's name board is being edited. The name is
  // kept out here so it survives the planter being rebuilt on a teleport.
  const [renameTarget, setRenameTarget] = useState(null);
  const renameRef = useRef(null);
  const planterNameRef = useRef(DEFAULT_PLANTER_NAME);
  // Server clock minus this machine's, measured when the farm is fetched. The
  // planter grows against it so a plot can't look ripe here before the server
  // will let it be harvested.
  const serverOffsetRef = useRef(0);
  // { type, amount, id } for a payout, or { text, id } for a notice
  const [harvestToast, setHarvestToast] = useState(null);
  const harvestToastTimerRef = useRef(null);
  // Read inside the Phaser callbacks, which are created once — keep the live
  // props here so a harvest always reaches the current handlers.
  const onCoinsEarnedRef = useRef(onCoinsEarned);
  onCoinsEarnedRef.current = onCoinsEarned;
  const onXpEarnedRef = useRef(onXpEarned);
  onXpEarnedRef.current = onXpEarned;
  const onSeedCountChangeRef = useRef(onSeedCountChange);
  onSeedCountChangeRef.current = onSeedCountChange;
  const onBalancesChangedRef = useRef(onBalancesChanged);
  onBalancesChangedRef.current = onBalancesChanged;

  const showToast = useCallback((toast) => {
    setHarvestToast({ ...toast, id: Date.now() });
    clearTimeout(harvestToastTimerRef.current);
    harvestToastTimerRef.current = setTimeout(() => setHarvestToast(null), 1800);
  }, []);

  // The tree is still local-only, so its fruit pays into the in-memory balance.
  // The planter's payouts come back from the server — see handleHarvestPlot.
  const handleFruitHarvest = useCallback(({ type, amount }) => {
    if (type === "xp") onXpEarnedRef.current?.(amount);
    else onCoinsEarnedRef.current?.(amount);
    showToast({ type, amount });
  }, [showToast]);

  // Sowing costs a seed from the bag. The server claims the plot and spends the
  // seed together, so a refused plant never costs a seed and a seed spent
  // always leaves something growing.
  const handleSowSeed = useCallback(async (plotIndex, seedId) => {
    try {
      const { plot, count } = await plantSeed(plotIndex, seedId);
      onSeedCountChangeRef.current?.(seedId, count);
      planterRef.current?.plant(plot.plotIndex, plot.seedId, plot.plantedAt);
    } catch (err) {
      showToast({ text: err.message || "That seed wouldn't go in" });
    }
  }, [showToast]);

  // Harvesting is the server's call: it checks ripeness against its own clock,
  // clears the plot and banks the payout. The bed only clears once that lands.
  const handleHarvestPlot = useCallback(async (plotIndex) => {
    try {
      const result = await harvestPlot(plotIndex);
      planterRef.current?.collect(plotIndex);
      onBalancesChangedRef.current?.(result);
      if (result.reward) showToast({ type: result.reward.type, amount: result.reward.amount });
    } catch (err) {
      planterRef.current?.cancelHarvest(plotIndex);
      showToast({ text: err.message || "That plant wouldn't come up" });
    }
  }, [showToast]);

  // Rebuilds (or tears down) a map's props for whichever map just became
  // active: the Farm's planter and tree, and the Garden's seed drops. Each one
  // lives only as long as the map that declares it.
  const mountMapProps = useCallback((scene, map) => {
    planterRef.current?.destroy();
    planterRef.current = null;
    treeRef.current?.destroy();
    treeRef.current = null;
    seedFieldRef.current?.destroy();
    seedFieldRef.current = null;
    setPlantMenu(null);
    setRenameTarget(null);

    // Seed drops. The server pushes the current ground state on join and on
    // every teleport, so a fresh field fills itself in; asking again covers a
    // field mounted after that push (a reconnect, say).
    if (map.seeds) {
      seedFieldRef.current = new SeedField(scene, {
        onPickup: (dropId) => socketRef.current?.pickupSeed(dropId),
      });
      socketRef.current?.requestSeeds();
    }

    if (!map.planter) return;

    const planter = new PlanterSystem(scene, {
      centerX: map.width / 2,
      centerY: Math.round(map.height * 0.55),
      name: planterNameRef.current,
      timeOffset: serverOffsetRef.current,
      onPlotClick: (index, pos) =>
        setPlantMenu({ kind: "seed", index, x: pos.clientX, y: pos.clientY }),
      onHarvest: handleHarvestPlot,
      onRenameClick: (pos, currentName) =>
        setRenameTarget({ x: pos.clientX, y: pos.clientY, value: currentName }),
    });
    planterRef.current = planter;

    // Fill the bed in from the server. Anything sown on a previous visit has
    // been growing in the meantime, so it comes back part-grown — or ripe.
    const askedAt = Date.now();
    fetchFarm()
      .then(({ name, plots, growMs, now }) => {
        if (planterRef.current !== planter || !planter.plots.length) return;
        // Blame half the round trip on each direction, so the offset doesn't
        // absorb the whole latency and start ripening plots early.
        serverOffsetRef.current = now - (askedAt + (Date.now() - askedAt) / 2);
        planter.timeOffset = serverOffsetRef.current;
        planter.growMs = growMs;
        planterNameRef.current = planter.setName(name);
        planter.load(plots);
      })
      .catch(() => showToast({ text: "Couldn't load your farm" }));

    treeRef.current = new TreeSystem(scene, {
      x: Math.round(map.width * 0.795),
      baseY: Math.round(map.height * 0.86),
      trunkLength: 150,
      onTreeClick: (index, pos) =>
        setPlantMenu({ kind: "fruit", index, x: pos.clientX, y: pos.clientY }),
      onFull: () => showToast({ text: "The tree is full — pick some fruit first" }),
      onHarvest: handleFruitHarvest,
    });
  }, [handleFruitHarvest, handleHarvestPlot, showToast]);

  useEffect(() => {
    let cancelled = false;
    let game = null;
    let socketManager = null;

    let assetsLoaded = false;
    let stateReceived = false;
    const updateReady = () => {
      if (assetsLoaded && stateReceived) setLoadingReady(true);
    };

    (async () => {
      const outfitData = await fetchOutfit().catch(() => null);
      if (cancelled) return;
      const savedOutfit = outfitData?.outfit || null;
      skinColorRef.current = outfitData?.skinColor || null;
      onSkinColorChange?.(skinColorRef.current);
      setLoadProgress(p => Math.max(p, 0.1));

      socketManager = new SocketManager();
      socketRef.current = socketManager;
      onSocketReady?.(socketManager);

      socketManager.socket.on("game:state", () => {
        stateReceived = true;
        setLoadProgress(p => Math.max(p, 0.95));
        updateReady();
      });

      // ── Garden seed drops ────────────────────────────
      // The field only exists on maps that drop seeds, so every handler is a
      // no-op elsewhere.
      socketManager.onSeedsState(({ seeds }) => seedFieldRef.current?.sync(seeds));
      socketManager.onSeedSpawned((drop) => seedFieldRef.current?.add(drop));
      socketManager.onSeedRemoved(({ id, by }) =>
        seedFieldRef.current?.remove(id, !!by),
      );
      socketManager.onSeedGranted(({ seedId, count }) => {
        onSeedCountChangeRef.current?.(seedId, count);
        showToast({ text: `Picked up a ${getSeed(seedId).name} seed` });
      });
      socketManager.onSeedError(({ message }) => showToast({ text: message }));

      const mp = new MultiplayerHandler(socketManager, {
        setChatMessages,
        setWhisperMessages,
        setOnlinePlayers,
      });

      mp.onNameUpdate = (userId, name) => {
        setViewedProfile(prev =>
          prev && String(prev.userId) === String(userId) ? { ...prev, name } : prev
        );
      };
      mp.onBioUpdate = (userId, bio) => {
        setViewedProfile(prev =>
          prev && String(prev.userId) === String(userId) ? { ...prev, bio } : prev
        );
      };
      mp.onBadgeUpdate = (userId, badge) => {
        setViewedProfile(prev =>
          prev && String(prev.userId) === String(userId) ? { ...prev, selectedBadge: badge } : prev
        );
      };
      mp.onPlayerClick = (id, name, clientX, clientY, userId) => {
        setWorldPlayerMenu(prev => {
          if (prev?.id === id) return prev;
          const flipLeft = clientX + 208 > window.innerWidth;
          return { id, name, userId, flipLeft };
        });
      };
      mpRef.current = mp;

      if (savedOutfit) {
        const outfitMap = {};
        const fullOutfit = {};
        for (const [cat, item] of Object.entries(savedOutfit)) {
          if (item?.itemId && LAYER_ORDER.includes(cat)) {
            outfitMap[cat] = item.itemId;
            fullOutfit[cat] = { itemId: item.itemId, imageUrl: item.imageUrl, subcategory: item.subcategory };
          }
        }
        equippedRef.current = outfitMap;
        outfitRef.current = fullOutfit;
        onEquippedChange(outfitMap);
        onOutfitChange(fullOutfit);
      }

      function preload() {
        this.load.on("loaderror", file => {
          if (file.key !== "colliders") console.error("Load error:", file.key);
        });
        this.load.on("progress", value => setLoadProgress(0.1 + value * 0.75));
        preloadMap(this);
        preloadLocalPlayer(this);
      }

      function create() {
        const { map, walkableZones, spawn } = createMap(this, DEFAULT_MAP);
        worldRef.current = { mapId: map.id, walkableZones };
        sceneRef.current = this;
        mountMapProps(this, map);

        const playerMgr  = new PlayerManager();
        const movement   = new MovementManager(map.width, map.height);
        const cursors    = this.input.keyboard.createCursorKeys();
        // createCursorKeys() captures Space by default, which calls preventDefault()
        // on every Space keydown page-wide (even while typing in HTML inputs/textareas
        // like the profile's About Me or Mail fields). Space isn't used for movement,
        // so release the capture.
        this.input.keyboard.removeCapture(32);

        movementRef.current = movement;

        const gender = user?.gender || "female";
        const localP = createLocalPlayer(this, spawn.x, spawn.y, user?.name || "Player", gender);
        localPlayerRef.current = localP;

        // Camera follows local player.
        this.cameras.main.setBounds(0, 0, map.width, map.height);
        this.cameras.main.startFollow(localP.sprite, false, 1, 1);

        // Click-to-move. A click that landed on an interactive object (a
        // planter plot, say) is that object's to handle — the seed picker only
        // closes when the click went to bare ground.
        this.input.on("pointerdown", pointer => {
          if (teleportingRef.current) return;
          if (this.input.hitTestPointer(pointer).length > 0) return;
          setPlantMenu(null);
          setRenameTarget(null);
          movement.handleClick(this, pointer, worldRef.current.walkableZones);
        });

        mp.setGameObjects(this, playerMgr);
        mp.localSprite = localP.sprite;
        mp.onMapChange = (mapId) => {
          worldRef.current.mapId = mapId;
          onMapChange?.(mapId);
        };
        mp.join(user?.name || "Player", user?.id, gender, spawn.x, spawn.y, map.id);
        mp.wire();

        let lastSentX    = spawn.x;
        let lastSentY    = spawn.y;
        let lastSentAnim = null;

        this.events.on("update", (_, delta) => {
          movement.step(localP.sprite, cursors, worldRef.current.walkableZones, delta / 1000);

          const lx   = localP.sprite._logicalX;
          const ly   = localP.sprite._logicalY;
          const anim = movement.currentAnimName;

          localP.sprite.setPosition(lx, ly);

          // Hold moves back mid-teleport so we don't broadcast new-map
          // coordinates into the room we're still leaving.
          if (!teleportingRef.current && (lx !== lastSentX || ly !== lastSentY || anim !== lastSentAnim)) {
            mp.sendMove({
              x:     lx,
              y:     ly,
              anim:  anim,
              frame: Number(localP.sprite.frame.name),
              t:     performance.now(),
            });
            lastSentX    = lx;
            lastSentY    = ly;
            lastSentAnim = anim;
          }

          updateLocalPlayer(localP, delta);
          mp.localChatBubble.updatePosition(localP.sprite);
          playerMgr.interpolate(delta);
          planterRef.current?.update();
          treeRef.current?.update();
        });

        assetsLoaded = true;
        setLoadProgress(p => Math.max(p, 0.85));
        updateReady();
      }

      if (cancelled) return;
      game = createPhaserGame(gameRef.current, { preload, create });
    })();

    return () => {
      cancelled = true;
      clearTimeout(harvestToastTimerRef.current);
      planterRef.current = null;
      treeRef.current = null;
      seedFieldRef.current = null;
      socketManager?.disconnect();
      game?.destroy(true);
    };
  }, []);

  // Teleport: fetch the target map's assets, rebuild the world, reposition the
  // avatar at its spawn, and ask the server to move us into that map's room.
  const handleChangeMap = useCallback(async (mapId) => {
    const scene = sceneRef.current;
    const mp    = mpRef.current;
    const localP = localPlayerRef.current;
    if (!scene || !mp || !localP) return;
    if (teleportingRef.current) return;
    if (worldRef.current.mapId === mapId) return;

    const target = getMap(mapId);
    teleportingRef.current = true;
    setTeleportTo(target.label);
    // Maps with no artwork (path: null) have nothing to fetch — skip the bar.
    setTeleportProgress(!target.path || scene.textures.exists(target.texture) ? 1 : 0);

    try {
      await ensureMapLoaded(scene, target.id, setTeleportProgress);
      if (!localP.sprite.scene) return; // scene torn down while loading

      // Drop everyone from the old room before the new roster arrives.
      mp.playerManager?.clearAll();
      setChatMessages([]);

      const { map, walkableZones, spawn } = createMap(scene, target.id);
      worldRef.current = { mapId: map.id, walkableZones };

      const movement = movementRef.current;
      if (movement) {
        movement.reset();
        movement.mapWidth  = map.width;
        movement.mapHeight = map.height;
      }

      repositionLocalPlayer(localP, spawn.x, spawn.y);
      scene.cameras.main.setBounds(0, 0, map.width, map.height);
      scene.cameras.main.centerOn(spawn.x, spawn.y);

      mountMapProps(scene, map);

      onMapChange?.(map.id);

      mp.changeMap(map.id, spawn.x, spawn.y);
    } finally {
      teleportingRef.current = false;
      setTeleportTo(null);
    }
  }, [mountMapProps]);

  if (changeMapRef) changeMapRef.current = handleChangeMap;

  const handleEquip = useCallback((item) => {
    const mp          = mpRef.current;
    const slotKey     = getSlotKey(item.category, item.subcategory);
    const effectiveId = item.itemId ?? item._id;

    // Resolve conflicts (onePiece ↔ tops/bottoms)
    const conflictSlots = getConflictSlots(item.category, equippedRef.current);

    const next = { ...equippedRef.current };
    for (const slot of conflictSlots) delete next[slot];
    next[slotKey] = item._id ?? effectiveId;
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    for (const slot of conflictSlots) delete nextOutfit[slot];
    nextOutfit[slotKey] = { itemId: effectiveId, imageUrl: item.imageUrl, subcategory: item.subcategory };
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    mp?.sendOutfitChange(nextOutfit, skinColorRef.current);

    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(
      () => updateOutfit(pendingOutfitPayloadRef.current, skinColorRef.current).catch(() => {}),
      50,
    );
  }, []);

  const handleUnequip = useCallback((slotKey) => {
    const mp = mpRef.current;

    const next = { ...equippedRef.current };
    delete next[slotKey];
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    delete nextOutfit[slotKey];
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    mp?.sendOutfitChange(nextOutfit, skinColorRef.current);

    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(
      () => updateOutfit(pendingOutfitPayloadRef.current, skinColorRef.current).catch(() => {}),
      50,
    );
  }, []);

  const handleApplyLookBatch = useCallback((equippedSlots, clearSlots, skinColor) => {
    const mp = mpRef.current;

    if (skinColor !== undefined) {
      skinColorRef.current = skinColor || null;
      onSkinColorChange?.(skinColorRef.current);
    }

    const next = { ...equippedRef.current };
    for (const slotKey of clearSlots) delete next[slotKey];
    for (const [slotKey, item] of Object.entries(equippedSlots)) {
      next[slotKey] = item._id ?? item.itemId;
    }
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    for (const slotKey of clearSlots) delete nextOutfit[slotKey];
    for (const [slotKey, item] of Object.entries(equippedSlots)) {
      nextOutfit[slotKey] = { itemId: item.itemId ?? item._id, imageUrl: item.imageUrl, subcategory: item.subcategory };
    }
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    mp?.sendOutfitChange(nextOutfit, skinColorRef.current);

    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(
      () => updateOutfit(pendingOutfitPayloadRef.current, skinColorRef.current).catch(() => {}),
      50,
    );
  }, []);

  equipRef.current = handleEquip;
  unequipRef.current = handleUnequip;
  if (applyLookBatchRef) applyLookBatchRef.current = handleApplyLookBatch;

  // Propagate onlinePlayers up so App can pass them to HUD for chess invites
  useEffect(() => {
    onOnlinePlayersChange?.(onlinePlayers);
  }, [onlinePlayers, onOnlinePlayersChange]);

  // Renaming from Settings only updates App's user — repaint our own nameplate.
  // Other clients get the change over the socket (see MultiplayerHandler).
  useEffect(() => {
    localPlayerRef.current?.nameText?.setText(user?.name || "Player");
  }, [user?.name]);

  // Only seeds the player actually holds can be sown, each showing how many
  // are left. The catalogue order is kept so the list doesn't jump around.
  const ownedSeeds = SEEDS.filter((seed) => (seedInventory?.[seed.id] ?? 0) > 0).map(
    (seed) => ({ ...seed, count: seedInventory[seed.id] }),
  );

  const handleSend = useCallback((text) => {
    socketRef.current?.sendChatMessage(text);
  }, []);

  const handleWhisper = useCallback((toId, text) => {
    socketRef.current?.sendWhisper(toId, text);
  }, []);

  useEffect(() => {
    if (!renameTarget) return;
    const keyboard = sceneRef.current?.input?.keyboard;
    const manager = keyboard?.manager;
    if (!manager) return;

    // Drop any key currently held, or the avatar keeps walking while the field
    // has focus and the key-up never arrives.
    keyboard.resetKeys();
    movementRef.current?.reset();

    const wasEnabled = manager.enabled;
    manager.enabled = false;
    return () => {
      manager.enabled = wasEnabled;
      keyboard.resetKeys();
    };
  }, [renameTarget]);

  useEffect(() => {
    if (!renameTarget) return;
    const onDown = (e) => {
      if (e.target?.tagName === "CANVAS") return;
      if (renameRef.current?.contains(e.target)) return;
      setRenameTarget(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [renameTarget]);

  useEffect(() => {
    if (!plantMenu) return;
    const onDown = (e) => {
      // Canvas clicks are resolved by the Phaser pointerdown handler above.
      if (e.target?.tagName === "CANVAS") return;
      if (plantMenuRef.current?.contains(e.target)) return;
      setPlantMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [plantMenu]);

  useEffect(() => {
    if (!worldPlayerMenu) return;
    let handler;
    const id = setTimeout(() => {
      handler = (e) => {
        if (!worldMenuRef.current?.contains(e.target)) setWorldPlayerMenu(null);
      };
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(id);
      if (handler) document.removeEventListener("mousedown", handler);
    };
  }, [worldPlayerMenu]);

  useEffect(() => {
    if (!worldPlayerMenu) return;
    const { id } = worldPlayerMenu;
    let flipLeft = worldPlayerMenu.flipLeft;
    let frameId;
    const MENU_W = 228; // 200px content + 10px left pad + 10px right pad + 8px translate

    function toVP(wx, wy, cam, appScale, cx, cy) {
      return {
        x: (wx - cam.scrollX) * cam.zoom * appScale + cx - 960 * appScale,
        y: (wy - cam.scrollY) * cam.zoom * appScale + cy - 540 * appScale,
      };
    }

    function tick() {
      const el = worldMenuRef.current;
      const other = mpRef.current?.playerManager?.otherPlayers.get(id);

      if (!el || !other?.sprite?.scene) { frameId = requestAnimationFrame(tick); return; }

      const sprite = other.sprite;
      const cam    = sprite.scene.cameras.main;
      const appScale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;

      // Visible game area in viewport px (accounts for letterboxing)
      const gameW      = 1920 * appScale;
      const gameH      = 1080 * appScale;
      const gameLeft   = cx - gameW / 2;
      const gameRight  = cx + gameW / 2;
      const gameTop    = cy - gameH / 2;
      const gameBottom = cy + gameH / 2;

      // Close as soon as the sprite's center leaves the camera's visible world area
      const wv = cam.worldView;
      if (
        sprite.x < wv.x || sprite.x > wv.x + wv.width ||
        sprite.y < wv.y || sprite.y > wv.y + wv.height
      ) {
        setWorldPlayerMenu(null);
        return;
      }

      // Compute both side anchors (shoulder height)
      const shoulderY   = sprite.y - sprite.displayHeight * 0.72;
      const rightAnchor = toVP(sprite.x + sprite.displayWidth * 0.25, shoulderY, cam, appScale, cx, cy);
      const leftAnchor  = toVP(sprite.x - sprite.displayWidth * 0.25, shoulderY, cam, appScale, cx, cy);

      // Flip before menu edge reaches the game area boundary (guard against fast movement)
      const FLIP_GUARD = 6;
      if (!flipLeft && rightAnchor.x + MENU_W > gameRight - FLIP_GUARD) flipLeft = true;
      else if (flipLeft && leftAnchor.x - MENU_W < gameLeft + FLIP_GUARD) flipLeft = false;

      const anchor = flipLeft ? leftAnchor : rightAnchor;
      el.style.left      = anchor.x + 'px';
      el.style.top       = Math.max(gameTop + 4, Math.min(anchor.y, gameBottom - 280)) + 'px';
      el.style.transform = flipLeft ? 'translate(calc(-100% - 8px), 0)' : 'translate(8px, 0)';

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [worldPlayerMenu?.id]);

  return (
    <S.Container>
      <S.GameWrapper ref={gameRef} />
      <LoadingOverlay progress={loadProgress} ready={loadingReady} />
      {teleportTo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 500,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: "rgba(18, 6, 40, 0.82)",
            backdropFilter: "blur(6px)",
            color: "rgba(235, 220, 255, 0.9)",
            fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
            fontSize: 20,
            letterSpacing: 1.4,
            pointerEvents: "all",
          }}
        >
          <div>Travelling to {teleportTo}…</div>
          <div style={{ width: 260, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.round(Math.max(0, Math.min(1, teleportProgress)) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, #ff7eb9 0%, #7afcff 100%)",
                transition: "width 180ms ease-out",
              }}
            />
          </div>
        </div>
      )}
      <ChatBox
        ref={chatBoxRef}
        messages={chatMessages}
        whispers={whisperMessages}
        players={onlinePlayers}
        myId={socketRef.current?.id}
        myName={user?.name || "Player"}
        onSend={handleSend}
        onWhisper={handleWhisper}
        onViewProfile={setViewedProfile}
      />
      {viewedProfile && (
        <PlayerProfile
          onClose={() => setViewedProfile(null)}
          playerName={viewedProfile.name}
          outfit={viewedProfile.outfit}
          gender={viewedProfile.gender}
          skinColor={viewedProfile.skinColor ?? null}
          bio={viewedProfile.bio}
          selectedBadge={viewedProfile.selectedBadge}
          currentUserId={user?.id || null}
          currentUserName={user?.name || ""}
          targetUserId={viewedProfile.userId || null}
          socket={socketRef.current}
        />
      )}
      {harvestToast && (
        <div
          key={harvestToast.id}
          style={{
            position: "absolute",
            left: "50%",
            top: 120,
            transform: "translateX(-50%)",
            zIndex: 400,
            padding: "12px 26px",
            borderRadius: 999,
            background: "rgba(28, 10, 58, 0.9)",
            border: `1px solid ${
              harvestToast.text
                ? "rgba(200, 180, 235, 0.5)"
                : harvestToast.type === "xp"
                ? "rgba(120, 200, 255, 0.6)"
                : "rgba(255, 211, 77, 0.55)"
            }`,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
            color: harvestToast.text
              ? "#e6dcff"
              : harvestToast.type === "xp"
              ? "#bfe9ff"
              : "#ffe9a8",
            fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 0.6,
            pointerEvents: "none",
          }}
        >
          {harvestToast.text ??
            `+${harvestToast.amount.toLocaleString()} ${harvestToast.type === "xp" ? "XP" : "coins"}`}
        </div>
      )}
      {renameTarget && createPortal(
        <RenamePopup
          ref={renameRef}
          x={renameTarget.x}
          y={renameTarget.y}
          title="Name this planter"
          initialValue={renameTarget.value}
          maxLength={PLANTER_NAME_MAX}
          onSave={(name) => {
            // Show the trimmed name straight away, then let the server's own
            // trimming have the last word when it answers.
            const applied = planterRef.current?.setName(name);
            if (applied) planterNameRef.current = applied;
            renameFarm(name)
              .then(({ name: stored }) => {
                planterNameRef.current = planterRef.current?.setName(stored) ?? stored;
              })
              .catch(() => showToast({ text: "Couldn't save that name" }));
          }}
          onClose={() => setRenameTarget(null)}
        />,
        document.body
      )}
      {plantMenu && createPortal(
        <PlantPicker
          ref={plantMenuRef}
          x={plantMenu.x}
          y={plantMenu.y}
          title={plantMenu.kind === "seed" ? "Plant a seed" : "Graft a fruit"}
          items={plantMenu.kind === "seed" ? ownedSeeds : FRUITS}
          empty={
            plantMenu.kind === "seed"
              ? "No seeds yet — they drop in the Garden."
              : "Nothing to graft."
          }
          footer={`Ripens in ${Math.round(
            (plantMenu.kind === "seed"
              ? planterRef.current?.growMs ?? GROW_MS
              : FRUIT_GROW_MS) / 1000,
          )}s`}
          onPick={(id) =>
            plantMenu.kind === "seed"
              ? handleSowSeed(plantMenu.index, id)
              : treeRef.current?.plantFruit(plantMenu.index, id)
          }
          onClose={() => setPlantMenu(null)}
        />,
        document.body
      )}
      {worldPlayerMenu && createPortal(
        <PlayerContextMenu
          ref={worldMenuRef}
          playerMenu={worldPlayerMenu}
          onClose={() => setWorldPlayerMenu(null)}
          onViewProfile={(data) => { setViewedProfile(data); setWorldPlayerMenu(null); }}
          onOpenWhisper={(p) => { chatBoxRef.current?.openWhisper(p); setWorldPlayerMenu(null); }}
          playerManagerRef={mpRef.current ? { current: mpRef.current.playerManager } : null}
          flipLeft={worldPlayerMenu.flipLeft}
          trackPosition
        />,
        document.body
      )}
    </S.Container>
  );
}
