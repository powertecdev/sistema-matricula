import { Request, Response } from "express";
import { AccessService } from "../services/AccessService";
import { sendSuccess } from "../utils/response";

const svc = new AccessService();

export class AccessController {
  async check(req: Request, res: Response) { sendSuccess(res, await svc.checkAccess(String(req.params.qrCode))); }
}