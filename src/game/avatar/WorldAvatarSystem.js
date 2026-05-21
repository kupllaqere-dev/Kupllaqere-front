import { avatarCompositor } from "./AvatarCompositor.js";
import { FRAME_W, FRAME_H, ANIM_DEFS } from "./LayerConfig.js";

export default class WorldAvatarSystem {
  #scene;
  #pending = new Map(); // playerId → Promise<string> (texture key)

  constructor(scene) {
    this.#scene = scene;
  }

  // Builds (or rebuilds) the composited texture for a player.
  // Returns a Promise that resolves to the Phaser texture key once ready.
  // Concurrent calls for the same playerId share the same in-flight build.
  async rebuild(playerId, gender, outfit) {
    if (this.#pending.has(playerId)) return this.#pending.get(playerId);

    const p = avatarCompositor
      .composite(gender, outfit)
      .then(canvas => {
        const scene = this.#scene;
        const key = `av_${playerId}`;

        if (scene.textures.exists(key)) scene.textures.remove(key);
        scene.textures.addSpriteSheet(key, canvas, {
          frameWidth:  FRAME_W,
          frameHeight: FRAME_H,
        });
        this.#registerAnims(key);
        this.#pending.delete(playerId);
        return key;
      })
      .catch(err => {
        this.#pending.delete(playerId);
        throw err;
      });

    this.#pending.set(playerId, p);
    return p;
  }

  // Returns the Phaser animation key for a given player + animation name.
  // animName must be one of: idle | walkLeft | walkRight | walkUp | walkDown
  animKey(playerId, animName) {
    return `av_${playerId}_${animName}`;
  }

  // Removes all Phaser resources for a player (call on player leave).
  destroy(playerId) {
    const scene = this.#scene;
    const key = `av_${playerId}`;
    for (const name of Object.keys(ANIM_DEFS)) {
      scene.anims.remove(`${key}_${name}`);
    }
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.#pending.delete(playerId);
  }

  #registerAnims(textureKey) {
    const scene = this.#scene;
    for (const [name, def] of Object.entries(ANIM_DEFS)) {
      const animKey = `${textureKey}_${name}`;
      if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
      scene.anims.create({
        key:       animKey,
        frames:    def.frames.map(f => ({ key: textureKey, frame: f })),
        frameRate: def.frameRate,
        repeat:    def.repeat,
      });
    }
  }
}
