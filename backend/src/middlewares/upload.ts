import multer, { FileFilterCallback } from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { Request } from "express";
import { env, UPLOAD_PATH } from "../config/env";
import fs from "fs";

[UPLOAD_PATH.PHOTOS, UPLOAD_PATH.DOCUMENTS].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_IMAGE = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_DOCS = [...ALLOWED_IMAGE, "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

function storage(dest: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`),
  });
}

export const uploadPhoto = multer({
  storage: storage(UPLOAD_PATH.PHOTOS),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    ALLOWED_IMAGE.includes(file.mimetype) ? cb(null, true) : cb(new Error("Use: JPEG, PNG ou WebP"));
  },
});

export const uploadDocument = multer({
  storage: storage(UPLOAD_PATH.DOCUMENTS),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    ALLOWED_DOCS.includes(file.mimetype) ? cb(null, true) : cb(new Error("Use: JPEG, PNG, WebP, PDF ou DOC"));
  },
});
