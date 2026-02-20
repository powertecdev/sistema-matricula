import { Router } from "express";
import { AccessController } from "../controllers";

const router = Router();
const c = new AccessController();

router.get("/:registrationNumber", (req, res) => c.check(req, res));

export default router;
