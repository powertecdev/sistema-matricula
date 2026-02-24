import { Request, Response } from "express";
import { AttendanceService } from "../services/AttendanceService";
import { sendSuccess } from "../utils/response";

const svc = new AttendanceService();

export class AttendanceController {
  async getByStudent(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const r = await svc.getByStudent(String(req.params.studentId), page, limit);
    sendSuccess(res, r.records, undefined, 200, { total: r.total, page: 1, limit: r.records.length, totalPages: 1 });
  }
  async getCountByStudent(req: Request, res: Response) {
    const count = await svc.getCountByStudent(String(req.params.studentId));
    sendSuccess(res, { totalAttendances: count });
  }
  async getSummary(_req: Request, res: Response) { sendSuccess(res, await svc.getSummary()); }
  async getDailyStats(req: Request, res: Response) {
    const days = Number(req.query.days) || 30;
    sendSuccess(res, await svc.getDailyStats(days));
  }
  async getStats(_req: Request, res: Response) { sendSuccess(res, await svc.getGeneralStats()); }
}
