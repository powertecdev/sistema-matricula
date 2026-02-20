import { Router } from "express";
import { EnrollmentController } from "../controllers";

const router = Router();
const c = new EnrollmentController();

router.get("/", (req, res) => c.list(req, res));
router.get("/:id", (req, res) => c.getById(req, res));
router.post("/", (req, res) => c.create(req, res));
router.patch("/:id/status", (req, res) => c.updateStatus(req, res));

export default router;
