# 📍EigenPilot Roadmap (v5)

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
You are a plugin agent in the EigenPilot ecosystem.
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
You are EigenPilot's front-end strategist.
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
You are EigenPilot's audit agent.
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
You are EigenPilot's AVS oracle agent.
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

