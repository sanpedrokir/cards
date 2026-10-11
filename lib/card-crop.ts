import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

// Photos of a card or graded slab usually include a lot of table, hand or
// background. This asks a small vision model where the card (or the whole
// slab, label included) is and crops to it, so every thumbnail in the app
// shows the card edge to edge. It's best-effort: if the key is missing, the
// model is slow or unsure, or the box looks implausible, the original photo
// is returned unchanged -- a photo is never lost or mangled because of this.

const PADDING = 0.04; // extra margin around the detected box, per side
const MIN_AREA = 0.12; // a box smaller than this is probably a mis-detection
const MAX_AREA = 0.97; // a box this big means there's nothing to crop

const PROMPT = `This is a photo of a single trading card, possibly inside a graded slab (PSA/BGS/CGC), possibly on a table or held in a hand.

Find the tight bounding box around the card -- or around the whole slab, including its label and plastic case, if it is graded. Reply with ONLY a JSON object, no markdown, giving the box as fractions of the image from 0 to 1:
{"left": 0.12, "top": 0.05, "right": 0.88, "bottom": 0.95}

If there is no single card or slab, or you are not sure, reply {"found": false}.`;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function parseBox(text: string): Box | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(cleaned);
  if (parsed.found === false) return null;

  const { left, top, right, bottom } = parsed;
  const values = [left, top, right, bottom];
  if (!values.every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  if (left < 0 || top < 0 || right > 1 || bottom > 1) return null;
  if (right <= left || bottom <= top) return null;

  const area = (right - left) * (bottom - top);
  if (area < MIN_AREA || area > MAX_AREA) return null;

  return { left, top, right, bottom };
}

// If the API is rejecting us outright (out of credits, bad key, rate
// limited), every upload would wait for a call that is certain to fail. After
// one such failure, skip the crop for a while and just save the photo.
const SKIP_AFTER_REJECTION_MS = 10 * 60 * 1000;
let skipUntil = 0;

// `oriented` must already have EXIF rotation applied (so the box the model
// sees lines up with the pixels we crop).
export async function cropToCard(oriented: Buffer): Promise<Buffer> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || Date.now() < skipUntil) return oriented;

  try {
    const meta = await sharp(oriented).metadata();
    const width = meta.width;
    const height = meta.height;
    if (!width || !height) return oriented;

    const preview = await sharp(oriented)
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Fail fast: this runs while someone waits for "Add Card" to finish.
    const client = new Anthropic({ apiKey, timeout: 8_000, maxRetries: 0 });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: preview.toString("base64") },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const box = textBlock && "text" in textBlock ? parseBox(textBlock.text) : null;
    if (!box) return oriented;

    const left = Math.max(0, Math.floor((box.left - PADDING) * width));
    const top = Math.max(0, Math.floor((box.top - PADDING) * height));
    const right = Math.min(width, Math.ceil((box.right + PADDING) * width));
    const bottom = Math.min(height, Math.ceil((box.bottom + PADDING) * height));

    return await sharp(oriented)
      .extract({ left, top, width: right - left, height: bottom - top })
      .toBuffer();
  } catch (err) {
    if (err instanceof Anthropic.APIError && [400, 401, 402, 403, 429].includes(err.status ?? 0)) {
      skipUntil = Date.now() + SKIP_AFTER_REJECTION_MS;
    }
    return oriented;
  }
}
