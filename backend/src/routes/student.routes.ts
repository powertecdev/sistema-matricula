import { Router } from "express";
import { StudentController } from "../controllers";
import { uploadPhoto, uploadDocument } from "../middlewares/upload";

const router = Router();
const c = new StudentController();

router.get("/", (req, res) => c.list(req, res));
router.get("/:id", (req, res) => c.getById(req, res));
router.post("/", (req, res) => c.create(req, res));
router.put("/:id", (req, res) => c.update(req, res));
router.delete("/:id", (req, res) => c.delete(req, res));
router.post("/:id/photo", uploadPhoto.single("photo"), (req, res) => c.uploadPhoto(req, res));
router.post("/:id/documents", uploadDocument.single("document"), (req, res) => c.uploadDocument(req, res));
router.get("/:id/documents", (req, res) => c.getDocuments(req, res));

export default router;
