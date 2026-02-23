import { Router } from "express";
import { FeedbackController } from "../controllers/FeedbackController";

const router = Router();
const c = new FeedbackController();

router.get("/", (req, res) => c.list(req, res));
router.post("/", (req, res) => c.create(req, res));
router.get("/student/:studentId", (req, res) => c.listByStudent(req, res));
router.get("/student/:studentId/average", (req, res) => c.getStudentAverage(req, res));
router.delete("/:id", (req, res) => c.delete(req, res));

export default router;