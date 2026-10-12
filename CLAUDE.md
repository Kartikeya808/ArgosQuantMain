# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

**Phases 0–4 are complete and verified.** The repo now contains a
Maven multi-module reactor plus the React frontend. Backend layout:

- `pom.xml` — reactor parent; imports the Spring Boot BOM via
  `dependencyManagement` (NOT as a parent) so `argosquant-core` stays a plain
  library with no Spring-web/servlet/JavaFX deps.
- `argosquant-core/` — business logic library (plain Java, no Spring
  annotations; wired by the web module's `CoreConfig`). Contains:
  - `database/` — `DatabaseConfig`, `DataSourceFactory` (HikariCP),
    `MigrationRunner` (custom numbered-SQL runner, not Flyway), and `Jdbc`
    (transaction helper: repos take a `Connection`, services own the tx
    boundary via `inTransaction`/`inConnection`).
  - `model/` + `model/asset/` — domain records (`User`, `Portfolio`,
    `Holding`, `Transaction`) and the abstract `FinancialAsset` hierarchy
    (`Equity`, `EtfAsset`), hydrated polymorphically from `stocks.asset_type`.
  - `exceptions/` — checked `ArgosException` hierarchy
    (`InsufficientHoldingsException`, `InvalidTransactionException`,
    `EmailAlreadyExistsException`, `AuthenticationFailedException`,
    `ResourceNotFoundException`, `DuplicateResourceException`) +
    `UncheckedArgosException` carrier for tunneling checked exceptions out of
    tx lambdas.
  - `auth/` — `UserRepository`, `PasswordHasher` (jBCrypt), `JwtService`
    (jjwt HS256, stateless), `AuthService` (register/login).
  - `portfolio/` — JDBC repositories + `PortfolioService` and
    `TransactionService` (buy/sell with weighted average-cost, read-only
    enforcement of holdings ≥ 0).
  - `market/` — `Quote` model; `market/client` (`MarketDataClient` interface
    + `SimulatedMarketDataClient` stand-in, since the provider is TBD —
    swap the bean in `MarketConfig` to go live); `market/cache`
    (`MarketDataCache`, Redis via Jedis with TTL, degrades gracefully when
    Redis is down); `market/service` (`MarketDataService` — cache-aside
    single reads, concurrent multi-symbol fetch via an injected
    `ExecutorService`, `refresh()` for the scheduled job); `market/watchlist`
    (`WatchlistRepository` + `WatchlistService`).
  - `analytics/` — pure, stateless calculators, one concern per subpackage:
    `returns/ReturnsCalculator`, `volatility/VolatilityCalculator`,
    `sharpe/SharpeRatioCalculator`, `beta/BetaCalculator`,
    `var/ValueAtRiskCalculator` (historical + parametric), `drawdown/
    DrawdownCalculator`, plus `StatUtils`. They operate on `double[]` series —
    no I/O, no DB.
  - `risk/` — `CorrelationService`, `RiskEngine` (composes the analytics into a
    `RiskReport`), `RiskScoreService` (`RiskReport` → 0–100 `RiskScore` +
    `RiskRating`), and `PortfolioAnalyticsService` (read-only orchestrator:
    loads holdings, fetches each symbol's daily history concurrently via the
    market executor, builds the equity curve, and returns `PortfolioAnalytics`
    = risk report + score + benchmark excess return + per-holding `HoldingRisk`
    + correlation matrix). The market client gained
    `fetchDailyHistory(symbol, days)` to feed these.
  - `simulation/` — **read-only** what-if engine. `ScenarioDefinition`
    (additive market + sector + per-symbol shocks), `ScenarioEngine` (values
    real holdings at live quotes, applies shocks, returns `ScenarioResult` +
    per-holding `HoldingImpact` — never writes the DB), `StressTestService`
    (standard battery: market −10/−20/−35%, +10%, IT sector −15%).
  - migrations: `V1__base_schema.sql`, `V2__stock_asset_detail.sql`,
    `V3__watchlist.sql`.
- `argosquant-web/` — Spring Boot REST app on :8080. `PersistenceConfig`
  (datasource + startup migrations), `CoreConfig` (bean wiring), stateless JWT
  `SecurityConfig` + `JwtAuthFilter`, `GlobalExceptionHandler` (maps each
  business exception to an HTTP status). Endpoints: `GET /api/health`,
  `POST /api/auth/{register,login}`, `GET/POST/DELETE /api/portfolios`,
  `GET /api/portfolios/{id}/holdings`,
  `GET/POST /api/portfolios/{id}/transactions`,
  `GET /api/market/quote/{symbol}`, `GET /api/market/quotes?symbols=A,B`,
  `GET/POST/DELETE /api/watchlist`, `GET /api/watchlist/quotes`,
  `GET /api/portfolios/{id}/analytics`,
  `POST /api/portfolios/{id}/simulation/scenario`,
  `GET /api/portfolios/{id}/simulation/stress-tests`.
  `MarketConfig` wires the Redis pool, client, fetch `ExecutorService`, and
  services; `SchedulingConfig` (@EnableScheduling) + `job/MarketDataRefreshJob`
  (@Scheduled) warm the cache for watched symbols off the request thread.
  Config knobs: `argos.redis.{host,port}`, `argos.market.{cache-ttl-seconds,
  simulated-latency-ms,currency,fetch-threads,refresh-interval-ms}`.
- `argosquant-desktop/` — JavaFX module (stub launcher; full UI in Phase 5).
- `docker-compose.yml` — Postgres 16 + Redis 7 for local dev.

### Testing notes (important gotchas on this machine)

- JDK 26 + Mockito: surefire sets `-Dnet.bytebuddy.experimental=true` (in
  `argosquant-core/pom.xml`) so ByteBuddy can instrument JDK 26 classes.
- Testcontainers currently cannot talk to the local Docker Engine 29 daemon
  (docker-java gets HTTP 400 on `/info`). `PortfolioFlowIntegrationTest`
  therefore guards on `DockerClientFactory.isDockerAvailable()` and **skips**
  rather than failing. It runs normally where Docker/the client are
  compatible. Phase 1 was instead verified live via the REST API against the
  docker-compose Postgres.
- The parent POM sets `<parameters>true</parameters>` on the compiler so
  Spring MVC can bind `@PathVariable`/`@RequestParam` by name — required, since
  we don't inherit `spring-boot-starter-parent`. After changing compiler
  config, use `mvn clean` (incremental compile won't re-apply it).

### Build / run commands

```
mvn -q -DskipTests install          # build + install all modules to local repo
docker compose up -d                # start Postgres + Redis
cd argosquant-web && mvn spring-boot:run   # boot API on :8080 (runs migrations)
curl localhost:8080/api/health      # {"status":"UP","database":"UP"}
```

Datasource is configured via `ARGOS_DB_*` env vars (defaults match
docker-compose). Spring Boot's `DataSourceAutoConfiguration` is intentionally
excluded — the datasource comes from core's `DataSourceFactory`. JWT secret/TTL
via `argos.jwt.secret` / `argos.jwt.ttl-minutes` (dev defaults in
`CoreConfig`).

Next up: **Phase 5 — Dashboard & Reports** (see PRD.md §4): dashboard
aggregation endpoint(s) feeding both clients, and `reports/` (CSV import/export,
report generation, save-to-disk — file-handling requirement). Note: PRD lists
JSP web views + JavaFX views here, but those are client UI; the actual web
client is the React SPA, so backend work is the REST dashboard aggregation +
reports. JSP/Servlet demonstration and the JavaFX UI remain deferred.

Treat `ArgosQuant_Project_Architecture_and_Features.md` and `PRD.md` as the
source of truth for intended architecture and scope — summarized below.

## Project Intent

ArgosQuant is a planned **Java-based stock portfolio management and
quantitative risk analytics platform**, combining:
- Portfolio management (holdings, transactions, P&L)
- Market data retrieval/caching
- Quantitative analytics (returns, volatility, Sharpe, beta, VaR, drawdown)
- Deterministic scenario/stress testing (hypothetical "what-if" portfolio
  changes, computed from real portfolio + market data — not simulated by
  the LLM)
- A constrained AI assistant that **explains** pre-computed, verified metrics
  rather than calculating financial figures or making investment decisions
  itself

### Dual front-end architecture

The backend is shared by **two separate clients**:
- JavaFX desktop app
- Web app via JSP + Servlets

Both sit on top of the same Business/Service layer — business logic must not
be duplicated per-client or embedded in JavaFX controllers / Servlets.

### AI assistant data flow (important constraint)

The AI assistant must never compute financial metrics itself. The intended
flow is strictly one-directional through verified data:

```
User Question → Spring Boot/Java → Portfolio & Analytics Services
             → Verified Structured Metrics → LLM → NL Explanation
```

The LLM only receives already-computed, verified numbers via `ContextBuilder`
and responds in natural language — it does not have access to raw DB/market
data and cannot perform or influence calculations. The core application must
continue to function normally if the AI/LLM service is unavailable (it's an
optional add-on layer, not a dependency of core functionality).

### Planned package structure (`com.argosquant`)

```
auth/          — registration, login, JWT, Spring Security (controller/service/security/dto)
model/         — User, Portfolio, Stock, Holding, Transaction
portfolio/     — portfolio CRUD, buy/sell transactions (controller/service/repository)
market/        — market data client, caching, freshness/error handling
analytics/     — returns, volatility, sharpe, beta, var, drawdown (one concern per subpackage)
risk/          — RiskEngine, RiskScoreService, CorrelationService (composes analytics/ outputs)
simulation/    — ScenarioEngine, StressTestService (deterministic what-if calculations, no DB mutation)
database/      — JDBC connection management + repositories
servlets/      — web request handling (JSP-facing)
javafx/        — desktop UI controllers
ai/            — ChatController, ChatService, ContextBuilder, LLMClient
exceptions/    — user-defined exceptions (e.g. InsufficientHoldingsException, InvalidTransactionException)
utils/
```

Layering is strict and one-directional:
```
Presentation → Controller/Servlet → Service → Business/Analytics → JDBC Repository → PostgreSQL
```
Analytics/risk/simulation logic belongs in `analytics/`, `risk/`, `simulation/`
— not inlined in controllers or repositories.

### Scenario engine semantics

Scenario/stress testing (`simulation/`) computes hypothetical impact (e.g.
"TCS -15%" → estimated ₹ and % portfolio impact) using real portfolio +
market data, but **never mutates actual holdings/transactions**. Keep this
read-only/non-persistent boundary when implementing it.

### Concurrency

Market data for multiple holdings should be fetched concurrently via
`ExecutorService` (one task per symbol) rather than sequentially, and
scheduled price refreshes should also run off the request thread.

### Required Java-concept integration

Per the spec, the implementation is expected to concretely demonstrate:
abstract classes (`FinancialAsset` base class), inheritance/polymorphism for
specialized asset types, custom checked exceptions, file handling (CSV
import/export), `Collections` (List/Map/Set/Queue/PriorityQueue), JavaFX,
JDBC, Servlets, JSP, and multithreading. When implementing new features,
prefer fitting them naturally into this structure rather than introducing
alternate patterns (e.g. don't swap in an ORM for JDBC, don't replace the
abstract-class hierarchy with composition-only designs) unless asked.

### Planned tech stack

- **Backend:** Java 21, Spring Boot, Spring Security, Servlets, JSP, JDBC, Maven
- **Database:** PostgreSQL, Redis (caching)
- **Desktop:** JavaFX
- **Web:** JSP, HTML/CSS, JavaScript
- **External:** Market-data API, LLM API (for AI assistant only)
- **Deployment:** Docker, cloud-hosted backend, managed PostgreSQL
