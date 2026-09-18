import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request } from "express";

const router: IRouter = Router();
const SESSION_COOKIE = "feathers_publisher_session";

function sessionToken() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return createHmac("sha256", secret).update("feathers-publisher").digest("hex");
}

export function isPublisherSession(req: Request) {
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const value = cookie?.slice(`${SESSION_COOKIE}=`.length);
  if (!value) return false;
  const expected = sessionToken();
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

router.post("/admin/login", (req, res) => {
  const configuredPassword = process.env.PUBLISHER_PASSWORD;
  const submittedPassword = req.body?.password;

  if (!configuredPassword) {
    res.status(503).json({ message: "Publisher sign-in is not configured." });
    return;
  }

  if (typeof submittedPassword !== "string" || submittedPassword !== configuredPassword) {
    res.status(401).json({ message: "Invalid publisher password." });
    return;
  }

  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${sessionToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
  res.json({ authenticated: true });
});

export default router;