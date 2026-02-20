import { Request, Response } from "express";
import { AccessService } from "../services";
import { accessParamSchema } from "../validators";
import { sendSuccess } from "../utils/response";

const service = new AccessService();

export class AccessController {
  async check(req: Request, res: Response) {
    const { registrationNumber } = accessParamSchema.parse(req.params);
    sendSuccess(res, await service.checkAccess(registrationNumber));
  }
}
