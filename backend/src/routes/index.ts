import { Router } from "express";
import studentRoutes from "./student.routes";
import enrollmentRoutes from "./enrollment.routes";
import paymentRoutes from "./payment.routes";
import accessRoutes from "./access.routes";
import classroomRoutes from "./classroom.routes";

const router = Router();

router.use("/students", studentRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/access", accessRoutes);
router.use("/classrooms", classroomRoutes);
router.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

export default router;
