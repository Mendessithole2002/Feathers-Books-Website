import { Router, type IRouter, type Request, type Response } from "express";
import { isPublisherSession } from "./admin";
import { createMediaUpload, getMediaFile } from "../lib/mediaStorage";

const router: IRouter = Router();
const allowedTypes = /^(audio|video)\//;

router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  if (!isPublisherSession(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, size, contentType } = req.body ?? {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof size !== "number" ||
    size <= 0 ||
    typeof contentType !== "string" ||
    !allowedTypes.test(contentType)
  ) {
    res.status(400).json({ error: "Only audio and video uploads are supported." });
    return;
  }

  try {
    const upload = await createMediaUpload();
    res.json({ ...upload, metadata: { name, size, contentType } });
  } catch (error) {
    req.log.error({ err: error }, "Error generating media upload URL");
    res.status(500).json({ error: "Failed to prepare media upload." });
  }
});

router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const rawPath = req.params.path;
    const objectPath = `/objects/${Array.isArray(rawPath) ? rawPath.join("/") : rawPath}`;
    const file = await getMediaFile(objectPath);
    const [metadata] = await file.getMetadata();
    res.setHeader("Content-Type", metadata.contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600");
    file.createReadStream().on("error", () => {
      if (!res.headersSent) res.status(404).json({ error: "Object not found." });
      else res.end();
    }).pipe(res);
  } catch (error) {
    req.log.warn({ err: error }, "Media object not found");
    res.status(404).json({ error: "Object not found." });
  }
});

export default router;