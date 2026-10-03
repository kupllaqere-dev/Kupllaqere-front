import { useEffect, useState } from "react";
import { loadItemAtlas, loadImage, rawPiece } from "@avatar/CanvasRig.js";

/**
 * Garments for rig submissions: each packed atlas once it's ready (its meta
 * carries the item's layer), otherwise the creator's raw uploads.
 */
export function useSubmissionGarments(subs) {
  const [garments, setGarments] = useState([]);
  const [error, setError] = useState(null);
  const key = subs.map((s) => `${s.id}:${s.atlasJsonUrl}:${(s.parts || []).map((p) => p.url).join(",")}`).join("|");

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all(subs.filter((s) => s.format === "rig").map(async (s) => {
      if (s.atlasStatus === "ready" && s.atlasJsonUrl) {
        const { pieces, meta } = await loadItemAtlas(s.atlasJsonUrl, s.atlasUrl);
        const layer = meta?.item?.layer ?? 5;
        return [...pieces].map(([part, piece]) => ({ part, layer, piece }));
      }
      return Promise.all((s.parts || []).map(async (p) => ({ part: p.part, layer: 5, piece: rawPiece(await loadImage(p.url)) })));
    }))
      .then((lists) => { if (!cancelled) setGarments(lists.flat()); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { garments, error };
}
