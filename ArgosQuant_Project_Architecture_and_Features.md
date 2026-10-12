# ArgosQuant

## Intelligent Stock Portfolio & Risk Analytics Platform

ArgosQuant is a Java-based stock portfolio management and quantitative
risk analytics platform. It combines portfolio management, market data,
quantitative financial analysis, scenario testing, and a lightweight AI
portfolio assistant.

------------------------------------------------------------------------

# 1. Core Features

## 1.1 User & Portfolio Management

-   User registration and login
-   JWT-based authentication
-   Create and manage portfolios
-   Add stocks to portfolios
-   Buy and sell transactions
-   Transaction history
-   Holdings and quantities
-   Average purchase price
-   Realized Profit & Loss
-   Unrealized Profit & Loss
-   Current portfolio value
-   Portfolio allocation by stock
-   Portfolio allocation by sector

## 1.2 Market Data Engine

-   Current stock prices
-   Historical stock prices
-   Periodic price updates
-   Watchlist management
-   Benchmark/index data
-   Market-data caching
-   Data freshness and API error handling

## 1.3 Quantitative Analytics Engine

### Performance Metrics

-   Absolute return
-   Daily returns
-   Monthly returns
-   Annualized returns
-   CAGR
-   Portfolio performance over time
-   Benchmark comparison
-   Excess return

### Risk Metrics

-   Volatility
-   Sharpe Ratio
-   Beta
-   Maximum Drawdown
-   Value at Risk (VaR)
-   Correlation between holdings
-   Portfolio risk score
-   Diversification score

## 1.4 Scenario & Stress Testing

Users can simulate hypothetical portfolio scenarios without modifying
their actual holdings.

Examples:

-   Individual stock price shock
-   Sector-wide decline
-   Market-wide decline
-   Adding a new position
-   Removing an existing position
-   Changing allocation
-   Investing an additional amount

Example:

``` text
Current Portfolio:     ₹10,00,000
TCS Allocation:              22%
TCS Scenario:               -15%

Estimated Impact:        -₹33,000
New Portfolio Value:      ₹9,67,000
Portfolio Impact:            -3.3%
```

The scenario engine performs deterministic calculations using portfolio
and market data.

## 1.5 Dashboard & Visualization

The application provides a centralized dashboard containing:

-   Total portfolio value
-   Total investment
-   Today's P&L
-   Overall P&L
-   Portfolio performance chart
-   Stock allocation chart
-   Sector allocation chart
-   Risk metrics
-   Drawdown chart
-   Risk/return visualization
-   Correlation heatmap
-   Benchmark comparison
-   Holdings table
-   Watchlist

## 1.6 Reports & File Handling

-   Export portfolio data to CSV
-   Export transaction history
-   Generate portfolio/risk reports
-   Import transactions from CSV
-   Save generated reports locally

## 1.7 AI Portfolio Assistant

ArgosQuant includes a constrained AI assistant focused on explaining the
user's existing portfolio data.

Example queries:

-   "What is my current portfolio return?"
-   "Which stock has the highest allocation?"
-   "How much am I exposed to the IT sector?"
-   "What is my portfolio volatility?"
-   "Explain my Sharpe ratio."
-   "What does Value at Risk mean?"

### AI Design Principle

The AI does **not** calculate financial metrics or make autonomous
investment decisions.

The system follows:

``` text
User Question
      ↓
Spring Boot / Java
      ↓
Portfolio & Analytics Services
      ↓
Verified Structured Metrics
      ↓
LLM
      ↓
Natural-Language Explanation
```

If the AI service is unavailable, the core ArgosQuant application
continues to function normally.

------------------------------------------------------------------------

# 2. System Architecture

``` text
                              ARGOSQUANT
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
          JavaFX Desktop                     Web Application
                 │                                 │
                 │                            JSP + Servlets
                 │                                 │
                 └────────────────┬────────────────┘
                                  ↓
                         Business / Service Layer
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ↓                   ↓                   ↓
       Portfolio Service      Risk Engine        Market Service
              │                   │                   │
              │                   │                   ↓
              │                   │            External Market API
              │                   │
              └───────────────────┼───────────────────┐
                                  ↓                   │
                           Scenario Engine            │
                                  │                   │
                                  └─────────┬─────────┘
                                            ↓
                                      JDBC Data Layer
                                            ↓
                                        PostgreSQL
                                            │
                                      ┌─────┴─────┐
                                      ↓           ↓
                                  File System    Redis
                                      │
                                      ↓
                                  CSV Reports

                         AI Portfolio Assistant
                                  │
                                  ↓
                          Verified Portfolio Data
                                  │
                                  ↓
                              LLM API
```

------------------------------------------------------------------------

# 3. Backend Architecture

The backend follows a layered architecture:

``` text
Presentation Layer
        ↓
Controller / Servlet Layer
        ↓
Service Layer
        ↓
Business / Analytics Layer
        ↓
JDBC Repository / Data Access Layer
        ↓
PostgreSQL
```

### Major Modules

``` text
com.argosquant
│
├── auth
│   ├── controller
│   ├── service
│   ├── security
│   └── dto
│
├── model
│   ├── User
│   ├── Portfolio
│   ├── Stock
│   ├── Holding
│   └── Transaction
│
├── portfolio
│   ├── controller
│   ├── service
│   └── repository
│
├── market
│   ├── service
│   ├── client
│   └── cache
│
├── analytics
│   ├── returns
│   ├── volatility
│   ├── sharpe
│   ├── beta
│   ├── var
│   └── drawdown
│
├── risk
│   ├── RiskEngine
│   ├── RiskScoreService
│   └── CorrelationService
│
├── simulation
│   ├── ScenarioEngine
│   └── StressTestService
│
├── database
│   ├── connection
│   └── repository
│
├── servlets
│
├── javafx
│
├── ai
│   ├── ChatController
│   ├── ChatService
│   ├── ContextBuilder
│   └── LLMClient
│
├── exceptions
│
└── utils
```

------------------------------------------------------------------------

# 4. Java Concepts Integration

The required Java concepts are integrated into real application
functionality.

  -----------------------------------------------------------------------
  Java Concept                        ArgosQuant Implementation
  ----------------------------------- -----------------------------------
  OOP                                 Domain models, services, analytics
                                      and business logic

  Encapsulation                       Private fields with controlled
                                      access through methods

  Inheritance                         Specialized financial asset classes

  Polymorphism                        Common interfaces/abstract types
                                      for financial calculations

  Packages                            Modular package structure

  Abstract Class                      `FinancialAsset` base class

  User-Defined Exceptions             `InsufficientHoldingsException`,
                                      `InvalidTransactionException`, etc.

  File Handling                       CSV import/export and report
                                      generation

  Collections                         `List`, `Map`, `Set`, `Queue`,
                                      `PriorityQueue` for application
                                      data

  JavaFX                              Desktop portfolio and analytics
                                      dashboard

  JDBC                                PostgreSQL connectivity and
                                      database operations

  Servlets                            Web request handling and controller
                                      layer

  JSP                                 Web-based dashboard and portfolio
                                      views

  Multithreading                      Concurrent market-data retrieval
                                      and scheduled price updates
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 5. Multithreading Architecture

Market data for multiple holdings can be retrieved concurrently rather
than sequentially.

``` text
                     Market Data Update
                            │
                    ExecutorService
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
          Thread 1       Thread 2       Thread 3
            TCS            INFY          RELIANCE
             ↓              ↓              ↓
             └──────────────┼──────────────┘
                            ↓
                    Updated Price Data
                            ↓
                     Portfolio Engine
```

Multithreading can also be used for:

-   Scheduled market-data refreshes
-   Concurrent price retrieval
-   Parallel portfolio calculations
-   Background report generation

------------------------------------------------------------------------

# 6. Data Flow

## Portfolio Transaction

``` text
User
 ↓
JSP / JavaFX
 ↓
Servlet / Controller
 ↓
Portfolio Service
 ↓
Validation
 ↓
JDBC Repository
 ↓
PostgreSQL
 ↓
Updated Holdings
 ↓
Risk & Analytics Engine
 ↓
Dashboard
```

## Risk Analysis

``` text
Historical Prices
       ↓
Market Data Service
       ↓
Portfolio Holdings
       ↓
Quantitative Analytics Engine
       ↓
┌─────────┬─────────┬────────┬──────────┐
│ Return  │ Volatility │ Sharpe │ Beta   │
└─────────┴─────────┴────────┴──────────┘
       ↓
Risk Engine
       ↓
Portfolio Risk Score
       ↓
Dashboard
```

## AI Assistant

``` text
User
 ↓
Chat Interface
 ↓
AI Service
 ↓
Portfolio / Analytics Services
 ↓
Verified Structured Data
 ↓
LLM API
 ↓
Response
```

------------------------------------------------------------------------

# 7. Core Technology Stack

### Backend

-   Java 21
-   Spring Boot
-   Spring Security
-   Servlets
-   JSP
-   JDBC
-   Maven

### Database

-   PostgreSQL
-   Redis for caching

### Desktop Interface

-   JavaFX

### Web Interface

-   JSP
-   HTML/CSS
-   JavaScript

### External Services

-   Market-data API
-   LLM API for the Portfolio Assistant

### Deployment

-   Docker
-   Cloud-hosted Java backend
-   Managed PostgreSQL database
