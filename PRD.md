# ArgosQuant — Product Requirements Document

Status: Draft v1 · Date: 2026-10-05
Source of truth for scope/features: `ArgosQuant_Project_Architecture_and_Features.md`
This document finalizes the **tech stack**, **modular folder structure**, and
**implementation plan** so that scaffolding (Maven project, packages, build
config) can be generated directly from it.

------------------------------------------------------------------------

## 1. Purpose & Scope

ArgosQuant is a Java-based stock portfolio management and quantitative risk
analytics platform with two front ends (JavaFX desktop, JSP/Servlet web)
sharing one backend, plus a constrained AI assistant that explains
pre-computed metrics (never computes them).

This PRD does not re-define features — see the architecture doc for the
full feature list (portfolio management, market data, analytics, scenario
engine, dashboard, reports, AI assistant). It defines **how the repo is
organized and built**, and **the order in which it gets built**.

## 2. Finalized Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | Java 21 | LTS; records/pattern-matching used where idiomatic |
| Build | Maven (single multi-module reactor) | See §3 for module layout |
| Backend framework | Spring Boot 3.x | REST controllers, dependency injection, scheduling |
| Security | Spring Security + JWT | Stateless auth for the web/REST API; shared by desktop client as an HTTP consumer |
| Web views | JSP + Servlets | Classic servlet container (embedded Tomcat via Spring Boot `spring-boot-starter-web` + JSP support, or a `.war` to external Tomcat if JSP support requires it) |
| Desktop UI | JavaFX 21 | Separate module, consumes backend over HTTP (same REST API as web) |
| Persistence | PostgreSQL + raw JDBC | No ORM — hand-written repositories per CLAUDE.md constraint |
| Caching | Redis | Market data caching, freshness TTLs |
| Market data | External Market-Data API (TBD provider) | Fetched via `market/client`, concurrent per-symbol via `ExecutorService` |
| AI assistant | LLM API (provider TBD) | Only consumes `ContextBuilder` output; optional/non-blocking dependency |
| Containerization | Docker + docker-compose | App, Postgres, Redis services for local/dev parity |
| Deployment target | Cloud-hosted Java backend, managed PostgreSQL | Desktop app distributed separately (e.g. jpackage) |
| Testing | JUnit 5, Mockito, Testcontainers (Postgres) | Unit tests per service/analytics module; integration tests against real Postgres via Testcontainers |

Deliberately excluded (per CLAUDE.md constraints): JPA/Hibernate or any ORM,
reactive stack, NoSQL primary store, GraphQL.

## 3. Modular Folder Structure (Maven multi-module)

Rationale: the backend is shared by two independent clients (JavaFX, JSP/
Servlet web). A multi-module Maven reactor enforces that sharing at the
build level — `core` cannot accidentally depend on `web` or `desktop`, and
business logic physically cannot live in a controller or FX controller.

```
argosquant/                                # reactor root
├── pom.xml                                # parent POM: module list, shared dependency versions
├── docker-compose.yml                     # postgres + redis + app for local dev
├── PRD.md
├── ArgosQuant_Project_Architecture_and_Features.md
├── CLAUDE.md
│
├── argosquant-core/                       # all business logic — no servlets, no FX, no HTTP
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/argosquant/
│       │   ├── model/                     # User, Portfolio, Stock, Holding, Transaction
│       │   │   └── asset/                 # FinancialAsset (abstract) + subclasses (Equity, ETF, ...)
│       │   ├── auth/
│       │   │   ├── service/               # AuthService, JwtService
│       │   │   ├── security/              # token validation, password hashing
│       │   │   └── dto/
│       │   ├── portfolio/
│       │   │   ├── service/               # PortfolioService, TransactionService
│       │   │   └── repository/            # JDBC repositories
│       │   ├── market/
│       │   │   ├── client/                # MarketDataClient (external API)
│       │   │   ├── cache/                 # Redis-backed cache layer
│       │   │   └── service/               # MarketDataService, scheduled refresh
│       │   ├── analytics/
│       │   │   ├── returns/
│       │   │   ├── volatility/
│       │   │   ├── sharpe/
│       │   │   ├── beta/
│       │   │   ├── var/
│       │   │   └── drawdown/
│       │   ├── risk/                      # RiskEngine, RiskScoreService, CorrelationService
│       │   ├── simulation/                # ScenarioEngine, StressTestService (read-only, non-persistent)
│       │   ├── reports/                   # CSV import/export, report generation (file handling)
│       │   ├── database/                  # JDBC connection management (DataSource, migrations runner)
│       │   ├── ai/
│       │   │   ├── service/               # ChatService, ContextBuilder
│       │   │   └── client/                # LLMClient
│       │   ├── exceptions/                # InsufficientHoldingsException, InvalidTransactionException, ...
│       │   └── utils/
│       ├── main/resources/
│       │   └── db/migration/              # SQL schema migrations (Flyway or plain numbered .sql)
│       └── test/java/com/argosquant/...   # unit + Testcontainers integration tests, mirrors main/java
│
├── argosquant-web/                        # REST controllers + Servlets + JSP; depends on core only
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/argosquant/web/
│       │   ├── controller/                # @RestController per domain (PortfolioController, ChatController, ...)
│       │   ├── servlet/                   # legacy/JSP-facing Servlets where required by spec
│       │   └── config/                    # SecurityConfig, CORS, bean wiring
│       ├── main/resources/
│       │   └── application.yml
│       └── main/webapp/
│           └── WEB-INF/jsp/                # dashboard.jsp, portfolio.jsp, login.jsp, ...
│
├── argosquant-desktop/                    # JavaFX client; depends on core only (as HTTP client of argosquant-web)
│   ├── pom.xml
│   └── src/main/java/com/argosquant/desktop/
│       ├── controller/                    # FXML controllers
│       ├── view/                          # .fxml resources
│       └── client/                        # typed HTTP client calling argosquant-web's REST API
│
└── argosquant-e2e/                        # optional: cross-module integration/E2E tests
    └── src/test/java/...
```

Key invariants this structure encodes (do not violate when scaffolding):

- `argosquant-core` has **zero** dependency on Spring MVC/Servlet/JSP/JavaFX
  artifacts — it is a plain library module. Both `web` and `desktop` depend
  on it; it never depends on them.
- `simulation/` never writes to `database/` repositories — scenario/stress
  results are computed and returned, not persisted.
- `ai/` only talks to `portfolio`, `analytics`, and `risk` service outputs
  through `ContextBuilder`; it has no JDBC or market-data-client access.
- Package root stays `com.argosquant` across modules (`com.argosquant.web`,
  `com.argosquant.desktop` as sub-roots) so the module boundary is physical
  (separate Maven artifact) even though the namespace reads as one app.

## 4. Implementation Plan

Phased so each phase produces something runnable/demoable and later phases
never require revisiting earlier layering decisions.

### Phase 0 — Scaffolding
- Create multi-module Maven reactor (`argosquant-core`, `argosquant-web`,
  `argosquant-desktop`), parent POM with shared versions.
- `docker-compose.yml` for Postgres + Redis.
- Base schema migration: `users`, `portfolios`, `stocks`, `holdings`,
  `transactions`.
- `database/` JDBC connection management wired to Postgres via Docker.

### Phase 1 — Auth & Portfolio Core
- `model/` domain classes incl. abstract `FinancialAsset` + at least two
  concrete subclasses.
- `auth/`: registration, login, JWT issuance/validation, Spring Security
  config in `argosquant-web`.
- `portfolio/`: CRUD for portfolios/holdings, buy/sell transaction service
  with validation (`InsufficientHoldingsException`, etc.), JDBC repositories.
- REST controllers in `argosquant-web` exposing the above.
- Unit tests for services; Testcontainers integration test for repositories.

### Phase 2 — Market Data
- `market/client`: external market-data API integration.
- `market/cache`: Redis caching with freshness/TTL handling.
- Concurrent per-symbol price fetch via `ExecutorService`; scheduled refresh
  job off the request thread.
- Watchlist management.

### Phase 3 — Analytics & Risk
- `analytics/`: returns, volatility, Sharpe, beta, VaR, drawdown — one
  class/concern per subpackage, pure functions over historical price +
  holdings data.
- `risk/`: RiskEngine composing analytics outputs into portfolio risk score,
  CorrelationService for inter-holding correlation.
- Benchmark comparison, excess return.

### Phase 4 — Scenario & Stress Testing
- `simulation/ScenarioEngine` + `StressTestService`: deterministic what-if
  calculations (price shocks, sector/market-wide decline, allocation
  changes) reusing `analytics`/`risk` outputs, strictly read-only.

### Phase 5 — Dashboard & Reports
- Dashboard aggregation endpoint(s) feeding both clients.
- JSP views (`argosquant-web/webapp`) for web dashboard, portfolio,
  watchlist, reports pages.
- JavaFX views (`argosquant-desktop`) mirroring the same data via the REST
  client.
- `reports/`: CSV import/export, report generation, save-to-disk.

### Phase 6 — AI Portfolio Assistant
- `ai/ContextBuilder`: assembles verified structured metrics from
  `portfolio`/`analytics`/`risk` services only.
- `ai/LLMClient` + `ChatService`/`ChatController`: one-directional flow
  (question → verified metrics → LLM → NL explanation).
- Graceful degradation: core app features unaffected if LLM API is down.

### Phase 7 — Hardening & Deployment
- Dockerize `argosquant-web`; finalize docker-compose for app + Postgres +
  Redis.
- jpackage/installer for `argosquant-desktop`.
- Cloud deployment of backend, managed Postgres provisioning.
- Load-test concurrent market-data refresh path; review exception handling
  coverage and multithreading correctness (race conditions in cache/refresh).

## 5. Non-Functional Requirements

- Core application (auth, portfolio, market data, analytics, dashboard)
  must function fully with the AI module disabled or unreachable.
- Business logic must not be duplicated between `argosquant-web` and
  `argosquant-desktop` — both are thin clients over `argosquant-core`
  services (web via in-process service calls, desktop via REST).
- All financial metrics shown to the user or passed to the LLM must
  originate from `analytics`/`risk`/`simulation` — never computed inline in
  a controller, servlet, or FX controller.
- Market data fetches for N holdings must be concurrent (`ExecutorService`),
  not sequential.

## 6. Open Questions

- Market-data API provider (affects `market/client` contract) — not yet
  selected.
- LLM API provider — not yet selected.
- JSP hosting: embedded Tomcat via Spring Boot vs. packaging as `.war` to an
  external servlet container — needs a spike in Phase 0 if Spring Boot's
  embedded JSP support proves insufficient.
- Schema migration tool: Flyway vs. plain versioned SQL scripts run by a
  custom `database/` runner (spec emphasizes hand-written JDBC, so a
  lightweight custom runner may be preferred over pulling in Flyway).
