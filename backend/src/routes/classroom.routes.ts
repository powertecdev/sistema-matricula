import { Router } from "express";
import { ClassroomController } from "../controllers";

const router = Router();
const c = new ClassroomController();

router.get("/", (req, res) => c.list(req, res));
router.get("/:id", (req, res) => c.getById(req, res));
router.post("/", (req, res) => c.create(req, res));

export default router;
