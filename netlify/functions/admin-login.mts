import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "feathers_publisher_session";
const SESSION_SUBJECT = "feathers-publisher";
const SESSION_MAX_AGE = 604800;

function sessionToken(secret: string) {
  return createHmac("sha256", secret).update(SESSION_SUBJECT).digest("hex");
}

function passwordMatches(submitted: string, configured: string) {
  const submittedDigest = createHash("sha256").update(submitted).digest();
  const configuredDigest = createHash("sha256").update(configured).digest();
  return timingSafeEqual(submittedDigest, configuredDigest);
}

async function submittedPassword(req: Request) {
  try {
    const body = (await req.json()) as { password?: unknown } | null;
    return body?.password;
  } catch {
    return undefined;
  }
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
  }

  const configuredPassword = process.env.PUBLISHER_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!configuredPassword || !secret) {
    return Response.json({ message: "Publisher sign-in is not configured." }, { status: 503 });
  }

  const password = await submittedPassword(req);

  if (typeof password !== "string" || !passwordMatches(password, configuredPassword)) {
    return Response.json({ message: "Invalid publisher password." }, { status: 401 });
  }

  return Response.json(
    { authenticated: true },
    {
      headers: {
        "Set-Cookie": `${SESSION_COOKIE}=${sessionToken(secret)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`,
      },
    },
  );
};
