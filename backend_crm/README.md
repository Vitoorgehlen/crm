Docker precisa estar on
docker-compose up -d

Ao executar a primeira vez o servidor, tem que rodar esse código para criar o super usuário
npx prisma db seed

Se fizer alteração no schema.prisma, tem que fazer push e depois generate
npx prisma db push
npx prisma db push --force-reset
npx prisma generate

npm run dev -> Rodar o servidor
npx prisma studio -> Interface visual do Prisma

Para migrações
npx prisma migrate dev --create-only -> Cria uma migration customizada
npx prisma migrate dev --name (nome da migração aqui) --> cria uma migração
