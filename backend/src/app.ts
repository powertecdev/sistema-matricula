import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV === "development") app.use(morgan("dev"));
app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
app.use("/api", routes);
app.use((_req, res) => res.status(404).json({ success: false, error: "Rota não encontrada" }));
app.use(errorHandler);

export default app;
