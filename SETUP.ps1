###############################################################################
# SETUP.ps1 - Script de Instalação do Sistema de Matrícula
#
# Pré-requisitos:
#   1. Node.js >= 18 instalado
#   2. PostgreSQL rodando na porta 5432
#   3. Banco "enrollment_db" criado:
#      psql -U postgres -c "CREATE DATABASE enrollment_db;"
#
# Uso:
#   .\SETUP.ps1
###############################################################################

$ErrorActionPreference = "Stop"

function Write-Step($step, $msg) {
    Write-Host "`n[$step] $msg" -ForegroundColor Yellow
}

function Write-Ok($msg) {
    Write-Host "  ✓ $msg" -ForegroundColor Green
}

function Write-Err($msg) {
    Write-Host "  ✗ $msg" -ForegroundColor Red
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   SISTEMA DE MATRÍCULA - Setup       ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Step "1/6" "Verificando Node.js..."
try {
    $nodeVersion = node -v
    Write-Ok "Node.js $nodeVersion encontrado"
} catch {
    Write-Err "Node.js não encontrado! Instale: https://nodejs.org"
    exit 1
}

# Backend install
Write-Step "2/6" "Instalando dependências do backend..."
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) { Write-Err "Falha no npm install do backend"; exit 1 }
Write-Ok "Backend instalado"

# Prisma setup
Write-Step "3/6" "Configurando banco de dados..."
Write-Host "  Verifique o arquivo backend/.env com suas credenciais!" -ForegroundColor Magenta
Write-Host ""

try {
    npx prisma generate
    Write-Ok "Prisma Client gerado"
} catch {
    Write-Err "Erro ao gerar Prisma Client"
    exit 1
}

Write-Host ""
Write-Host "  Deseja rodar a migration agora? (precisa do PostgreSQL rodando)" -ForegroundColor Yellow
$runMigrate = Read-Host "  [S/n]"

if ($runMigrate -ne "n" -and $runMigrate -ne "N") {
    try {
        npx prisma migrate dev --name init
        Write-Ok "Migration executada"
    } catch {
        Write-Err "Erro na migration. Verifique DATABASE_URL no .env"
        Write-Host "  Você pode rodar manualmente depois: npx prisma migrate dev --name init" -ForegroundColor Gray
    }

    # Seed
    Write-Step "4/6" "Populando dados de teste..."
    try {
        npx tsx prisma/seed.ts
        Write-Ok "Seed executado"
    } catch {
        Write-Err "Erro no seed"
        Write-Host "  Rode manualmente: npx tsx prisma/seed.ts" -ForegroundColor Gray
    }
} else {
    Write-Host "  Pulando migration. Rode manualmente quando pronto:" -ForegroundColor Gray
    Write-Host "  cd backend && npx prisma migrate dev --name init && npx tsx prisma/seed.ts" -ForegroundColor Gray
}

Set-Location ..

# Frontend install
Write-Step "5/6" "Instalando dependências do frontend..."
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) { Write-Err "Falha no npm install do frontend"; exit 1 }
Write-Ok "Frontend instalado"
Set-Location ..

# Done
Write-Step "6/6" "Setup completo!"
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  PRONTO! Para iniciar o sistema:         ║" -ForegroundColor Green
Write-Host "  ║                                          ║" -ForegroundColor Green
Write-Host "  ║  Terminal 1 (Backend):                   ║" -ForegroundColor Green
Write-Host "  ║    cd backend && npm run dev              ║" -ForegroundColor Green
Write-Host "  ║                                          ║" -ForegroundColor Green
Write-Host "  ║  Terminal 2 (Frontend):                  ║" -ForegroundColor Green
Write-Host "  ║    cd frontend && npm run dev             ║" -ForegroundColor Green
Write-Host "  ║                                          ║" -ForegroundColor Green
Write-Host "  ║  Acesse: http://localhost:5173            ║" -ForegroundColor Green
Write-Host "  ║  Acesso: http://localhost:5173/access     ║" -ForegroundColor Green
Write-Host "  ║  API:    http://localhost:3333/api/health ║" -ForegroundColor Green
Write-Host "  ║                                          ║" -ForegroundColor Green
Write-Host "  ║  Alunos de teste:                        ║" -ForegroundColor Green
Write-Host "  ║    MAT-0001 → PAGO → AUTORIZADO          ║" -ForegroundColor Green
Write-Host "  ║    MAT-0002 → PENDENTE → BLOQUEADO       ║" -ForegroundColor Green
Write-Host "  ║    MAT-0003 → PAGO → AUTORIZADO          ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
