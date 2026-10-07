import { hash, verify } from '@node-rs/argon2';

export async function hashPassword(password: string) {
    return hash(password);
}

export async function verifyPassword(password: string, passwordHash: string) {
    return verify(passwordHash, password)
}
