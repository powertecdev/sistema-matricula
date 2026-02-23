# Sistema de Matrícula Escolar v2.1

Sistema completo de gestão de matrículas para academias e escolas, com controle de acesso via código de barras, frequência, pagamentos e turmas.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Banco:** PostgreSQL

## Funcionalidades

- Cadastro de alunos com geração automática de código de barras
- Controle de acesso via leitura de código de barras
- Registro automático de frequência
- Gestão de turmas com capacidade e visualização de alunos
- Controle de pagamentos (PIX, Cartão Crédito/Débito, Dinheiro, Boleto)
- Isenção de pagamento com motivo
- Aula experimental com data de expiração
- Validade de matrícula
- Dashboard de frequência com gráficos
- Ranking de frequência dos alunos
- Histórico individual de presenças
- Impressão de código de barras
- Layout responsivo (desktop e mobile)

## Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd backend
npm install
cp .env.example .env  # configure DATABASE_URL
npx prisma db push
npx prisma generate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Variáveis de Ambiente

### Backend (.env)
```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/enrollment_db
PORT=3333
```

## Estrutura
```
enrollment-system/
 backend/
    prisma/          # Schema do banco
    src/
       config/      # Prisma client
       controllers/ # Controllers Express
       repositories/# Acesso ao banco
       routes/      # Rotas da API
       services/    # Lógica de negócio
       utils/       # Helpers (barcode, errors, response)
       validators/  # Schemas Zod
    uploads/         # Fotos dos alunos
 frontend/
    src/
       components/  # Componentes reutilizáveis
       pages/       # Páginas da aplicação
       services/    # API client (Axios)
       types/       # TypeScript types
    public/
 README.md
```

## Licença

MIT