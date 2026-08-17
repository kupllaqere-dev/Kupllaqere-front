import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import * as S from "./GameStyles";
import { preloadMap, createMap, MAP_WIDTH, MAP_HEIGHT } from "../game/MapManager";
import SocketManager from "../network/SocketManager";
import MultiplayerHandler from "../game/MultiplayerHandler";
import { createPhaserGame } from "../game/PhaserConfig";
import { fetchOutfit, updateOutfit } from "../api/items";
import ChatBox from "./ChatBox";
import LoadingOverlay from "./LoadingOverlay";
import PlayerProfile from "./PlayerProfile";
import PlayerContextMenu from "./PlayerContextMenu";
import WorldAvatarSystem from "../game/avatar/WorldAvatarSystem";
import PlayerManager from "../game/PlayerManager";
import MovementManager from "../game/MovementManager";
import {
  preloadLocalPlayer,
  createLocalPlayer,
  updateLocalPlayer,
} from "../game/LocalPlayer";
import { getSlotKey, getConflictSlots, LAYER_ORDER } from "../game/avatar/LayerConfig.js";
const SPAWN_X = MAP_WIDTH / 2;
const SPAWN_Y = MAP_HEIGHT * 0.65;

export default function Game({ user, onEquippedChange, onOutfitChange, onSkinColorChange, equipRef, unequipRef, applyLookBatchRef, onSocketReady, onOnlinePlayersChange }) {
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
  const worldAvatarSystemRef = useRef(null);
  const localSpriteRef = useRef(null);

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

      const mp = new MultiplayerHandler(socketManager, {
        setChatMessages,
        setWhisperMessages,
        setOnlinePlayers,
      });

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
        const walkableZones = createMap(this);

        const avatarSys  = new WorldAvatarSystem(this);
        const playerMgr  = new PlayerManager();
        const movement   = new MovementManager(MAP_WIDTH, MAP_HEIGHT);
        const cursors    = this.input.keyboard.createCursorKeys();
        // createCursorKeys() captures Space by default, which calls preventDefault()
        // on every Space keydown page-wide (even while typing in HTML inputs/textareas
        // like the profile's About Me or Mail fields). Space isn't used for movement,
        // so release the capture.
        this.input.keyboard.removeCapture(32);

        worldAvatarSystemRef.current = avatarSys;

        const gender = user?.gender || "female";
        const localP = createLocalPlayer(this, SPAWN_X, SPAWN_Y, user?.name || "Player", gender);
        localSpriteRef.current = localP.sprite;

        // Build composited avatar; sprite shows base character until ready.
        avatarSys.rebuild("local", gender, outfitRef.current, skinColorRef.current).then(key => {
          if (!localP.sprite.scene) return;
          localP.sprite.setTexture(key);
          localP.sprite._animKey = name => avatarSys.animKey("local", name);
        }).catch(() => {});

        // Camera follows local player.
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.cameras.main.startFollow(localP.sprite, false, 1, 1);

        // Click-to-move.
        this.input.on("pointerdown", pointer => {
          movement.handleClick(this, pointer, walkableZones);
        });

        mp.setGameObjects(this, avatarSys, playerMgr);
        mp.localSprite = localP.sprite;
        mp.join(user?.name || "Player", user?.id, gender, SPAWN_X, SPAWN_Y);
        mp.wire();

        let lastSentX    = SPAWN_X;
        let lastSentY    = SPAWN_Y;
        let lastSentAnim = null;

        this.events.on("update", (_, delta) => {
          movement.step(localP.sprite, cursors, walkableZones, delta / 1000);

          const lx   = localP.sprite._logicalX;
          const ly   = localP.sprite._logicalY;
          const anim = movement.currentAnimName;

          localP.sprite.setPosition(lx, ly);

          if (lx !== lastSentX || ly !== lastSentY || anim !== lastSentAnim) {
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
      socketManager?.disconnect();
      game?.destroy(true);
      worldAvatarSystemRef.current = null;
      localSpriteRef.current = null;
    };
  }, []);

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
    _rebuildLocalAvatar(nextOutfit);

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
    _rebuildLocalAvatar(nextOutfit);

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
    _rebuildLocalAvatar(nextOutfit);

    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(
      () => updateOutfit(pendingOutfitPayloadRef.current, skinColorRef.current).catch(() => {}),
      50,
    );
  }, []);

  // Rebuilds the local player's Phaser texture whenever outfit changes.
  function _rebuildLocalAvatar(outfit) {
    const avatarSys = worldAvatarSystemRef.current;
    const sprite    = localSpriteRef.current;
    if (!avatarSys || !sprite) return;
    const gender = user?.gender || "female";
    avatarSys.rebuild("local", gender, outfit, skinColorRef.current).then(key => {
      if (!sprite.scene) return;
      sprite.setTexture(key);
      sprite._animKey = name => avatarSys.animKey("local", name);
    }).catch(() => {});
  }

  equipRef.current = handleEquip;
  unequipRef.current = handleUnequip;
  if (applyLookBatchRef) applyLookBatchRef.current = handleApplyLookBatch;

  // Propagate onlinePlayers up so App can pass them to HUD for chess invites
  useEffect(() => {
    onOnlinePlayersChange?.(onlinePlayers);
  }, [onlinePlayers, onOnlinePlayersChange]);

  const handleSend = useCallback((text) => {
    socketRef.current?.sendChatMessage(text);
  }, []);

  const handleWhisper = useCallback((toId, text) => {
    socketRef.current?.sendWhisper(toId, text);
  }, []);

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
