# Rehearsal Lundgaard em WSL descartável

Este laboratório executa [VPS_MIGRATION_RUNBOOK.md](VPS_MIGRATION_RUNBOOK.md) sem autoridade de
produção. Ele deve estar funcional até 2027-08-05 e integral até 2027-08-21.

## Preparação

1. Crie uma distribuição WSL exclusiva para a migração.
2. Registre versões Linux, Node.js, pnpm, PM2, PostgreSQL e Redis.
3. Faça checkout do commit a ensaiar e produza o build pelo procedimento canônico.
4. Crie diretórios `REHEARSAL/<id>/inputs`, `restored` e `receipts` fora do Git.
5. Nomeie o ciclo como `REHEARSAL-YYYYMMDD-rNN`.
6. Use database, volume, processos e `.env` com `rehearsal` no nome.
7. Não use `FINAL` em nenhum artefato deste laboratório.

Dados reais, quando necessários, permanecem protegidos e fora do Git. Receipts contêm somente
checksums, fingerprints, contagens permitidas e resultados.

## PostgreSQL

1. Receba um dump `pg_dump -Fc` marcado `REHEARSAL`.
2. Execute `pg_restore --list` e valide checksum.
3. Restaure no database de laboratório que o runtime realmente usará.
4. Calcule schema/migrations, contagens e fingerprint lógico.
5. Compare com o manifest da origem deste rehearsal.
6. Simule read-only pre-COMMIT e writability pós-COMMIT em sessões novas.

Introduza ao menos uma vez um dump íntegro de dataset deliberadamente errado. O gate deve falhar pela
comparação lógica, provando que checksum não promove identidade.

## Redis e BullMQ

1. Inicie Redis em `127.0.0.1:6379` com volume persistente de laboratório.
2. Inspecione a release e registre como cada Queue/Worker constrói `connection`.
3. Não considere `REDIS_URL` efetiva sem provar que o código a consome.
4. Crie estado sintético com chaves persistentes, TTL e delayed jobs.
5. Capture/restaure RDB e compare version, volume, `DBSIZE`, delayed counts e fingerprint persistente.
6. Aguarde uma janela curta e demonstre que somente a queda esperada de TTL é classificada como
   `INTENTIONAL_DIFFERENCE`.
7. Prove restart do Redis e reconexão dos processos.

## PM2, Notion e runtime files

Inicie separadamente `lundgaard-api`, `lundgaard-worker` e `lundgaard-cron`. Para cada processo:

- confirme cwd, commit/build e environment efetivo;
- compare `AUTH_NOTION` e `NOTION_TOKEN` por fingerprint sem exibir valores;
- marque item de rehearsal no alvo simulado como `REHEARSAL_INVALID`;
- confirme conexão com PostgreSQL restaurado e Redis `127.0.0.1:6379`;
- prove recuperação após restart do processo e reinício do ambiente.

Crie um manifest de runtime files pelo uso real. Inclua `views/export-csv.html` enquanto consumido e
prove que sua remoção faz o smoke export-csv falhar. Restaure-o pelo manifest e repita o smoke.

## Smoke completo

- [ ] API.
- [ ] Customers.
- [ ] Export-csv e template runtime.
- [ ] PostgreSQL e fingerprint lógico.
- [ ] Redis, delayed jobs e persistent fingerprint.
- [ ] Worker com job sintético controlado.
- [ ] Cron com schedule/config de laboratório.
- [ ] Notion por probe seguro ou equivalente explicitamente simulado.
- [ ] Restart/recovery dos três processos PM2 e dos stores.

## Simulação de COMMIT e decommission

`COMMIT_POINT = primeira escrita autoritativa de negócio/usuário na VPS nova`

Simule freeze, snapshot, restore e promoção. Antes do ponto, demonstre rollback ao ambiente de origem
do laboratório. Depois de uma escrita sintética autoritativa no alvo, demonstre forward
reconciliation e rejeite rollback cego. Desligue a origem simulada e repita todos os smokes.

## Gate de saída

O rehearsal passa somente quando não há `MISSING` ou `REHEARSAL_INVALID`, cada restore coincide com
o fingerprint lógico esperado, os três environments PM2 foram lidos do runtime efetivo e todos os
smokes passam com a origem simulada offline. Nenhum arquivo de rehearsal pode ser renomeado ou
copiado para `FINAL`; o corte real recaptura tudo da origem congelada.
