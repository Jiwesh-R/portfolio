/*
 * content.js - single source of truth for all resume data.
 * Edit values here to update the site. No other file needs to change.
 */
window.CONTENT = {
  profile: {
    name: "JIWESH RAJBHANDARI",
    ticker: "JRAJ",
    title: "Data Science & Analytics / Finance",
    location: "Poughkeepsie, New York",
    phone: "845-466-9478",
    email: "jiweshrajbhandari03@gmail.com",
    linkedin: "linkedin.com/in/jiwesh-rajbhandari",
    linkedinUrl: "https://www.linkedin.com/in/jiwesh-rajbhandari",
    resume: "assets/Jiwesh_Rajbhandari_Resume.pdf",
    summary:
      "Sophomore dual-degree candidate in Data Science and Finance with hands-on " +
      "experience building Black-Scholes derivatives pricing models, Monte Carlo risk " +
      "simulations, and NLP-driven market signal pipelines. Proficient in Python, R, and " +
      "SQL; seeking summer analyst internships in quantitative research or financial analytics.",
  },

  education: [
    {
      school: "MARIST UNIVERSITY",
      location: "Poughkeepsie, NY",
      degree: "B.S. Data Science and Analytics  |  B.S. Finance",
      dates: "Aug. 2024 - May 2028",
      detail: "GPA: 3.8",
      coursework: [
        "Financial Accounting",
        "Financial Management",
        "Linear Algebra",
        "Calculus 3",
        "Intro to Data Analysis",
        "Data Mining & Predictive Analytics",
        "Macroeconomics",
        "Software Development 1",
      ],
    },
  ],

  experience: [
    {
      company: "FUSEMACHINES",
      role: "Intern",
      location: "Kathmandu, Nepal",
      dates: "Winter 2026",
      ticker: "FUSE",
      bullets: [
        "Engineered an automated NLP extraction pipeline processing 250+ unstructured documents via the Xtract Engine, converting raw text into structured datasets that accelerated downstream ML pipeline deployment.",
        "Optimized end-to-end data extraction and validation workflows, improving parsing accuracy by 10% and cutting manual review overhead by 15% across production pipelines.",
        "Developed Python-based performance dashboards and quality reports tracking extraction metrics, surfacing model-tuning insights that drove iterative product improvements.",
      ],
    },
    {
      company: "MARIST POLL",
      role: "Public Opinion Analyst",
      location: "Poughkeepsie, New York",
      dates: "Sep. 2025 - Present",
      ticker: "MPOL",
      bullets: [
        "Constructed graph neural network models on 10,000+ survey records to quantify respondent similarity, opinion clustering, and sentiment diffusion across electoral demographics.",
        "Automated Python-based reporting and visualization pipelines, reducing manual analysis time by 30% and enabling consistent weekly delivery of electoral sentiment insights to academic stakeholders.",
        "Deployed graph deep learning models to detect influential nodes and latent community structures across polling networks, enabling predictive modeling of opinion propagation at scale.",
      ],
    },
  ],

  projects: [
    {
      code: "PROJ 1",
      name: "MARKET NETWORK ANALYSIS via GRAPH NEURAL NETWORKS",
      stack: "Python, PyTorch Geometric, NetworkX, yfinance",
      dates: "2026",
      bullets: [
        "Constructed a cross-asset correlation and lead-lag network across 75+ equities spanning multiple sectors, extending graph neural network methodology from prior opinion-diffusion research into a market microstructure context.",
        "Applied node embedding and community detection to the asset network to surface influential hub securities and latent sector clusters, generating a graph-based alternative to traditional factor-correlation risk models.",
        "Benchmarked GNN-derived lead-lag signals against a rolling-correlation baseline for next-day return prediction, improving directional accuracy by 14% over the baseline.",
      ],
      // Chart: directional accuracy over time, GNN vs baseline
      chart: {
        type: "line",
        title: "NEXT-DAY DIRECTIONAL ACCURACY  |  GNN vs BASELINE",
        yLabel: "ACCURACY %",
        series: [
          {
            name: "GNN",
            color: "#3fd07a",
            points: [52, 54, 53, 57, 58, 60, 59, 62, 63, 64, 63, 65],
          },
          {
            name: "BASELINE",
            color: "#5aa9ff",
            points: [50, 51, 50, 52, 51, 52, 51, 53, 52, 51, 52, 51],
          },
        ],
        stat: "+14% DIRECTIONAL ACCURACY vs BASELINE",
      },
    },
    {
      code: "PROJ 2",
      name: "SYSTEMATIC BACKTESTING ENGINE & STAT-ARB STRATEGY",
      stack: "Python, backtrader, pandas, cvxpy",
      dates: "2026",
      bullets: [
        "Engineered a vectorized backtesting framework to evaluate systematic equity strategies against historical price data, incorporating transaction costs, slippage, and position-sizing constraints.",
        "Implemented a statistical arbitrage strategy using Engle-Granger cointegration testing to identify mean-reverting equity pairs, achieving a Sharpe ratio of 0.9 and max drawdown of 15% across the backtest window.",
        "Layered a mean-variance portfolio optimization module on top of strategy signals to convert raw alpha into risk-adjusted position sizes under sector and turnover constraints.",
      ],
      // Chart: simulated equity curve
      chart: {
        type: "line",
        title: "STRATEGY EQUITY CURVE  |  GROWTH OF $100",
        yLabel: "NAV",
        series: [
          {
            name: "STRATEGY",
            color: "#3fd07a",
            points: [100, 104, 101, 107, 112, 108, 115, 111, 119, 124, 121, 128],
          },
          {
            name: "SPY",
            color: "#5aa9ff",
            points: [100, 102, 103, 101, 104, 106, 105, 107, 108, 109, 110, 112],
          },
        ],
        stat: "SHARPE 0.90  |  MAX DD -15%",
      },
    },
  ],

  // Skills become "securities" in the live ticker. base = starting price.
  skills: {
    Languages: [
      { sym: "PYTHON", base: 342.5 },
      { sym: "R", base: 128.4 },
      { sym: "SQL", base: 210.7 },
      { sym: "JAVA", base: 96.2 },
      { sym: "JS", base: 88.5 },
    ],
    "Python Libs": [
      { sym: "NUMPY", base: 154.3 },
      { sym: "SCIPY", base: 132.9 },
      { sym: "PANDAS", base: 176.8 },
      { sym: "SKLEARN", base: 145.6 },
      { sym: "TENSORFLOW", base: 201.4 },
      { sym: "MATPLOTLIB", base: 98.7 },
    ],
    "Finance / Quant": [
      { sym: "BLKSCHOLES", base: 415.9 },
      { sym: "MONTECARLO", base: 388.2 },
      { sym: "GREEKS", base: 267.5 },
      { sym: "ALPHAFCTR", base: 305.1 },
      { sym: "BACKTRADER", base: 233.8 },
      { sym: "STATARB", base: 289.4 },
      { sym: "COINTEGR", base: 174.2 },
      { sym: "CVXPY", base: 152.6 },
      { sym: "PYG", base: 342.0 },
      { sym: "YFINANCE", base: 121.3 },
      { sym: "TABLEAU", base: 143.7 },
    ],
    "Dev Tools": [
      { sym: "VSCODE", base: 187.4 },
      { sym: "ECLIPSE", base: 76.5 },
      { sym: "GITHUB", base: 256.9 },
      { sym: "JENKINS", base: 133.2 },
      { sym: "GCP", base: 298.6 },
      { sym: "AWS", base: 356.8 },
      { sym: "LMSTUDIO", base: 112.4 },
      { sym: "LINUX", base: 244.1 },
      { sym: "MYSQL", base: 168.9 },
      { sym: "EXCEL", base: 95.3 },
    ],
  },
};
