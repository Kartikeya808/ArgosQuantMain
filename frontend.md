# ArgosQuant --- 5-Phase Frontend Development Plan

## Project

**ArgosQuant --- Intelligent Stock Portfolio & Risk Analytics Platform**

### Visual Direction

**Bloomberg Terminal × Modern Quant Workstation × Premium Fintech**

Dark terminal-first interface, amber/orange accent, dense financial
data, precise charts, restrained animations, and minimal decorative UI.

------------------------------------------------------------------------

# Phase 1 --- Foundation + Core Dashboard

## Objective

Build the complete visual foundation and the main ArgosQuant dashboard.

### Design System

Establish:

-   Global color tokens
-   Typography
-   Spacing
-   Borders
-   Shadows
-   Responsive breakpoints
-   Icon system
-   Chart styling
-   Financial number formatting

### Color System

Background:

-   `#0B0D0F`
-   `#111417`
-   `#15191D`
-   `#1B2025`

Accent:

-   `#F5A623`
-   `#FFB84D`
-   `#B87918`

Financial:

-   Positive `#38C172`
-   Negative `#EF5350`
-   Neutral `#9AA3AD`

Typography:

-   UI: Inter / Geist / IBM Plex Sans
-   Financial data: IBM Plex Mono / JetBrains Mono

### Reusable Components

Build the component foundation:

-   Sidebar
-   Header
-   Buttons
-   Inputs
-   Selects
-   Tabs
-   Badges
-   Tooltips
-   Metric cards
-   Tables
-   Modals
-   Drawers
-   Toasts
-   Skeletons
-   Empty states
-   Error states
-   Chart containers
-   Sparklines
-   Risk indicators
-   Status indicators

### Application Shell

Create:

-   Persistent sidebar
-   Global header
-   Main content area
-   Breadcrumbs
-   Portfolio selector
-   Date selector
-   Market status
-   Search
-   Notifications
-   User profile

### Dashboard

Build:

-   Portfolio Value
-   Today's P&L
-   Total Investment
-   Total P&L
-   Volatility
-   Sharpe Ratio
-   Risk Score
-   Portfolio performance chart
-   Benchmark comparison
-   Stock allocation
-   Sector allocation
-   Risk overview
-   Holdings table

Holdings columns:

`Symbol | Company | Qty | Avg Price | LTP | Value | P&L | P&L % | Weight`

### Deliverable

A polished dashboard with realistic mock financial data and a reusable
design system.

------------------------------------------------------------------------

# Phase 2 --- Portfolio + Markets

## Objective

Build the complete portfolio-management and market-data experience.

## Portfolio Management

### Holdings

-   Holdings table
-   Search
-   Sort
-   Filters
-   Sector filter
-   Add position
-   Stock navigation

### Buy/Sell Workflow

Create transaction modal with:

-   Stock
-   Buy/Sell
-   Quantity
-   Price
-   Date
-   Fees
-   Notes

Include:

-   Validation
-   Confirmation
-   Success
-   Error states

### Transactions

Table:

`Date | Symbol | Type | Quantity | Price | Value | Fees | Status`

------------------------------------------------------------------------

## Stock Detail

Create professional security pages containing:

-   Ticker
-   Company
-   Current price
-   Price change
-   Price chart
-   Timeframe selector
-   Volume
-   User position
-   Average cost
-   Unrealized P&L
-   Portfolio weight

Tabs:

-   Overview
-   Price
-   Performance
-   Risk
-   Position

------------------------------------------------------------------------

## Markets

### Indices

-   NIFTY 50
-   SENSEX
-   NIFTY IT
-   BANK NIFTY

### Market Movers

-   Gainers
-   Losers
-   Most Active

### Market Status

-   Open/closed
-   Last update
-   Next close

------------------------------------------------------------------------

## Watchlist

-   Add/remove stocks
-   Search
-   Sort
-   Price
-   Change
-   Volume
-   Quick stock detail

### Deliverable

A complete portfolio and market exploration workflow using mock data.

------------------------------------------------------------------------

# Phase 3 --- Quant Analytics + Stress Testing

## Objective

Build ArgosQuant's core quantitative-finance functionality.

------------------------------------------------------------------------

## Performance Analytics

Metrics:

-   Total Return
-   Annualized Return
-   CAGR
-   Best Day
-   Worst Day
-   Winning Days
-   Losing Days

Charts:

-   Portfolio vs benchmark
-   Cumulative return
-   Monthly returns
-   Daily return distribution
-   Rolling volatility

------------------------------------------------------------------------

## Risk Analytics

Metrics:

-   Risk Score
-   Volatility
-   Sharpe Ratio
-   Beta
-   Maximum Drawdown
-   Value at Risk (VaR)

Visualizations:

-   Risk score gauge
-   Volatility chart
-   Drawdown chart
-   Rolling volatility
-   Risk contribution by holding

------------------------------------------------------------------------

## Correlation Analysis

Build:

-   Correlation matrix
-   Heatmap
-   Selected-stock detail
-   Correlation interpretation panel

Example:

``` text
          TCS   INFY   REL   HDFC
TCS       1.00  0.82   0.34  0.42
INFY      0.82  1.00   0.31  0.38
REL       0.34  0.31   1.00  0.61
HDFC      0.42  0.38   0.61  1.00
```

------------------------------------------------------------------------

## Stress Testing

### Scenario Types

-   Individual Stock
-   Sector Shock
-   Market Shock
-   Custom Allocation
-   Historical Event

### Scenario Builder

Inputs:

-   Asset/sector
-   Shock percentage
-   Investment amount
-   Allocation change

Example:

``` text
Asset: IT Sector
Shock: -10%

[ RUN SCENARIO ]
```

### Results

Show:

-   Current portfolio value
-   Estimated loss
-   New portfolio value
-   Portfolio impact
-   Before/after allocation
-   Before/after risk metrics

### Presets

-   Market -5%
-   Market -10%
-   IT -15%
-   Banking -20%
-   Worst Historical Month

### Deliverable

A highly technical quantitative-analysis and scenario-testing
experience.

------------------------------------------------------------------------

# Phase 4 --- AI Assistant + Reports + Settings

## Objective

Add the controlled AI feature and finish the supporting product
workflows.

------------------------------------------------------------------------

## AI Portfolio Assistant

Do NOT make this a generic ChatGPT clone.

### Interface

``` text
ARGOS ASSISTANT
Portfolio Intelligence
● CONNECTED
```

### Suggested Prompts

-   What's my current portfolio return?
-   Explain my Sharpe ratio.
-   Which stock has the highest allocation?
-   How diversified is my portfolio?
-   What is my current portfolio risk?

### Response Design

Use natural-language explanations combined with verified financial data
blocks.

Example:

``` text
Your portfolio currently has a 10.85% total return.

Portfolio Value     ₹8,42,500
Invested            ₹7,60,000
Volatility             16.4%
Sharpe Ratio            1.21
```

### AI Restrictions

Do NOT include:

-   Autonomous trading
-   Buy/sell execution
-   Stock-price predictions
-   Unverified financial claims

The AI is an explanation layer over verified ArgosQuant data.

Use mock AI responses initially.

------------------------------------------------------------------------

## Reports

Report types:

-   Portfolio Performance
-   Risk Analysis
-   Transaction History
-   Portfolio Summary

Actions:

-   View
-   Export CSV
-   Generate Report

Include report history, timestamps and status.

------------------------------------------------------------------------

## Settings

### Account

-   Name
-   Email
-   Password
-   Security

### Portfolio

-   Default portfolio
-   Base currency
-   Benchmark

### Market Data

-   Refresh frequency
-   Data source
-   Market timezone

### Appearance

-   Dark mode
-   Compact mode
-   Chart preferences

### Deliverable

Complete supporting product experience with AI assistant.

------------------------------------------------------------------------

# Phase 5 --- Polish + Backend Integration Readiness

## Objective

Turn the frontend into a cohesive, production-ready interface and
prepare it for the Java backend.

------------------------------------------------------------------------

## Visual Polish

Audit the entire application for:

-   Typography consistency
-   Spacing
-   Component sizing
-   Borders
-   Colors
-   Icons
-   Chart styling
-   Table density
-   Financial number formatting

Ensure every page feels like the same product.

------------------------------------------------------------------------

## Responsive Design

Optimize:

-   Desktop
-   Laptop
-   Tablet

Desktop is the primary experience.

Do not simply stack every desktop component vertically.

Maintain information hierarchy and usable financial tables.

------------------------------------------------------------------------

## Complete UI States

Every major feature must have:

-   Loading
-   Empty
-   Error
-   Success
-   Disabled
-   Hover
-   Focus
-   Selected

------------------------------------------------------------------------

## Navigation Audit

Verify:

-   Sidebar routes
-   Breadcrumbs
-   Stock navigation
-   Portfolio switching
-   Modals
-   Drawers
-   Back navigation
-   Search
-   Watchlist interactions

No broken routes or dead buttons.

------------------------------------------------------------------------

## Backend Integration Architecture

Create a clean frontend service/API layer for:

-   Authentication
-   Portfolio
-   Holdings
-   Transactions
-   Market data
-   Analytics
-   Risk
-   Scenarios
-   AI Assistant
-   Reports

Do NOT hard-code API calls directly inside UI components.

### Data Models

Prepare frontend types/interfaces for:

-   User
-   Portfolio
-   Stock
-   Holding
-   Transaction
-   MarketPrice
-   PortfolioMetrics
-   RiskMetrics
-   Scenario
-   AIMessage
-   Report

### Error Handling

Prepare for:

-   API failures
-   Network failures
-   Unauthorized responses
-   Empty responses
-   Invalid data
-   Retry states
-   Session expiration

### Final Deliverable

A polished, responsive frontend ready to connect to the Java backend
without major architectural changes.

------------------------------------------------------------------------

# Claude Execution Strategy

Use **one Claude session per phase** where practical.

Recommended order:

``` text
PHASE 1
Foundation + Dashboard
        ↓
PHASE 2
Portfolio + Markets
        ↓
PHASE 3
Quant Analytics + Stress Testing
        ↓
PHASE 4
AI Assistant + Reports + Settings
        ↓
PHASE 5
Polish + Backend Readiness
```

Each phase must preserve all existing work.

------------------------------------------------------------------------

# Standard Claude Prompt for Each Phase

Use this structure when starting a phase:

``` text
You are continuing development of ArgosQuant.

Read and understand the existing project before making changes.

PROJECT:
ArgosQuant — Intelligent Stock Portfolio & Risk Analytics Platform

DESIGN LANGUAGE:
Bloomberg Terminal × Modern Quant Workstation × Premium Fintech

IMPORTANT:
- Preserve the existing design system.
- Reuse existing components.
- Do not redesign completed pages unnecessarily.
- Do not introduce features outside this phase.
- Maintain the existing architecture.
- Use realistic financial mock data where backend data is unavailable.
- Prioritize consistency and functionality over adding unnecessary visual effects.

CURRENT PHASE:
[INSERT PHASE]

Implement everything specified in this phase.

Before finishing:
1. Verify the application builds.
2. Verify all routes work.
3. Check for console errors.
4. Check responsive behavior.
5. Check that existing phases were not broken.
6. Reuse components wherever possible.
7. Summarize files changed.
8. List any remaining issues.
```

------------------------------------------------------------------------

# Final Product Identity

The completed frontend should feel like:

**Bloomberg Terminal** + **Modern Quant Workstation** + **Premium
Fintech**

It should be:

-   Data-dense
-   Precise
-   Technical
-   Responsive
-   Reusable
-   Backend-ready
-   Visually consistent
-   Production-oriented

The central design principle:

> **ArgosQuant is a quantitative financial workstation, not a generic
> investment dashboard and not an AI wrapper.**
