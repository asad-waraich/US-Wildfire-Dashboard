# 🔥 US Wildfire Visualization Dashboard

_Exploring Wildfire Patterns Across America (2004–2015)_  
By Muhammad Salman & Asad Ullah Waraich

[🌐 Dashboard Link](https://569ca5ff.us-wildfires.pages.dev)

---

## 🧭 Overview

This interactive dashboard enables users to **explore trends, causes, and spatial patterns** in U.S. wildfire data from **2004 to 2015**. Featuring dynamic D3.js-based visualizations and built with SvelteKit, the dashboard serves researchers, policymakers, and the public in understanding the growing wildfire crisis.

---

## 🎯 Motivation

> “Over 61% of wildfires occurred after 2000.”  
> With wildfires becoming more frequent and intense, there is a critical need for **accessible, interactive tools** to support:

- 🔬 **Researchers** – studying environmental patterns and climate change
- 🧑‍⚖️ **Policy Makers** – designing fire prevention and mitigation strategies
- 🚒 **First Responders** – identifying high-risk seasons and areas
- 🧑‍🤝‍🧑 **General Public** – understanding fire-prone regions

---

## 🔍 Key Questions Explored

- Do **human-caused** wildfires peak more on **weekends** vs. natural ones?
- Are **large wildfires** more frequent in **July or August**?
- Do **western states** like CA & OR see **larger fires** than eastern ones?
- Which **causes** show spikes in **specific years or months**?
- How do **cause, size, and duration** interact across seasons?

---

## 📊 Features

- 🗺️ **Interactive US Map** – Filter wildfires by size and duration
- 📈 **Time Series Chart** – Trends by cause over quarters
- 🥧 **Cause Distribution** – Pie chart of wildfire causes
- 📅 **Monthly Trends** – Bar chart by month (aggregated over years)
- 📍 **Cause & Year Filters** – Drill down into custom data views
- 📎 **Tooltip Summaries** – Rich insights on hover

---

## 🖼️ Screenshots

### 🧯 Final Dashboard View

![Wildfire Dashboard Screenshot](/static/Final-Dashboard.png)

---

## 🗂️ Dataset

- Source: Kaggle ([US Wildfires Dataset](https://www.kaggle.com/datasets/))
- Cleaned to cover **74,154 wildfire records** from **2004–2015**
- Features include:
  - Date of discovery & containment
  - State, county, coordinates
  - Cause, duration, and fire size (in acres)

---

## 🛠️ Tech Stack

| Category      | Tools Used                 |
| ------------- | -------------------------- |
| Framework     | SvelteKit                  |
| Visualization | D3.js                      |
| Language      | TypeScript                 |
| Styling       | Tailwind CSS               |
| Build Tool    | Vite                       |
| Deployment    | Cloudflare Pages / Netlify |

---

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/wildfire-dashboard.git
cd wildfire-dashboard
npm install

npm run dev
npm run build
npm run preview


wildfire-dashboard/
├── src/
│   ├── lib/components/
│   │   ├── Map.svelte
│   │   ├── TimeSeriesChart.svelte
│   │   ├── MonthlyBarChart.svelte
│   │   ├── CausePieChart.svelte
│   │   ├── YearSlider.svelte
│   │   └── CauseFilter.svelte
│   ├── routes/+page.svelte
│   ├── stores/
│   └── data/wildfire_clean.csv
├── static/
│   └── Final-Dashboard.png
```

---

## ⚙️ State Management

The application uses [Svelte stores](https://svelte.dev/docs/svelte-store) to manage shared state across components:

- `fireFilters.ts` – Manages active filters (cause, year range, fire size).
- `selectedState.ts` – Stores the currently selected U.S. state for zooming or highlighting.

---

## 🎨 Visual Design & Encodings

| Visual Channel   | What It Encodes                              |
|------------------|-----------------------------------------------|
| **Position**      | Geographic coordinates / Time in timeline     |
| **Color (Hue)**   | Wildfire cause or selected highlights         |
| **Size**          | Burned area (acres) – circle size on map      |
| **Intensity**     | Fire duration – represented via color scale   |
| **Texture**       | Line styles to differentiate "Total" vs specific causes |

These channels are carefully chosen for clarity and insight, following principles of perceptual effectiveness and redundancy.

---

## 🧩 Future Improvements

- 🧭 **Dashboard Walkthrough**
  Integrate in-app onboarding or fine-tuned LLMs for guidance.

- ⏱️ **Finer Granularity Controls**
  Toggle between monthly, weekly, or quarterly visualizations.

- 🌎 **State-Specific Drilldowns**
  Enable zoomable views with detailed stats per state.

- 🌐 **Multi-Year Heatmaps**
  Introduce spatio-temporal heatmaps for long-term climate pattern visualization.

---

## 🤝 Contributing

Contributions are welcome!

If you’d like to improve the dashboard, fix a bug, or propose a new feature:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Create a Pull Request

Please check for open issues before starting new work, and follow our code formatting conventions.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
You are free to use, modify, and distribute this software for personal and commercial purposes.

---
```
