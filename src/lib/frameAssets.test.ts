import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CENTER_FRAME_PATH,
  FRAME_COUNT,
  disposeFrames,
  framePath,
  loadFrameBlobs,
  prepareFrames,
} from "./frameAssets";

describe("framePath", () => {
  it("zero-pads single-digit indices", () => {
    expect(framePath(0)).toBe("/frames/frame_00.webp");
    expect(framePath(7)).toBe("/frames/frame_07.webp");
  });

  it("does not pad two-digit indices", () => {
    expect(framePath(63)).toBe("/frames/frame_63.webp");
  });

  it("wraps an index at or above FRAME_COUNT back into range", () => {
    expect(framePath(64)).toBe("/frames/frame_00.webp");
  });

  it("wraps a negative index into range", () => {
    expect(framePath(-1)).toBe("/frames/frame_63.webp");
  });
});

describe("CENTER_FRAME_PATH", () => {
  it("points at the dedicated center frame", () => {
    expect(CENTER_FRAME_PATH).toBe("/frames/center.webp");
  });
});

/** fetch stand-in: every URL succeeds with a Blob named after it, except those listed as failing. */
function stubFetch(failing: string[] = []) {
  const fetchMock = vi.fn(async (url: string) => {
    if (failing.includes(url)) return { ok: false, status: 404, blob: async () => new Blob([]) };
    return { ok: true, status: 200, blob: async () => new Blob([url], { type: "image/webp" }) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function textOf(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadFrameBlobs", () => {
  it("downloads the center frame and all 64 rotation frames, reporting progress up to the total", async () => {
    const fetchMock = stubFetch();
    const progress: Array<[number, number]> = [];
    const blobs = await loadFrameBlobs((loaded, total) => progress.push([loaded, total]));

    expect(fetchMock).toHaveBeenCalledTimes(FRAME_COUNT + 1);
    expect(blobs.rotation).toHaveLength(FRAME_COUNT);
    expect(await textOf(blobs.center)).toBe(CENTER_FRAME_PATH);
    expect(await textOf(blobs.rotation[5])).toBe(framePath(5));
    expect(progress).toHaveLength(FRAME_COUNT + 1);
    expect(progress[progress.length - 1]).toEqual([FRAME_COUNT + 1, FRAME_COUNT + 1]);
    for (let i = 1; i < progress.length; i++) expect(progress[i][0]).toBeGreaterThan(progress[i - 1][0]);
  });

  it("fills a rotation frame that failed to download with its nearest loaded neighbour", async () => {
    stubFetch([framePath(10)]);
    const blobs = await loadFrameBlobs();
    expect(await textOf(blobs.rotation[10])).toBe(framePath(9));
  });

  it("rejects when the center frame itself cannot be downloaded", async () => {
    stubFetch([CENTER_FRAME_PATH]);
    await expect(loadFrameBlobs()).rejects.toThrow(/center/);
  });
});

describe("prepareFrames", () => {
  function stubBitmaps() {
    const closers: Array<ReturnType<typeof vi.fn>> = [];
    const createImageBitmapMock = vi.fn(
      async (_blob: Blob, _sx: number, _sy: number, _sw: number, _sh: number, options: { resizeWidth: number; resizeHeight: number }) => {
        const close = vi.fn();
        closers.push(close);
        return { width: options.resizeWidth, height: options.resizeHeight, close } as unknown as ImageBitmap;
      }
    );
    vi.stubGlobal("createImageBitmap", createImageBitmapMock);
    return { createImageBitmapMock, closers };
  }

  it("decodes every frame cropped to the visible area and resized for 1:1 drawing", async () => {
    stubFetch();
    const { createImageBitmapMock } = stubBitmaps();
    const blobs = await loadFrameBlobs();
    const rect = { sx: 64, sy: 0, sw: 1152, sh: 720 };

    const prepared = await prepareFrames(blobs, rect, 1.25, 1);

    expect(createImageBitmapMock).toHaveBeenCalledTimes(FRAME_COUNT + 1);
    // Crop is in the frames' own pixels: source units x 1.5.
    const [, sx, sy, sw, sh, options] = createImageBitmapMock.mock.calls[0];
    expect([sx, sy, sw, sh]).toEqual([96, 0, 1728, 1080]);
    expect(options).toMatchObject({ resizeWidth: 1440, resizeHeight: 900, resizeQuality: "high" });
    expect(prepared.rotation).toHaveLength(FRAME_COUNT);
    expect(prepared.rect).toEqual(rect);
    expect(prepared.center.width).toBe(1440);
  });

  it("closes every bitmap when the set is disposed, so replaced sets free their memory", async () => {
    stubFetch();
    const { closers } = stubBitmaps();
    const prepared = await prepareFrames(await loadFrameBlobs(), { sx: 0, sy: 0, sw: 1280, sh: 720 }, 1, 1);
    disposeFrames(prepared);
    expect(closers).toHaveLength(FRAME_COUNT + 1);
    closers.forEach((close) => expect(close).toHaveBeenCalledTimes(1));
  });
});
