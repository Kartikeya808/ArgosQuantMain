# Java Concepts → Source Map

Where each required Java concept is implemented in the **backend (`argosquant-core`,
`argosquant-web`)** and the **JavaFX desktop client (`argosquant-desktop`)**.
Paths are repo-relative; line numbers are indicative.

> Status legend: ✅ implemented · ⚠️ partial · ⛔ deferred (planned, see notes)

---

## ✅ Abstract classes
The spec-mandated abstract base of the asset hierarchy.

- `argosquant-core/src/main/java/com/argosquant/model/asset/FinancialAsset.java`
  — `public abstract class FinancialAsset` with abstract methods
  `abstract AssetType type()` and `abstract String describe()` (lines 15, 32, 35).

## ✅ Inheritance & polymorphism (specialized asset types)
Concrete subclasses + runtime dispatch driven by the `stocks.asset_type` column.

- Subclasses: `.../model/asset/Equity.java`, `.../model/asset/EtfAsset.java`
  (`final class … extends FinancialAsset`, each pinning `type()`).
- Enum discriminator: `.../model/AssetType.java` (`EQUITY`, `ETF`).
- **Polymorphic construction** (factory): `.../portfolio/repository/StockRepository.java`
  `map(ResultSet)` — `switch (AssetType.valueOf(...))` returns `new Equity(...)`
  or `new EtfAsset(...)` (lines 65–75).
- **Polymorphic use**: `instanceof` pattern matching in
  `.../dashboard/DashboardService.java:105` and
  `.../simulation/ScenarioEngine.java:99` (`asset instanceof Equity e`).

## ✅ Custom checked exceptions
Dedicated checked-exception hierarchy, thrown by the service layer.

- Package: `argosquant-core/src/main/java/com/argosquant/exceptions/`
  - `ArgosException.java` — checked base class
  - `InsufficientHoldingsException.java`, `InvalidTransactionException.java`,
    `EmailAlreadyExistsException.java`, `AuthenticationFailedException.java`,
    `ResourceNotFoundException.java`, `DuplicateResourceException.java`
  - `UncheckedArgosException.java` — carrier to tunnel checked exceptions out of
    transaction lambdas.
- Thrown in e.g. `.../portfolio/service/TransactionService.java` (sell > held →
  `InsufficientHoldingsException`); mapped to HTTP status in
  `argosquant-web/src/main/java/com/argosquant/web/GlobalExceptionHandler.java`.

## ✅ JDBC
Plain JDBC (no ORM): connection management, migrations, and per-entity repositories.

- Infra: `argosquant-core/src/main/java/com/argosquant/database/`
  - `DataSourceFactory.java` (HikariCP pool), `Jdbc.java` (transaction boundary
    helper — `inTransaction` / `inConnection`), `MigrationRunner.java`
    (numbered-SQL runner), `DataAccessException.java`.
- Repositories (all use `Connection` / `PreparedStatement` / `ResultSet`):
  - `.../auth/repository/UserRepository.java`
  - `.../portfolio/repository/{PortfolioRepository,HoldingRepository,TransactionRepository,StockRepository}.java`
  - `.../market/watchlist/WatchlistRepository.java`
- SQL migrations: `.../database/migrations/V1__base_schema.sql`,
  `V2__stock_asset_detail.sql`, `V3__watchlist.sql`.

## ✅ Multithreading
Concurrent market-data fetches, a scheduled off-request-thread refresh, and
off-FX-thread I/O in the desktop client.

- `.../market/service/MarketDataService.java` — one `Future<Quote>` task per
  symbol on an injected `ExecutorService`; results collected via
  `LinkedHashMap<String, Future<Quote>>` (lines 31, 57, 66).
- `.../risk/PortfolioAnalyticsService.java` — concurrent per-symbol history
  fetch (`ExecutorService`, `Future<double[]>`, line 138).
- `argosquant-web/.../config/MarketConfig.java:60` — `Executors.newFixedThreadPool`
  with a daemon `ThreadFactory`.
- `argosquant-web/.../job/MarketDataRefreshJob.java:31` — `@Scheduled`
  (`fixedDelayString`) warms the cache off the request thread.
- Desktop: `argosquant-desktop/.../DesktopLauncher.java:418` — worker `Thread`
  per call, results marshalled back with `Platform.runLater`.

## ✅ JavaFX (desktop client)
A second client on the shared REST backend — read-only analytics viewer.

- `argosquant-desktop/src/main/java/com/argosquant/desktop/`
  - `DesktopLauncher.java` — `extends Application`; login scene + `TabPane`
    (Dashboard / Market / Watchlist), `TableView`, `ComboBox`, `TextField`,
    `BorderPane`/`VBox`/`HBox` layouts.
  - `ApiClient.java` — HTTP+JWT wrapper; deserializes the shared core record
    `PortfolioDashboard`.
  - `ApiException.java`, `resources/desktop.css` (dark theme).

## ⚠️ Collections
`List` and `Map` are used pervasively; `Set` is used; **`Queue`/`PriorityQueue`
are not currently used.**

- `Set<Integer>` (HashSet): `.../database/MigrationRunner.java:91`
  (tracks applied migration versions).
- `Map` (`LinkedHashMap`): `.../market/service/MarketDataService.java:57`,
  `.../risk/PortfolioAnalyticsService.java:138`.
- `List`: throughout (holdings, transactions, quotes, watchlist, analytics).
- ⛔ **`Queue` / `PriorityQueue`**: not yet used — no natural fit has come up
  (candidate: a bounded work queue for the refresh job). Flag for a future pass.

---

## Deferred concepts (planned, not yet implemented)

These are in the spec but intentionally not built yet on this branch.

- ⛔ **File handling (CSV import/export)** — Phase 5 `reports/` package is still
  TODO (CSV import/export, save-to-disk report generation). No `reports/` source
  exists yet.
- ⛔ **Servlets** — the web layer is implemented as Spring MVC `@RestController`s
  (`argosquant-web/.../controller/*.java`) consumed by a React SPA, not raw
  `HttpServlet`s. A JSP/Servlet demonstration remains deferred.
- ⛔ **JSP** — deferred; the web UI is the React client in `frontend/`.

> Note on the AI assistant: the LLM-backed assistant (Phase 6) is also not wired
> — the desktop and web clients work fully without it, by design.
