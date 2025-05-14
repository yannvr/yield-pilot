# 📍YieldPilot Roadmap (v5)

*CLI-native AI DeFi strategist — modular, AVS-ready, and powered by LLMs.*

---

## ⚙️ PHASE 1 — Core CLI MVP (Current)

🎯 Goal: Build CLI simulation + execution engine with net yield projection and AI-powered commentary.

### ✅ Features
- CLI app with `simulate` command (future: `exec`)
- Interactive prompts for strategy parameters
- Real-time yield calculations
- Protocol-aware strategy recommendations
- Gas + borrow cost estimation
- Net yield calculation (gross - fees)
- AI commentary per strategy
- Simple to use with JSON output option

### 🧠 Prompt
File: `strategyAgentPrompt.txt`

### 💻 Implementation
- CLI interface: `src/cli/index.js`
- Strategy analyzer: `src/analyzer/index.js`
- Protocol data: `src/protocols/index.js`
- Yield projections: `src/projections/index.js`
- Market insights: `src/insights/index.js`

## Development Principles

- CLI-first approach
- Assumes real asset execution
- Concise, helpful, and data-grounded interactions
- Avoids speculation unless explicitly flagged
- Prioritizes user safety and transparency

## Phase 1: Core Forecasting and Strategy Simulation

Focus on accurate forecasting and modular strategy simulation using real data across Ethereum protocols (Lido, Aave, Uniswap, EigenLayer wrappers like Renzo, Kelp).

- **Yearn Finance**: Integrated for yield optimization via DefiLlama API. Provides automated vault strategies (5-15% APY) as a baseline for user recommendations. No API key required. [Official Website](https://yearn.finance/)
- **Blocknative**: Planned for real-time gas estimation to factor into net yield projections. API key required and pending setup.
  - API Key Link: [https://www.blocknative.com/](https://www.blocknative.com/)
- **1inch**: Planned for swap optimization to minimize slippage in asset conversions. API key verification in progress; integration deferred until verified.
  - API Key Link: [https://1inch.io/api/](https://1inch.io/api/)
  - Status: Temporarily skipped in initial Phase 1 implementation. To be integrated in a subsequent update to enhance strategy returns.
- **Basic Insights**: Develop simple heuristic-based insights in place of advanced AI tools, using real data from DefiLlama and integrated services for market context and risk assessments. [DefiLlama Website](https://defillama.com/)

## Phase 2: Advanced Strategies and Enhanced Insights

Expand capabilities with complex strategies and advanced forecasting tools.

- **Aave + DeFi Saver**: Enable double looping strategies (10-20% APY) with automation for higher yields, incorporating robust risk analysis for leverage and liquidation thresholds. [Aave Website](https://aave.com/) | [DeFi Saver Website](https://defisaver.com/)
- **Bittensor**: Integrate for AI-driven insights and forecasting (e.g., gas prices, APYs, risks) via a Python microservice with REST API. Deferred to Phase 2 due to setup complexity. Bittensor's Finney tensor will be utilized for its specialized capabilities in financial data analysis and prediction, enhancing the accuracy of DeFi strategy simulations. [Bittensor Website](https://bittensor.com/)
  - Access Setup: Wallet and staking via [https://docs.bittensor.com/getting-started/wallet](https://docs.bittensor.com/getting-started/wallet)
- **Enhanced Risk Analysis**: Strengthen risk scoring for complex strategies, factoring in LTV, volatility, and market conditions.

## Implementation References

- CLI interface: [cli/index.js](mdc:cli/index.js)
- Strategy analyzer: [src/analyzer/index.js](mdc:src/analyzer/index.js)
- Protocol integrations: [src/protocols/](mdc:src/protocols)
- Yield projections: [src/projections/index.js](mdc:src/projections/index.js)
- AI insights module: [src/insights/index.js](mdc:src/insights/index.js)

---

## 🧱 PHASE 2 — Modular Plugin Framework (Next)

🎯 Goal: Enable extensible simulation and scoring logic via plugins

### 🔍 Key Requirements
- Protocol plugins (add new protocols easily)
- Strategy scoring plugins (customize risk/reward models)
- On-chain data plugins (price feeds, TVL, APR)
- Gas estimator plugins (improve tx cost estimation)

### 🧠 Prompt
File: `pluginPrompt.txt` (to be created)

```
You are a plugin agent in the YieldPilot ecosystem.
Your task is to interpret plugin-specific output and return commentary about risk, yield stability, protocol flags, and gas concerns.
```

---

## 🌐 PHASE 3 — Web Wizard + Shared Core

🎯 Goal: Use same logic core across CLI and Web UI

### 🔍 Key Requirements
- React-based UI for strategy visualization
- Strategy flow diagram visualization
- Shared core logic between CLI and web
- Interactive parameter adjustment
- Real-time yield comparisons

### 🧠 Prompt
File: `webStrategyPrompt.txt`

```
You are YieldPilot's front-end strategist.
Given a user-selected intent, gas budget, and risk tolerance, simulate and suggest the best routes using modular backend logic.
Return insights for each strategy with context-sensitive commentary.
```

---

## 🔄 PHASE 4 — Feedback + Reflex System

🎯 Goal: Track sim vs real outcomes and improve recommendations

### 🔍 Key Requirements
- Strategy execution tracking
- Result comparison (sim vs actual)
- Strategy improvement suggestions
- Learning from historical outcomes
- Real-time monitoring interface

### 🧠 Prompt
File: `performanceAgentPrompt.txt`

```
You are YieldPilot's audit agent.
Compare logged strategy results to their original simulation output.
Highlight deviation in yield, cost, LTV, or execution time.
Recommend changes to templates or route logic.
```

---

## 🛰 PHASE 5 — AVS Compatibility

🎯 Goal: Serve route scoring to validators and dApps via AVS endpoint

### 🔍 Key Requirements
- Strategy scoring endpoint
- Validator-ready interfaces
- Deterministic scoring system
- Multi-route comparison system
- EigenLayer native integration

### 🧠 Prompt
File: `avsAgentPrompt.txt`

```
You are YieldPilot's AVS oracle agent.
Your role is to validate or score strategy routes in a stateless, deterministic way.
Rank routes based on net yield, risk, and sustainability using precomputed metrics.
```

---

## ✳️ Prompt Rules for Consistency

To ensure all AI prompts receive full context:

1. **All simulation data must be passed as structured YAML**, using the schema in `simulationPromptSchema.yaml`
2. **Prompt engine must merge static prompt text + dynamic simulation YAML**
3. **Prompts must always include: route, LTV, net yield, gas est, APY volatility, risk flags**
4. **Prompt runners must track prompt versions in logs for auditability**
5. **No AI step should rely on raw CLI input — always use structured simulation object**

---

