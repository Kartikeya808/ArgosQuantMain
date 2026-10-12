# ArgosQuant Backend — Progress Report

**Date:** 2026-10-08
**Status:** Phases 0–4 complete & verified. Phase 5 just started (1 file).
**Build:** `mvn test` → BUILD SUCCESS, 27 unit tests passing, full reactor compiles.

---

## How to run what exists today

```bash
# 1. Start infra (Postgres 16 + Redis 7)
docker compose up -d

# 2. Build + install all modules to the local repo
mvn -q -DskipTests install

# 3. Boot the REST backend on :8080 (runs DB migrations at startup)
cd argosquant-web && mvn spring-boot:run

# 4. Smoke test
curl localhost:8080/api/health            # {"status":"UP","database":"UP"}
```

Run tests: `mvn test` (from repo root). The one Testcontainers integration
test skips automatically on this machine — see "Known environment issues".

---

## Completed today

### Phase 0 — Scaffolding ✅
- Maven multi-module reactor: `argosquant-core` (plain library), `argosquant-web`
  (Spring Boot REST), `argosquant-desktop` (JavaFX stub).
- Parent POM imports the Spring Boot BOM via `dependencyManagement` (not as a
  parent) so **core carries zero Spring-web/servlet/JavaFX deps** — the layering
  invariant is enforced at build level.
- `database/`: `DatabaseConfig` (env-driven), `DataSourceFactory` (HikariCP
  pool, no ORM), hand-written `MigrationRunner` (custom numbered-SQL runner, not
  Flyway), `Jdbc` transaction helper (repos take a `Connection`; services own tx
  boundaries).
- `docker-compose.yml` (Postgres + Redis). Base schema `V1`.
- Verified: app boots, migrations apply, `/api/health` green.

### Phase 1 — Auth & Portfolio Core ✅
- Model: abstract `FinancialAsset` + `Equity`/`EtfAsset` (polymorphic hydration
  from `stocks.asset_type`); records `User`/`Portfolio`/`Holding`/`Transaction`.
- Checked `ArgosException` hierarchy + `UncheckedArgosException` carrier.
- Auth: `PasswordHasher` (jBCrypt), `JwtService` (jjwt HS256, stateless),
  `AuthService`.
- Portfolio: JDBC repositories, `PortfolioService` (ownership-scoped CRUD),
  `TransactionService` (buy/sell with weighted average-cost, holdings-never-
  negative, all atomic in one tx).
- Web: stateless JWT `SecurityConfig` + `JwtAuthFilter`, `CoreConfig` bean
  wiring, `GlobalExceptionHandler` (each business exception → HTTP status).
- Verified live: register/login/JWT, portfolio CRUD, buy 10@100 + buy 10@200 →
  20 @ 150, sell 5 → 15 @ 150; oversell → 422, cross-user → 404, dup email →
  409, unauth → 403. 8 unit tests.

### Phase 2 — Market Data ✅
- `market/`: `Quote`; `MarketDataClient` interface + `SimulatedMarketDataClient`
  (deterministic stand-in, provider TBD — swap the bean to go live);
  `MarketDataCache` (Redis/Jedis, TTL, **degrades gracefully** when Redis down);
  `MarketDataService` (cache-aside reads, concurrent multi-symbol fetch via
  `ExecutorService`); `watchlist/` repo + service. Migration `V3`.
- Web: `MarketConfig`, `MarketController`, `WatchlistController`,
  `SchedulingConfig` + `MarketDataRefreshJob` (@Scheduled, off the request
  thread).
- Verified live: cache miss→fetch then Redis hit (key + TTL present), concurrent
  batch, watchlist CRUD, scheduled refresh on `scheduling-1` thread. 4 unit
  tests.

### Phase 3 — Analytics & Risk ✅
- `analytics/` pure calculators (one concern per subpackage): returns,
  volatility, Sharpe, beta, VaR (historical + parametric), drawdown, + shared
  `StatUtils`. Operate on `double[]`, no I/O.
- `risk/`: `CorrelationService`, `RiskEngine` (composes calculators →
  `RiskReport`), `RiskScoreService` (0–100 score + rating + rationale),
  `PortfolioAnalyticsService` (read-only orchestrator: loads holdings, fetches
  each symbol's history **concurrently**, builds equity curve, returns full
  `PortfolioAnalytics` incl. benchmark excess return + per-holding breakdown +
  correlation matrix). Market client gained `fetchDailyHistory`.
- Web: `AnalyticsConfig`, `AnalyticsController`.
- Verified live: 3-asset portfolio → full risk report + score (23/LOW) +
  benchmark excess return + weights summing ~1.0 + 3×3 correlation matrix. 11
  unit tests.

### Phase 4 — Scenario & Stress Testing ✅
- `simulation/`: `ScenarioDefinition` (additive market + sector + per-symbol
  shocks), `ScenarioEngine` (**strictly read-only** — values real holdings at
  live quotes, applies shocks, never writes DB), `StressTestService` (standard
  battery).
- Web: `SimulationConfig`, `SimulationController`.
- Verified live: custom market −10% + TCS −5% → TCS −15%, correct ₹/% impact;
  standard battery correct; **holdings + transaction count unchanged after
  running** (read-only confirmed). 4 unit tests.

### REST API surface (all live today)
```
GET  /api/health
POST /api/auth/register | /api/auth/login
GET/POST/DELETE /api/portfolios ; GET /api/portfolios/{id}
GET /api/portfolios/{id}/holdings
GET/POST /api/portfolios/{id}/transactions
GET /api/market/quote/{symbol} ; GET /api/market/quotes?symbols=A,B
GET/POST/DELETE /api/watchlist ; GET /api/watchlist/quotes
GET /api/portfolios/{id}/analytics
POST /api/portfolios/{id}/simulation/scenario
GET  /api/portfolios/{id}/simulation/stress-tests
```

---

## Remaining work

### Phase 5 — Dashboard & Reports (STARTED — ~5% done)
Already created: `dashboard/DashboardHolding.java` (one DTO, compiles; no
consumers yet).

**To do:**
- `dashboard/`: `PortfolioDashboard` DTO + `DashboardService` — aggregate total
  cost basis, total market value (live quotes, concurrent), unrealized P&L (abs
  + %), per-holding enriched valuation; `DashboardController`
  (`GET /api/portfolios/{id}/dashboard`).
- `reports/` (the spec's **file-handling** requirement): `ReportService` —
  CSV export of transactions & holdings, CSV import of transactions (reuse
  `TransactionService` so imports go through validation), report generation
  saved to disk; `ReportController` (download CSV, import, save-to-disk).
  `ImportResult` DTO (imported/failed/errors).
- Suggested: a `reports` dir config knob (`argos.reports.dir`).
- Tests: `DashboardService` aggregation unit test; `ReportService` CSV
  round-trip test.

### Phase 6 — AI Portfolio Assistant
- `ai/ContextBuilder` — assembles **already-computed, verified** metrics from
  `portfolio`/`analytics`/`risk` services only (no DB/market access).
- `ai/LLMClient` + `ChatService`/`ChatController` — one-directional flow:
  question → verified metrics → LLM → NL explanation. LLM **never computes
  numbers**.
- **Must degrade gracefully**: core app fully functional if the LLM provider is
  down/unconfigured (optional layer, not a dependency).
- Provider TBD (open question). Use the latest Claude model (e.g.
  `claude-opus-4-8` / `claude-sonnet-5`) via the Anthropic API; gate on an API
  key and no-op/clear-error when absent.
- Tests: `ContextBuilder` unit test; a mocked `LLMClient` to test `ChatService`
  wiring and the graceful-degradation path.

### Phase 7 — Hardening & Deployment
- Dockerize `argosquant-web`; finalize docker-compose for app + Postgres + Redis
  together.
- `jpackage`/installer for `argosquant-desktop`.
- Cloud deploy of backend + managed Postgres.
- Load-test the concurrent market-data refresh path; review exception handling
  coverage and multithreading correctness (cache/refresh race conditions).

---

## Deferred / cross-cutting (not a numbered phase, but owed per the spec)
- **JSP + Servlets** (CLAUDE.md requires demonstrating them). The real web
  client is the React SPA in `frontend/`, so the web module is REST-first and
  JSP was skipped. If the spec requirement stands, add a minimal JSP dashboard
  page + one Servlet (watch the embedded-Tomcat-JSP vs `.war` question in
  PRD §6 — may need a spike).
- **JavaFX desktop UI** (`argosquant-desktop` is currently a stub launcher) —
  Phase 5 in the PRD also lists JavaFX views; it consumes the same REST API.
- **Sector data**: Phase 1 auto-creates stocks with `sector=null`, so
  sector-based stress scenarios show 0 impact until instrument reference data is
  populated (engine logic is correct — proven by unit test). Phase 2's market
  layer or a reference-data import should backfill sector/exchange/name.
- **Real market-data & LLM providers** are both still TBD (PRD §6). Interfaces
  are in place so swapping in a real implementation is localized.

---

## Known environment issues on this machine (documented in CLAUDE.md)
1. **JDK 26 + Mockito**: surefire passes `-Dnet.bytebuddy.experimental=true`
   (in `argosquant-core/pom.xml`) so ByteBuddy can instrument JDK 26 classes.
2. **Docker Engine 29 + Testcontainers**: docker-java gets HTTP 400 on `/info`,
   so `PortfolioFlowIntegrationTest` **skips** (guarded on
   `DockerClientFactory.isDockerAvailable()`) instead of failing. DB-backed
   flows were instead verified live via the REST API against docker-compose
   Postgres. Revisit if the Docker/Testcontainers combo becomes compatible.
3. **Compiler `-parameters`**: the parent POM sets `<parameters>true</parameters>`
   (we don't inherit `spring-boot-starter-parent`) so Spring MVC can bind
   `@PathVariable`/`@RequestParam` by name. After changing compiler config, run
   `mvn clean` — incremental compilation won't re-apply it.

## Suggested starting point tomorrow
Finish Phase 5: implement `DashboardService` + `PortfolioDashboard` (reuse
`MarketDataService.getQuotes` for live valuation), then `reports/ReportService`
(CSV export first, then import via `TransactionService`, then save-to-disk).
Wire `DashboardController` + `ReportController`, add two unit tests, and verify
live with curl (export → import round-trip; dashboard totals vs holdings).
