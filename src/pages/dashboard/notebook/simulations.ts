export const CHART_COLORS = ['#0E50F6','#10B981','#F43F5E','#F59E0B','#8B5CF6','#06B6D4','#EC4899','#14B8A6'];

export const SAMPLE_DATA = {
  name: 'customers.csv',
  meta: 'Uploaded 2h ago · 15 columns',
  stats: ['12,847 rows', '2.3 MB'],
  tables: [
    { name: '📊 customers.csv', type: 'csv', meta: 'Uploaded 2h ago · 15 columns', stats: ['12,847 rows','2.3 MB'] },
    { name: '🐘 PostgreSQL', type: 'db', meta: 'prod-db · transactions', stats: ['Live','1.2M rows'] },
  ],
};

export const PINNED = [
  { label: 'Churn rate 23.4% → up 4.2%', type: '📊 Trend insight' },
  { label: 'Contract type drives 67% of churn', type: '🔍 Correlation' },
  { label: 'High-value segment at risk', type: '⚠️ Alert' },
  { label: 'Fiber users churn 2.1x more', type: '📈 Comparison' },
];

export interface CellData {
  id: string;
  num: number;
  prompt: string;
  label: string;
  status: 'idle'|'running'|'complete';
  thinking: string[];
  thinkingOpen: boolean;
  plan: string[];
  codeBlocks: { lang: string; label: string; code: string }[];
  stats: { label: string; value: string; color: string; delta: string; deltaColor: string }[];
  charts: {
    title: string;
    sub: string;
    id: string;
    type: 'bar' | 'line' | 'area' | 'horizontal-bar';
    pinned?: boolean;
    pinnedItemId?: string;
  }[];
  chartData: Record<string, any>;
  insights: {
    icon: string;
    color: string;
    title: string;
    text: string;
    pinned: boolean;
    pinnedItemId?: string;
  }[];
  summary?: { paragraphs: string[]; highlights?: { label: string; value: string; color: string }[]; suggestedPrompts: string[] };
  tableData?: { headers: string[]; rows: any[][] };
  qualityScore?: string;
  execMsg: string;
  execTime: string;
}

export const CELL_1: CellData = {
  id: 'cell-1', num: 1, status: 'complete',
  prompt: 'Show me a preview of the customers dataset and give me a quick profile of the data quality',
  label: 'Data Preview', thinkingOpen: true,
  thinking: [
    'The user wants a data preview — I should load the dataset and examine its structure first.',
    "I'll check column types: likely mix of categorical (contract_type, payment_method) and numeric (tenure, monthly_charges, total_charges).",
    'Data quality check: null values, duplicates, outliers in numeric columns, cardinality of categoricals.',
    'TotalCharges might have whitespace issues — common in telecom datasets. Check before casting to float.',
    "Churn column is likely binary (Yes/No) — will verify class distribution as well.",
    "Will use pandas profiling approach: shape, dtypes, describe(), isnull().sum(), value_counts for target.",
    'Ready to generate clean summary with quality score and actionable notes.',
  ],
  plan: ['Load dataset and inspect shape','Profile column types and cardinality','Check null values and data quality','Render interactive preview table'],
  codeBlocks: [{
    lang: 'PYTHON', label: 'pandas · data profiling',
    code: `import pandas as pd\nimport numpy as np\n\n# Load dataset\ndf = pd.read_csv('customers.csv')\n\n# Fix common TotalCharges whitespace issue\ndf['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')\n\n# Data quality profile\nquality_report = {\n    'shape': df.shape,\n    'nulls': df.isnull().sum().to_dict(),\n    'duplicates': df.duplicated().sum(),\n    'churn_rate': (df['Churn'] == 'Yes').mean() * 100\n}\n\nprint(df.head(5))\nprint(df.describe())\nprint(f"Quality Score: {98}%")`
  }],
  stats: [],
  charts: [], chartData: {},
  insights: [],
  summary: {
    paragraphs: [
      'Your customers dataset is in excellent shape. I profiled **12,847 rows** across **15 columns** and found a quality score of **98/100** — one of the cleanest telecom datasets I\'ve seen. The only issue is **11 null values** in the `TotalCharges` column, likely from new customers with no billing history yet.',
      'The dataset contains a healthy mix of **categorical features** (contract type, payment method, internet service) and **numeric features** (tenure, monthly charges, total charges). The target variable `Churn` is binary (Yes/No) with a class distribution of roughly **73.5% No / 26.5% Yes** — imbalanced but workable.',
      'I noticed that customers with very short tenure (1–2 months) consistently appear in the churned group in this preview. This is worth investigating further with a proper segment analysis.',
    ],
    highlights: [
      { label: 'Quality Score', value: '98/100', color: '#10B981' },
      { label: 'Null Values', value: '11 (TotalCharges)', color: '#F59E0B' },
      { label: 'Churn Rate', value: '26.5%', color: '#F43F5E' },
    ],
    suggestedPrompts: [
      'Analyze the overall churn rate and break it down by contract type',
      'Which customer segments have the highest lifetime value?',
      'Show me the distribution of monthly charges across churn groups',
    ]
  },
  tableData: {
    headers: ['CustomerID','Gender','Tenure','Contract','MonthlyCharges','TotalCharges','InternetService','Churn'],
    rows: [
      ['7590-VHVEG','Female','1','Month-to-month','$29.85','$29.85','DSL','Yes'],
      ['5575-GNVDE','Male','34','Two year','$56.95','$1,889.50','DSL','No'],
      ['3668-QPYBK','Male','2','Month-to-month','$53.85','$108.15','DSL','Yes'],
      ['7795-CFOCW','Male','45','One year','$42.30','$1,840.75','No internet','No'],
      ['9237-HQITU','Female','2','Month-to-month','$70.70','$151.65','Fiber optic','Yes'],
    ]
  },
  qualityScore: '98/100',
  execMsg: 'Executed successfully · 12,847 rows profiled',
  execTime: '0.34s',
};

export const CELL_2: CellData = {
  id: 'cell-2', num: 2, status: 'complete',
  prompt: 'Analyze the overall churn rate, break it down by contract type, and show me how tenure correlates with churn. I want to understand which customer segments are leaving the most.',
  label: 'Churn Rate Analysis', thinkingOpen: false,
  thinking: [
    'Multi-dimensional churn analysis required. I need: overall rate, contract breakdown, and tenure correlation.',
    'Contract type will likely show strong signal — month-to-month contracts have lowest switching cost.',
    "Tenure correlation: new customers (0-12 months) typically churn most. I'll create tenure buckets.",
    'Will compute churn rate per segment = churned_customers / total_customers in segment × 100.',
    'Best visualization: grouped bar for contract types, line chart for tenure buckets showing churn rate decay.',
  ],
  plan: [
    'Calculate overall churn rate and summary stats',
    'Group by ContractType → compute segment churn rates',
    'Bin tenure into 6-month buckets → churn trend line',
    'Run chi-squared test for statistical significance',
    'Render dual-chart visualization',
  ],
  codeBlocks: [
    { lang: 'SQL', label: 'PostgreSQL · segment analysis', code: `SELECT\n    contract_type,\n    COUNT(*) AS total_customers,\n    SUM(CASE WHEN churn = 'Yes' THEN 1 ELSE 0 END) AS churned,\n    ROUND(\n        SUM(CASE WHEN churn = 'Yes' THEN 1.0 ELSE 0 END) /\n        COUNT(*) * 100, 2\n    ) AS churn_rate_pct\nFROM customers\nGROUP BY contract_type\nORDER BY churn_rate_pct DESC;` },
    { lang: 'PYTHON', label: 'scipy · chi-squared significance test', code: `from scipy.stats import chi2_contingency\n\n# Create tenure buckets (6-month intervals)\ndf['TenureBucket'] = pd.cut(df['tenure'],\n    bins=[0,6,12,24,36,48,72],\n    labels=['0-6m','6-12m','1-2yr','2-3yr','3-4yr','4-6yr'])\n\n# Churn rate by tenure bucket\ntenure_churn = df.groupby('TenureBucket')['Churn'].apply(\n    lambda x: (x == 'Yes').mean() * 100).reset_index()\n\n# Statistical significance test\ncontingency = pd.crosstab(df['Contract'], df['Churn'])\nchi2, p_val, dof, _ = chi2_contingency(contingency)\nprint(f"χ² = {chi2:.2f}, p = {p_val:.2e} → Highly significant (p < 0.001)")` },
  ],
  stats: [
    { label: 'Overall Churn', value: '26.5%', color: '#F43F5E', delta: '↑ 4.2% vs Q2', deltaColor: '#F43F5E' },
    { label: 'Month-to-Month', value: '42.7%', color: '#F43F5E', delta: 'Highest risk', deltaColor: '#F43F5E' },
    { label: 'Two Year Contract', value: '2.8%', color: '#10B981', delta: '↓ Lowest risk', deltaColor: '#10B981' },
    { label: 'New Customer Risk', value: '58.3%', color: '#F59E0B', delta: '0–6 months tenure', deltaColor: '#64748b' },
  ],
  charts: [
    { title: 'Churn Rate by Contract Type', sub: 'Month-to-month customers churn at 15× the rate of 2-year contract holders · χ² = 1847.3, p < 0.001', id: 'contractChart', type: 'bar' },
    { title: 'Churn Rate by Customer Tenure', sub: 'New customers (0–6 months) show critically high churn — drops sharply after 12 months commitment', id: 'tenureChart', type: 'area' },
  ],
  chartData: {
    contractChart: {
      data: [
        { name: 'Month-to-month', rate: 42.7 },
        { name: 'One year', rate: 11.3 },
        { name: 'Two year', rate: 2.8 },
      ],
      colors: ['#F43F5E','#0E50F6','#10B981'],
    },
    tenureChart: {
      data: [
        { name: '0–6m', rate: 58.3 },
        { name: '6–12m', rate: 37.1 },
        { name: '1–2yr', rate: 22.8 },
        { name: '2–3yr', rate: 14.4 },
        { name: '3–4yr', rate: 9.2 },
        { name: '4–6yr', rate: 6.1 },
      ],
    },
  },
  insights: [
    { icon: '🚨', color: 'rose', title: 'Critical: Month-to-Month Contract Churn Crisis', text: '42.7% of month-to-month customers churned in Q3 — up 6.1pp from Q2. This segment represents 55% of your customer base but is hemorrhaging revenue. The statistical signal is overwhelmingly strong (χ² = 1847, p < 0.001). Immediate intervention required: consider targeted annual contract upgrade incentives with a 2–3 month free offer.', pinned: false },
    { icon: '⚠️', color: 'amber', title: 'New Customer Cliff: 58% Leave in First 6 Months', text: 'The first 6-month window is your highest-risk period. Customers who survive past 12 months show dramatically improved retention (churn drops to 18.4%). This suggests an onboarding or value-realization failure. A structured 90-day engagement program could significantly impact long-term LTV.', pinned: false },
    { icon: '💡', color: 'blue', title: 'Contract Upgrade Strategy Could Reduce Churn by ~31%', text: 'If 30% of month-to-month customers were converted to annual contracts, modeled churn rate would drop from 26.5% to approximately 18.3% — saving an estimated $2.4M in annual revenue based on average LTV of $1,847 per customer.', pinned: false },
    { icon: '✅', color: 'emerald', title: 'Long-tenure Customers Are Your Strongest Asset', text: 'Customers with 4–6 years tenure show only 6.1% churn — a 9× improvement over new customers. These high-loyalty segments likely represent your most profitable cohort.', pinned: true },
  ],
  summary: {
    paragraphs: [
      'I ran a multi-dimensional churn analysis across your **12,847 customers** using both SQL aggregation and Python statistical testing. The results paint a clear picture: **contract type is the single strongest predictor of churn**, and your business has a significant retention problem concentrated in a specific, identifiable segment.',
      'Your overall churn rate sits at **26.5%** — up 4.2 percentage points from Q2. But this headline number masks a dramatic disparity: month-to-month customers churn at **42.7%** while two-year contract holders churn at just **2.8%**. That\'s a **15× difference**, and it\'s statistically ironclad (χ² = 1847, p < 0.001).',
      'The tenure analysis reveals something equally important: **58.3% of customers leave within their first 6 months**. After that, retention improves dramatically — dropping to 6.1% for customers with 4+ years. This tells us your onboarding experience is failing to deliver enough value fast enough to justify the price.',
      'The bottom line: you don\'t have a company-wide churn problem — you have a **contract structure problem** and an **onboarding problem**. Fix those two things and the model suggests churn could drop by ~31%, saving approximately **$2.4M annually**.',
    ],
    highlights: [
      { label: 'Churn Rate', value: '26.5% (+4.2pp)', color: '#F43F5E' },
      { label: 'Highest Risk', value: 'Month-to-month: 42.7%', color: '#F43F5E' },
      { label: 'Potential Savings', value: '$2.4M/year', color: '#10B981' },
    ],
    suggestedPrompts: [
      'Which internet service type has the highest churn rate?',
      'Build a churn prediction model and show feature importance',
      'Calculate the revenue impact if we reduce churn by 10%',
      'Show me the payment method breakdown for churned customers',
    ]
  },
  execMsg: 'Analysis complete · SQL + Python · Chi-squared significance confirmed',
  execTime: '1.87s',
};

export const INTERNET_ANALYSIS: Omit<CellData, 'id'|'num'|'prompt'|'label'|'status'> = {
  thinkingOpen: false,
  thinking: [
    "User wants to compare churn rates across internet service types — DSL, Fiber optic, and No internet.",
    "I'll query both sources. PostgreSQL has the full transaction history.",
    "Fiber optic is typically the newest and most competitive — expect higher churn.",
    "Statistical tests: ANOVA to confirm if differences are significant.",
    "Key insight: Fiber optic customers likely pay more → higher revenue at risk.",
  ],
  plan: [
    'Query segment counts and churn rates by internet service',
    'Calculate revenue at risk (churn_count × avg monthly × 12)',
    'Run ANOVA test across 3 groups for significance',
    'Render comparison bar chart + revenue impact',
    'Generate actionable insights',
  ],
  codeBlocks: [
    { lang: 'SQL', label: 'PostgreSQL · segment analysis', code: `SELECT\n    internet_service,\n    COUNT(*) AS customers,\n    SUM(CASE WHEN churn = 'Yes' THEN 1 ELSE 0 END) AS churned,\n    ROUND(AVG(monthly_charges),2) AS avg_monthly,\n    ROUND(SUM(CASE WHEN churn='Yes'\n      THEN monthly_charges*12 ELSE 0 END),2) AS annual_revenue_at_risk\nFROM customers\nGROUP BY internet_service\nORDER BY churn_rate DESC;` },
    { lang: 'PYTHON', label: 'scipy · ANOVA significance test', code: `from scipy.stats import f_oneway\n\ngroups = [\n    df[df['InternetService'] == svc]['ChurnBinary']\n    for svc in ['Fiber optic', 'DSL', 'No']\n]\n\nf_stat, p_val = f_oneway(*groups)\nprint(f"F({len(groups)-1},{len(df)-len(groups)}) = {f_stat:.2f}, p = {p_val:.2e}")` },
  ],
  stats: [
    { label: 'Fiber Optic Churn', value: '41.9%', color: '#F43F5E', delta: 'Highest risk', deltaColor: '#F43F5E' },
    { label: 'DSL Churn', value: '19.0%', color: '#F59E0B', delta: 'Moderate', deltaColor: '#64748b' },
    { label: 'No Internet', value: '7.4%', color: '#10B981', delta: 'Lowest risk', deltaColor: '#10B981' },
    { label: 'Revenue at Risk', value: '$4.1M', color: '#F43F5E', delta: 'Annual (Fiber)', deltaColor: '#64748b' },
  ],
  charts: [{ title: 'Churn Rate by Internet Service', sub: 'Fiber optic customers churn at 5.7× the rate of non-internet customers · ANOVA F(2,12844) = 892.3, p < 0.001', id: 'internetChart', type: 'bar' }],
  chartData: {
    internetChart: {
      data: [
        { name: 'Fiber optic', rate: 41.9, avg: 83.4 },
        { name: 'DSL', rate: 19.0, avg: 48.8 },
        { name: 'No internet', rate: 7.4, avg: 21.2 },
      ],
      colors: ['#F43F5E','#F59E0B','#10B981'],
    },
  },
  insights: [
    { icon: '🔥', color: 'rose', title: 'Fiber Optic: Most Profitable Segment is Also Most Vulnerable', text: "Fiber optic customers pay $83.44/month — 71% more than DSL ($48.82) — yet churn at 41.9%. $4.1M annual revenue is at risk. Likely cause: tech-savvy, price-sensitive customers willing to switch.", pinned: false },
    { icon: '💡', color: 'blue', title: 'Fiber + Month-to-Month is Your Highest Risk Combination', text: 'Customers with Fiber AND month-to-month contracts show 63.7% churn — ~1,240 customers representing $1.24M annual risk. A targeted loyalty offer (15% discount on annual) could prevent $870K in losses.', pinned: false },
    { icon: '✅', color: 'emerald', title: 'No-Internet Customers: Unexpectedly Sticky', text: "Only 7.4% churn. Likely on bundled voice/TV plans with limited alternatives. This 'accidental loyalty' pattern suggests multi-service bundles dramatically increase switching costs.", pinned: false },
  ],
  summary: {
    paragraphs: [
      'I compared churn behavior across your three internet service segments and ran an ANOVA significance test. The differences are **massive and statistically undeniable** (F = 892.3, p < 0.001).',
      'Your **Fiber optic** customers are your most valuable — paying **$83.44/month** on average — but also your most volatile at **41.9% churn**. That\'s **$4.1M in annual revenue** walking out the door. DSL customers are more moderate at 19%, while customers with no internet service barely churn at all (7.4%).',
      'The most dangerous combination in your data is **Fiber optic + month-to-month contracts**, with a staggering **63.7% churn rate**. There are approximately 1,240 customers in this segment right now. A targeted retention campaign here would have the highest ROI of any intervention you could run.',
    ],
    suggestedPrompts: [
      'What\'s the average tenure of fiber optic customers who churned vs. stayed?',
      'Show me a cohort analysis of fiber optic signups over the last 12 months',
      'Build a revenue impact model for a 15% fiber optic loyalty discount',
    ]
  },
  execMsg: 'SQL + Python · ANOVA significance confirmed · 3 segments analyzed',
  execTime: '1.12s',
  tableData: undefined, qualityScore: undefined,
};

export const ML_ANALYSIS: Omit<CellData, 'id'|'num'|'prompt'|'label'|'status'> = {
  thinkingOpen: false,
  thinking: [
    'Building a churn prediction model — binary classification task.',
    'Feature selection: tenure, monthly charges, contract type, internet service, payment method.',
    "Tree-based models work best — Random Forest gives feature importance without much preprocessing.",
    'Train/test split: 80/20 stratified to maintain churn class balance.',
    "Evaluation: ROC-AUC primary metric. Feature importance is the core business answer.",
  ],
  plan: [
    'Encode categorical features (OrdinalEncoder + OneHot)',
    'Stratified 80/20 train/test split',
    'Train Random Forest classifier (n_estimators=200)',
    'Evaluate: ROC-AUC, Precision, Recall, F1',
    'Extract and rank feature importances',
  ],
  codeBlocks: [{ lang: 'PYTHON', label: 'scikit-learn · Random Forest', code: `from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import roc_auc_score\n\nfeatures = ['tenure','MonthlyCharges','TotalCharges',\n            'Contract_encoded','InternetService_encoded',\n            'PaymentMethod_encoded','SeniorCitizen']\n\nX = df[features]\ny = (df['Churn'] == 'Yes').astype(int)\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, stratify=y, random_state=42)\n\nclf = RandomForestClassifier(n_estimators=200, max_depth=12)\nclf.fit(X_train, y_train)\n\ny_prob = clf.predict_proba(X_test)[:, 1]\nauc = roc_auc_score(y_test, y_prob)\nprint(f"ROC-AUC: {auc:.4f}")  # → 0.8634` }],
  stats: [
    { label: 'ROC-AUC', value: '0.863', color: '#10B981', delta: 'Excellent', deltaColor: '#10B981' },
    { label: 'Precision', value: '0.761', color: '#0E50F6', delta: 'Churn class', deltaColor: '#64748b' },
    { label: 'Recall', value: '0.548', color: '#F59E0B', delta: 'Churn class', deltaColor: '#64748b' },
    { label: 'Accuracy', value: '80.4%', color: '#10B981', delta: 'Test set', deltaColor: '#10B981' },
  ],
  charts: [{ title: 'Feature Importance — What Drives Churn?', sub: 'Random Forest (200 trees) · ranked by mean decrease in impurity', id: 'featureChart', type: 'horizontal-bar' }],
  chartData: {
    featureChart: {
      data: [
        { name: 'Contract type', value: 0.312 },
        { name: 'Tenure', value: 0.248 },
        { name: 'Monthly charges', value: 0.187 },
        { name: 'Total charges', value: 0.094 },
        { name: 'Internet service', value: 0.071 },
        { name: 'Payment method', value: 0.052 },
        { name: 'Senior citizen', value: 0.036 },
      ],
      colors: ['#F43F5E','#0E50F6','#0E50F6','#64748b','#64748b','#64748b','#64748b'],
    },
  },
  insights: [
    { icon: '🎯', color: 'blue', title: 'Contract Type is the #1 Churn Driver (Importance: 0.312)', text: 'Contract type alone explains 31.2% of the model\'s predictive power. Month-to-month customers are 9.7× more likely to be flagged as high churn risk.', pinned: false },
    { icon: '📊', color: 'amber', title: 'Tenure + Monthly Charges Predict 49% of Variance', text: 'Short-tenure + high monthly charges = highest risk. Flag any customer with <6 months tenure AND >$65/month for proactive outreach — 73% churn probability.', pinned: false },
    { icon: '🤖', color: 'violet', title: 'Model Ready for Production — AUC 0.863', text: 'At 0.40 threshold: 54.8% recall, 76.1% precision. Weekly churn scoring could reduce churn 8–12% in Q1.', pinned: false },
  ],
  summary: {
    paragraphs: [
      'I trained a **Random Forest classifier** with 200 estimators on your customer data and achieved an **ROC-AUC of 0.863** — that\'s a strong, production-ready model. Here\'s what the machine learning tells us that the descriptive analysis couldn\'t.',
      '**Contract type is the undisputed #1 churn predictor**, explaining 31.2% of the model\'s decision-making power. Tenure (24.8%) and monthly charges (18.7%) round out the top three. Together, these three features account for **74.7% of the model\'s predictive ability** — meaning churn is highly explainable and therefore highly preventable.',
      'The model identifies a critical risk profile: **customers with < 6 months tenure paying > $65/month** are scored at a **73% churn probability**. This is your highest-leverage intervention target. At a classification threshold of 0.40, the model catches 54.8% of churners with 76.1% precision — a strong starting point for automated weekly scoring.',
      'My recommendation: deploy this model for **weekly batch scoring** and route any customer above the 0.40 threshold to your retention team. Based on the numbers, this could **reduce churn by 8–12% in the first quarter** alone.',
    ],
    highlights: [
      { label: 'Model Performance', value: 'AUC 0.863', color: '#10B981' },
      { label: 'Top Feature', value: 'Contract type (31.2%)', color: '#0E50F6' },
      { label: 'Projected Impact', value: '-8–12% churn in Q1', color: '#10B981' },
    ],
    suggestedPrompts: [
      'Score all current customers and show me the top 100 highest risk',
      'What would the confusion matrix look like at a 0.35 threshold?',
      'Run a SHAP analysis to explain individual predictions',
      'Compare this model against XGBoost performance',
    ]
  },
  execMsg: 'Model trained · ROC-AUC: 0.8634 · 200 estimators',
  execTime: '4.23s',
  tableData: undefined, qualityScore: undefined,
};

export function matchAnalysis(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes('predict') || p.includes('model') || p.includes('ml') || p.includes('feature'))
    return ML_ANALYSIS;
  return INTERNET_ANALYSIS;
}
