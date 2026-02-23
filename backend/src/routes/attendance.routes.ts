import { Router } from "express";
import { AttendanceController } from "../controllers/AttendanceController";

const router = Router();
const controller = new AttendanceController();

// Rotas específicas ANTES das parametrizadas
router.get("/summary", (req, res) => controller.getSummary(req, res));
router.get("/daily", (req, res) => controller.getDailyStats(req, res));
router.get("/stats", (req, res) => controller.getStats(req, res));
router.get("/student/:studentId", (req, res) => controller.getByStudent(req, res));
router.get("/student/:studentId/count", (req, res) => controller.getCountByStudent(req, res));

export default router;