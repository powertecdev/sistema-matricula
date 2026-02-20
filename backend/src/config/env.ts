import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3333,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
} as const;

export const UPLOAD_PATH = {
  PHOTOS: path.resolve(process.cwd(), env.UPLOAD_DIR, "photos"),
  DOCUMENTS: path.resolve(process.cwd(), env.UPLOAD_DIR, "documents"),
} as const;
