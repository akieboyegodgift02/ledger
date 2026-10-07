import postgres from "postgres";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { EmailAlreadyExistsError } from "../../errors/email-already-exists-error.js";
import { InvalidCredentialsError }  from "../../errors/invalid-credentials-error.js";

const sql = postgres(process.env.DATABASE_URL!);

export async function registerUser(
  email: string,
  name: string,
  password: string,
) {
  const passwordHash = await hashPassword(password);

  try {
    const [user] = await sql`
      INSERT INTO users (
        email,
        name,
        password_hash
      )
      VALUES (
        ${email},
        ${name},
        ${passwordHash}
      )
      RETURNING id, email, name, status, created_at
    `;

    return user;
  } catch (error) {
    if (
      error instanceof postgres.PostgresError &&
      error.code === "23505"
    ) {
      throw new EmailAlreadyExistsError();
    }

    throw error;
  }
}

export async function loginUser(
  email: string,
  password: string,
) {
  const [user] = await sql`
    SELECT
      id,
      email,
      name,
      status,
      password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  if (!user) {
    throw new InvalidCredentialsError;
  }

  const validPassword = await verifyPassword(
    password,
    user.password_hash,
  );

  if (!validPassword) {
    throw new InvalidCredentialsError;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
  };
}