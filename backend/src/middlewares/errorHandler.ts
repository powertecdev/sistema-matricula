import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/response";
import { env } from "../config/env";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    sendError(res, `Validação: ${messages.join("; ")}`, 422);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      sendError(res, `Registro duplicado no campo: ${prismaErr.meta?.target?.join(", ")}`, 409);
      return;
    }
    if (prismaErr.code === "P2025") {
      sendError(res, "Registro não encontrado", 404);
      return;
    }
  }

  if (err.constructor.name === "MulterError") {
    const multerErr = err as any;
    if (multerErr.code === "LIMIT_FILE_SIZE") {
      sendError(res, "Arquivo excede o tamanho máximo (5MB)", 413);
      return;
    }
    sendError(res, `Erro no upload: ${multerErr.message}`, 400);
    return;
  }

  console.error("[ERROR]", err);
  sendError(res, env.NODE_ENV === "development" ? err.message : "Erro interno do servidor", 500);
}
