# Sistema de Matrícula - Enrollment Management System

Sistema completo para gerenciamento de matrículas, controle de pagamento e controle de acesso via leitor de crachá USB.

## Arquitetura

```
backend/
├── src/
│   ├── config/          # Configurações (env, prisma client)
│   ├── controllers/     # Camada de apresentação (HTTP)
│   ├── services/        # Regras de negócio
│   ├── repositories/    # Acesso a dados (Prisma)
│   ├── middlewares/      # Error handler, upload (Multer)
│   ├── validators/       # Schemas Zod
│   ├── routes/          # Definição de rotas Express
│   ├── types/           # TypeScript interfaces/DTOs
│   ├── utils/           # Helpers (AppError, response)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Bootstrap
├── prisma/
│   ├── schema.prisma    # Modelos do banco
│   └── seed.ts          # Dados iniciais
└── uploads/             # Arquivos enviados

frontend/
├── src/
│   ├── components/      # Layout, Modal, etc
│   ├── pages/           # Dashboard, Students, Enrollments, Payments, Access, Classrooms
│   ├── services/        # API client (Axios)
│   └── types/           # TypeScript types
```

## Stack

| Camada   | Tecnologia                          |
|----------|-------------------------------------|
| Frontend | React 19, TypeScript, Tailwind CSS  |
| Backend  | Node.js, Express, TypeScript        |
| ORM      | Prisma                              |
| Banco    | PostgreSQL                          |
| Validação| Zod                                 |
| Upload   | Multer                              |

## Regras de Negócio

- **Matrícula duplicada**: Não permite cadastrar matrícula com mesmo número
- **Limite de vagas**: Valida capacidade máxima da turma antes de matricular
- **Controle de acesso**: Só libera se matrícula ATIVA **E** pagamento PAGO
- **Upload**: Máximo 5MB, aceita JPEG/PNG/WebP (fotos) e PDF/DOC (documentos)

## Setup - Pré-requisitos

1. **Node.js** >= 18
2. **PostgreSQL** rodando na porta 5432
3. Criar banco: `CREATE DATABASE enrollment_db;`

## Setup - Backend

```bash
cd backend
npm install
```

Edite o `.env` com suas credenciais do PostgreSQL:
```
DATABASE_URL="postgresql://SEU_USER:SUA_SENHA@localhost:5432/enrollment_db?schema=public"
```

Execute as migrations e seed:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

Inicie o servidor:
```bash
npm run dev
```

API disponível em: `http://localhost:3333/api`

## Setup - Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: `http://localhost:5173`

## Endpoints da API

### Students
| Método | Rota                        | Descrição           |
|--------|-----------------------------|---------------------|
| GET    | /api/students               | Listar (paginado)   |
| GET    | /api/students/:id           | Buscar por ID       |
| POST   | /api/students               | Criar aluno         |
| PUT    | /api/students/:id           | Atualizar aluno     |
| DELETE | /api/students/:id           | Remover aluno       |
| POST   | /api/students/:id/photo     | Upload foto         |
| POST   | /api/students/:id/documents | Upload documento    |
| GET    | /api/students/:id/documents | Listar documentos   |

### Enrollments
| Método | Rota                             | Descrição          |
|--------|----------------------------------|---------------------|
| GET    | /api/enrollments                 | Listar              |
| POST   | /api/enrollments                 | Criar matrícula     |
| PATCH  | /api/enrollments/:id/status      | Alterar status      |

### Payments
| Método | Rota                           | Descrição           |
|--------|--------------------------------|---------------------|
| GET    | /api/payments                  | Listar              |
| POST   | /api/payments                  | Criar pagamento     |
| PATCH  | /api/payments/:id/status       | Alterar status      |

### Access (Badge Reader)
| Método | Rota                            | Descrição           |
|--------|---------------------------------|---------------------|
| GET    | /api/access/:registrationNumber | Verificar acesso    |

### Classrooms
| Método | Rota                | Descrição          |
|--------|---------------------|---------------------|
| GET    | /api/classrooms     | Listar turmas       |
| POST   | /api/classrooms     | Criar turma         |

## Dados de Teste (Seed)

| Matrícula  | Aluno   | Pagamento | Acesso       |
|------------|---------|-----------|--------------|
| MAT-0001   | João    | PAGO      | 🟢 AUTORIZADO |
| MAT-0002   | Maria   | PENDENTE  | 🔴 BLOQUEADO  |
| MAT-0003   | Carlos  | PAGO      | 🟢 AUTORIZADO |

## Leitor de Crachá USB

O leitor funciona como teclado. Na tela `/access`:
1. O campo de input fica sempre focado
2. O leitor "digita" o código do crachá
3. Ao final envia Enter automaticamente
4. O sistema busca o aluno e exibe status visual
5. Resultado limpa automaticamente após 8 segundos
