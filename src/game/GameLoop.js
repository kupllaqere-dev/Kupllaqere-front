/**
 * Fixed-timestep accumulator. Logic runs at a deterministic rate regardless
 * of render framerate — prevents stutter from variable `delta`, keeps movement
 * speed consistent on 60/120/144 Hz displays, and makes networked simulation
 * reproducible.
 *
 * Pattern:
 *   loop.run(frameDeltaMs, (fixedDtSeconds) => stepLogic(fixedDtSeconds));
 *
 * Rendering is left to the caller and runs every frame (smooth visuals).
 */
export const FIXED_DT_MS = 1000 / 60;
export const FIXED_DT_S = FIXED_DT_MS / 1000;

const MAX_ACCUMULATOR_MS = 250;

export default class GameLoop {
  constructor() {
    this.accumulator = 0;
  }

  run(frameDeltaMs, onStep) {
    this.accumulator += frameDeltaMs;
    if (this.accumulator > MAX_ACCUMULATOR_MS) {
      this.accumulator = MAX_ACCUMULATOR_MS;
    }
    let steps = 0;
    while (this.accumulator >= FIXED_DT_MS) {
      onStep(FIXED_DT_S);
      this.accumulator -= FIXED_DT_MS;
      if (++steps >= 5) {
        this.accumulator = 0;
        break;
      }
    }
    return this.accumulator / FIXED_DT_MS;
  }

  reset() {
    this.accumulator = 0;
  }
}
