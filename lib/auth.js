import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET;
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : null;

function getEncodedKey() {
  if (!encodedKey) {
    throw new Error("Missing JWT_SECRET");
  }
  return encodedKey;
}

// Създаваме токен – ще го слагаме в httpOnly cookie
export async function signAuthToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h") // валиден 8 часа
    .sign(getEncodedKey());
}

// Проверяваме токена – използва се в middleware и по API
export async function verifyAuthToken(token) {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey());
    return payload; // тук имаме { userId, role, nickname/name, iat, exp, ... }
  } catch (err) {
    return null; // невалиден или изтекъл токен
  }
}

