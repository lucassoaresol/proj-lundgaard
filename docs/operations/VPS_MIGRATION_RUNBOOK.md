# Runbook de migração da VPS do Lundgaard

Este repositório é a autoridade dos procedimentos internos de Lundgaard. A coordenação com EDREN e
Codex-LB pertence ao coordenador do host no repositório `sistema-edren`.

`COMMIT_POINT = primeira escrita autoritativa de negócio/usuário na VPS nova`

Antes do `COMMIT_POINT`, mantenha o alvo sem autoridade externa e preserve um rollback testado.
Depois dele, a estratégia padrão é forward reconciliation. Nunca execute rollback cego pós-COMMIT.

## 1. Evidência e classes de artefato

Todo dump, volume, env, arquivo runtime, receipt e manifest recebe uma classe explícita:

- `REHEARSAL-YYYYMMDD-rNN`: laboratório, nunca promovido por rename;
- `FINAL-YYYYMMDDThhmmssZ`: capturado da origem congelada para o cutover.

Para secrets/config, compare `SOURCE_PRODUCTION -> TARGET_PRODUCTION` sem registrar valores. Use
somente `MATCH`, `INTENTIONAL_DIFFERENCE`, `MISSING`, `REHEARSAL_INVALID` ou `NOT_APPLICABLE`.
`PRESENT` não aprova parity. Leia o environment efetivo de cada processo PM2.

## 2. Identidade do runtime

Antes do freeze, registre:

- commit completo e versão do package/runtime;
- versões Node.js e pnpm;
- lockfile efetivamente usado, se existir no runtime;
- build command e fingerprint de `dist/`;
- conteúdo e caminho efetivos de `pm2.json`;
- usuário, cwd, interpreter, argumentos, restart policy e environment de cada processo;
- arquivos versionados, montados e não versionados abertos pelo runtime;
- versões PostgreSQL e Redis.

O inventário do runtime ativo prevalece sobre arquivos preparados no checkout.

## 3. PostgreSQL Lundgaard

### Snapshot final

1. Identifique host privado, porta, database final, owner, versão, extensions e migrations.
2. Calcule na origem um fingerprint lógico sanitizado: schema/migrations, contagens por tabela e
   invariantes funcionais escolhidos antes do freeze.
3. Coloque o database/origem em read-only conforme o mecanismo aprovado e abra uma sessão nova para
   confirmar rejeição de escrita.
4. Capture o dump custom format:

   ```bash
   pg_dump -Fc --dbname "$LUNDGAARD_SOURCE_DSN" --file "$FINAL_DUMP"
   ```

   As variáveis acima são referências locais e nunca são registradas na documentação ou receipt.
5. Registre tamanho e checksum do dump.
6. Valide estrutura física antes da transferência:

   ```bash
   pg_restore --list "$FINAL_DUMP" >/dev/null
   ```

### Restore e identidade do dataset

1. Crie o database final vazio com owner/locale/encoding esperados.
2. Restaure no database final, não em um nome transitório que o runtime não usa.
3. Execute `pg_restore --list` no arquivo recebido e registre checksum idêntico ao da origem.
4. Recalcule o fingerprint lógico e as contagens no alvo.
5. Compare alvo com a origem congelada, não com um rehearsal anterior.
6. Execute smokes do runtime ainda sem autoridade externa.

Lição 2026: um dump de rehearsal era fisicamente válido e tinha o SHA esperado, mas continha o
dataset errado. Checksum e `pg_restore --list` provam integridade do arquivo, não identidade do
conteúdo. O artefato só recebe classe `FINAL` quando fingerprint e contagens coincidem com a origem
congelada.

### Read-only e writability

No pre-COMMIT, a origem permanece read-only e o alvo fica contido. Após o `COMMIT_POINT`, habilite
writes somente no database final da nova VPS, abra uma sessão nova e prove uma escrita controlada.
Confirme também que a antiga continua sem writes. Registre a remoção exata de qualquer override de
database, role ou sessão.

## 4. Redis e BullMQ

O runtime canônico é `127.0.0.1:6379`.

Lição 2026: `REDIS_URL` configurado no rehearsal não controlava a conexão efetiva. As queues e
workers BullMQ eram inicializados com `connection: {}`, que usa defaults. Antes da próxima migração,
inspecione o contrato real da release em `src/worker/services/*.ts` e o environment carregado. Não
presuma que uma variável existente é consumida.

Inventarie e compare:

- versão Redis e parâmetros de persistência;
- binding loopback e porta efetiva `6379`;
- nome/mountpoint e ownership do volume;
- caminho e metadata do RDB;
- `DBSIZE` por database usado;
- nomes/contagens de queues, delayed jobs e chaves persistentes;
- fingerprint de chaves persistentes que exclua valores sensíveis;
- distribuição de TTL antes e depois do snapshot/restore.

### Snapshot e restore

1. Contenha producers/consumers e registre a ordem.
2. Force ou aguarde snapshot RDB consistente conforme a configuração real.
3. Registre `LASTSAVE`, tamanho/checksum do RDB, `DBSIZE`, delayed counts e fingerprint persistente.
4. Transfira o artefato sem iniciar BullMQ no alvo.
5. Restaure no volume final com usuário/permissões corretos.
6. Inicie Redis em loopback `6379`, compare version, `DBSIZE`, delayed counts e fingerprint.
7. Só então inicie API, worker e cron contidos.

TTL diminui naturalmente durante transferência. Uma diferença explicada somente por expiração TTL,
com chaves persistentes e delayed jobs reconciliados, recebe `INTENTIONAL_DIFFERENCE`; não é falso
blocker. Chave persistente ausente, delayed job inexplicavelmente perdido ou conexão em porta errada
bloqueiam.

## 5. PM2

Trate os três processos separadamente:

| Processo | Entrada canônica | Gate específico |
| --- | --- | --- |
| `lundgaard-api` | `pnpm start` | listen/health, customers e export-csv |
| `lundgaard-worker` | `pnpm worker` | consumers online e job sintético controlado |
| `lundgaard-cron` | `pnpm cron` | schedule/config carregados e execução segura simulada |

Para cada um, capture `pm2 describe`/environment efetivo, cwd, commit/build, usuário, status,
restart count e logs recentes sanitizados. Após reboot real, prove os três online e usando o mesmo
release root, configuração final, PostgreSQL final e Redis `127.0.0.1:6379`.

## 6. Notion

Inventarie obrigatoriamente:

| Item | SOURCE_PRODUCTION -> TARGET_PRODUCTION | Evidência sem valor |
| --- | --- | --- |
| `AUTH_NOTION` | PENDENTE | fingerprint e probe autenticado |
| `NOTION_TOKEN` | PENDENTE | fingerprint e consumidor efetivo ou `NOT_APPLICABLE` justificado |

Substitua `PENDENTE` somente por um dos cinco estados canônicos. A release atual consome
`AUTH_NOTION` em `src/config/env.ts`; o inventário deve pesquisar a release final inteira e o
environment real para decidir se `NOTION_TOKEN` é consumido, legado ou necessário por wrapper.

Lição 2026: valores de rehearsal sobreviveram ao primeiro cutover. Compare a configuração real
carregada individualmente por `lundgaard-api`, `lundgaard-worker` e `lundgaard-cron`. Um fingerprint
de rehearsal no runtime final é `REHEARSAL_INVALID` e bloqueia, mesmo que um `.env` preparado esteja
correto. Prove uma leitura/API call segura da integração sem registrar token ou conteúdo sensível.

## 7. Runtime files

Antes do snapshot final, produza um inventário por acesso real e configuração, não apenas `git ls-files`:

- templates/views;
- scripts chamados por cron ou shell;
- certificados/configs montados;
- build output e assets;
- `.env` e arquivos de configuração privados, referenciados somente por nome/fingerprint;
- logs/state que precisam ou não migrar.

`views/export-csv.html` é obrigatório enquanto o runtime final o consumir. Lição 2026:
`views/export-csv.html` não foi transferido inicialmente. Registre path final, owner/mode,
tamanho/checksum e execute o smoke de
export. Qualquer arquivo não versionado usado em runtime deve entrar no manifest `FINAL`, nunca ser
descoberto após a promoção.

## 8. Freeze, restore e promoção

1. Prove backup/restore e todos os smokes em rehearsal.
2. No corte real, contenha webhooks, API externa, cron, worker e outros producers.
3. Coloque PostgreSQL origem em read-only e contenha alterações Redis.
4. Capture dump PostgreSQL, RDB/metadata Redis, runtime files e configuração `FINAL`.
5. Restaure PostgreSQL, Redis e runtime files no destino final.
6. Inicie Redis, depois PostgreSQL clients, API, worker e cron ainda contidos.
7. Compare environment efetivo dos três processos.
8. Execute todos os smokes privados.
9. Coordene promoção externa e registre a primeira escrita autoritativa como `COMMIT_POINT`.
10. Após o ponto, habilite writability final e use forward reconciliation para qualquer divergência.

## 9. Smoke obrigatório

- [ ] API/listen e resposta esperada.
- [ ] Customers retorna dataset/fingerprint esperado.
- [ ] Export-csv usa `views/export-csv.html` e produz saída válida.
- [ ] PostgreSQL final aceita leitura e, somente pós-COMMIT, escrita controlada.
- [ ] Redis responde em `127.0.0.1:6379`; DBSIZE/delayed/persistent fingerprint reconciliados.
- [ ] Worker consome um job sintético controlado sem duplicação.
- [ ] Cron carrega schedule/config final e executa caminho seguro ou simulado.
- [ ] Integração Notion usa configuração final efetiva.
- [ ] Reboot recupera `lundgaard-api`, `lundgaard-worker` e `lundgaard-cron`.

Nenhum smoke isolado substitui parity de configuração e identidade dos dados.
