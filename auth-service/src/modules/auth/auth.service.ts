import { prisma, redis } from "../../config";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import type { RegisterInput, LoginInput } from "./auth.schemas";

const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw { status: 409, message: "Email já cadastrado" };
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw { status: 401, message: "Credenciais inválidas" };
    }

    const passwordValid = await comparePassword(data.password, user.password);

    if (!passwordValid) {
      throw { status: 401, message: "Credenciais inválidas" };
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in Redis with 7-day TTL
    await redis.set(
      `refresh:${refreshToken}`,
      user.id,
      "EX",
      REFRESH_TOKEN_TTL
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async refresh(refreshToken: string) {
    // Check if refresh token exists in Redis
    const userId = await redis.get(`refresh:${refreshToken}`);

    if (!userId) {
      throw { status: 401, message: "Refresh token inválido ou expirado" };
    }

    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw { status: 401, message: "Usuário não encontrado" };
    }

    // Rotate: delete old refresh token, create new pair
    await redis.del(`refresh:${refreshToken}`);

    const tokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    await redis.set(
      `refresh:${newRefreshToken}`,
      user.id,
      "EX",
      REFRESH_TOKEN_TTL
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const deleted = await redis.del(`refresh:${refreshToken}`);

    if (deleted === 0) {
      throw { status: 400, message: "Refresh token não encontrado" };
    }
  }
}
