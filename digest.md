# ArgosQuant — Reviewer Digest

A one-page speaking guide for presenting the implementation plan (from the
PPTX + PRD.md). Use it as your talk track: what to say, in what order, and
how to defend each decision.

---

## 1. The 30-second pitch (open with this)

> "ArgosQuant is a Java-based stock portfolio management and **quantitative
> risk analytics** platform. It has **two front ends — a JavaFX desktop app
> and a JSP/Servlet web app — sharing one backend**, plus an AI assistant
> that **explains** our verified numbers in plain English but **never computes
> them**. I've finalized the tech stack and a modular Maven structure, and
> laid out an **8-phase plan** where every phase ships something runnable."

That single sentence hits the four things a reviewer cares about: what it
does, the dual-client architecture, the AI safety constraint, and a
de-risked delivery plan.

---

## 2. The four points you MUST land

These are the ideas the whole design is built to protect. If the reviewer
remembers only four things, make it these.

### A. Shared backend — business logic lives in exactly one place
Two clients, one brain. All portfolio/analytics/risk logic sits in
`argosquant-core`. The web and desktop apps are **thin clients** over it.
Nothing financial is ever computed inside a controller, servlet, or FX
controller.

### B. The AI assistant explains, it never calculates
One-directional flow:
`User question → Java services → verified metrics → LLM → explanation`.
The LLM gets **already-computed, verified numbers** via `ContextBuilder`. It
has **no access** to the database or market data and **cannot influence any
figure**. And it's **optional** — if the LLM provider is down, the whole core
app still works.

### C. Simulation is read-only
Scenario/stress testing ("what if TCS drops 15%?") computes hypothetical
impact from **real** portfolio + market data but **never writes to the
database**. The what-if boundary is enforced in code.

### D. Phased, de-risked delivery
8 phases. Each produces something runnable/demoable, and later phases never
force us to revisit earlier layering decisions.

---

## 3. Tech stack — choices AND the "why" (this is what gets probed)

For each row, say the choice, then the one-line reason. The reasons are what
separate "I picked tools" from "I made engineering decisions."

| Layer | Choice | Why this (say this out loud) |
|---|---|---|
| **Language** | Java 21 | LTS (long-term support = stable, supported for years); modern records/pattern-matching keep model + analytics code concise. |
| **Build** | Maven multi-module (core / web / desktop / e2e) | The module split **physically enforces** the shared-backend rule — `core` is a separate artifact that literally *cannot* import web or FX code, so business logic can't leak into a client. |
| **Backend** | Spring Boot 3.x | Gives REST controllers, dependency injection, and scheduling out of the box — lets us focus on the quant logic, not plumbing. |
| **Security** | Spring Security + JWT | **Stateless** auth — no server-side sessions, so the same REST API serves both the web app and the desktop app identically. |
| **Web views** | JSP + Servlets | Required by the spec; classic servlet model, served by Spring Boot's embedded Tomcat. |
| **Desktop UI** | JavaFX 21 | Native desktop client that consumes the **same REST API** as the web app — proves the backend is genuinely client-agnostic. |
| **Persistence** | PostgreSQL + **raw JDBC (no ORM)** | Deliberate: hand-written repositories demonstrate real SQL/JDBC skill and give full control over queries. (See §4 — this is a spec constraint, defend it as a choice.) |
| **Caching** | Redis | Market data changes constantly; Redis caches prices with freshness TTLs so we don't hammer the external API on every request. |
| **Market data** | External API (provider TBD) | Fetched **concurrently** — one `ExecutorService` task per symbol, never one-at-a-time. |
| **AI** | LLM API (provider TBD) | Consumes `ContextBuilder` output only; an **optional, non-blocking** add-on, not a core dependency. |
| **Containers** | Docker + docker-compose | App + Postgres + Redis spin up with one command — dev/prod parity, easy for a reviewer to run. |
| **Testing** | JUnit 5, Mockito, **Testcontainers** | Unit-test services with Mockito; integration-test repositories against a **real Postgres** in a container, not a fake DB. |

**Deliberately excluded** (mention this proactively — it shows intent): no
JPA/Hibernate or any ORM, no reactive stack, no NoSQL primary store, no
GraphQL. We chose simpler, more explicit tools that match the spec's learning
goals.

---

## 4. Likely reviewer questions — have these answers ready

**"Why raw JDBC instead of JPA/Hibernate? Isn't an ORM standard?"**
> It's a deliberate constraint. The project's goal includes demonstrating
> real JDBC and SQL competence. Raw repositories give explicit control over
> queries and avoid hidden ORM behavior. An ORM would actually *hide* the
> skill this project is meant to show.

**"Two front ends sounds like double the work / duplicated logic."**
> That's exactly what the architecture prevents. Both clients are thin — all
> logic is in `argosquant-core`, which is a separate Maven artifact the
> clients depend on but which never depends back on them. The build tool
> enforces no duplication.

**"What stops the AI from hallucinating financial numbers?"**
> The LLM never computes anything. It only receives verified, pre-computed
> metrics through `ContextBuilder` and turns them into prose. It has no DB or
> market-data access. If it's unavailable, the app is unaffected.

**"How do you handle fetching prices for a big portfolio?"**
> Concurrently — one `ExecutorService` task per symbol, plus a scheduled
> refresh that runs off the request thread, with Redis caching in front.
> Never sequential.

**"What are the risks / unknowns?"** (answer honestly — see §6)
> Market-data provider and LLM provider aren't chosen yet, and there's one
> JSP-hosting spike in Phase 0. None block the architecture.

---

## 5. The 8-phase plan (walk it as a timeline)

Frame it as: *"every phase is independently runnable, and the order means I
never have to undo an earlier decision."*

| Phase | Name | Ships (the demoable thing) |
|---|---|---|
| **0** | Scaffolding | Buildable skeleton: Maven reactor, docker-compose (Postgres+Redis), base schema, JDBC connection. |
| **1** | Auth & Portfolio Core | Register, log in (JWT), create a portfolio, buy/sell with validation. Abstract `FinancialAsset` + 2 subclasses. |
| **2** | Market Data | Live, cached prices; concurrent fetch; scheduled refresh; watchlists. |
| **3** | Analytics & Risk | Real quant metrics — returns, volatility, Sharpe, beta, VaR, drawdown, correlation, risk score. |
| **4** | Scenario & Stress Testing | "What if?" simulations — deterministic, read-only. |
| **5** | Dashboard & Reports | Both front ends render the same data; CSV import/export. |
| **6** | AI Assistant | ContextBuilder → LLM explanation; graceful degradation. |
| **7** | Hardening & Deployment | Dockerize, jpackage desktop installer, cloud deploy, load-test concurrency. |

Closing line: **"Next step is Phase 0 — stand up the Maven reactor and
scaffolding."**

---

## 6. Honesty slide — open questions (don't hide these; they build trust)

- **Market-data API provider** — not yet selected (affects `market/client`).
- **LLM provider** — not yet selected (isolated behind `LLMClient`, so it's
  swappable).
- **JSP hosting** — embedded Tomcat vs. external `.war`; a small Phase 0
  spike will settle it.
- **Schema migrations** — Flyway vs. a lightweight custom SQL runner (leaning
  custom, since the spec emphasizes hand-written JDBC).

Say: *"These are provider/tooling choices, not architectural ones — each is
isolated behind an interface, so picking later doesn't change the design."*

---

## 7. Required Java concepts demonstrated (if asked "where's the Java depth?")

Abstract class (`FinancialAsset`) + inheritance/polymorphism for asset types ·
custom checked exceptions (`InsufficientHoldingsException`) · file handling
(CSV import/export) · `Collections` (List/Map/Set/Queue/PriorityQueue) ·
JavaFX · JDBC · Servlets · JSP · multithreading (`ExecutorService`).
