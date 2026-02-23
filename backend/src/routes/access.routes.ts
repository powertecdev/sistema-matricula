import { Router } from "express";
import { AccessController } from "../controllers";
const r = Router(); const c = new AccessController();
r.get("/:qrCode", (req, res) => c.check(req, res));
export default r;