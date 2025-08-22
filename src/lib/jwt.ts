import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string | undefined;
if (!JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is not set. Add it to .env.local');
}

export type JwtPayload = {
  sub: string; // user id
  email: string;
  role: 'admin' | 'user';
};

export function signToken(
  payload: JwtPayload,
  expiresIn: SignOptions['expiresIn'] = ('7d' as unknown as SignOptions['expiresIn'])
) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload as object, JWT_SECRET as Secret, options);
}

export function verifyToken<T extends object = JwtPayload>(token: string): T | null {
  if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
  try {
    return jwt.verify(token, JWT_SECRET as Secret) as T;
  } catch {
    return null;
  }
}
