import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("[DB] PostgreSQL conectado");

    app.listen(env.PORT, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`  SISTEMA DE MATRÍCULA - Backend v1.0`);
      console.log(`  API: http://localhost:${env.PORT}/api`);
      console.log(`  Health: http://localhost:${env.PORT}/api/health`);
      console.log(`  Ambiente: ${env.NODE_ENV}`);
      console.log(`${"=".repeat(50)}\n`);
    });
  } catch (error) {
    console.error("[FATAL]", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });
process.on("SIGINT", async () => { await prisma.$disconnect(); process.exit(0); });

bootstrap();
