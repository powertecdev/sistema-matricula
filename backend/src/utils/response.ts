import { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: PaginationMeta
): void {
  const response: ApiResponse<T> = { success: true, data, message, meta };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, error: string, statusCode: number = 400): void {
  res.status(statusCode).json({ success: false, error });
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}
