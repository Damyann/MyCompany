import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET;
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : null;

function getEncodedKey() {
  if (!encodedKey) {
    throw new Error("Missing JWT_SECRET");
  }
  return encodedKey;
}

export async function signAuthToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getEncodedKey());
}

export async function verifyAuthToken(token) {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey());
    return payload;
  } catch (err) {
    return null;
  }
}
