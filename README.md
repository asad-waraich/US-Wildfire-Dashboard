
# Project Description:

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project
If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing
Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building
To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Project Structure

```
wildfire-dashboard/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CauseFilter.svelte
│   │   │   ├── CausePieChart.svelte
│   │   │   ├── Map.svelte
│   │   │   ├── MonthlyBarChart.svelte
│   │   │   ├── TimeSeriesChart.svelte
│   │   │   └── YearSlider.svelte
│   ├── routes/
│   │   ├── +page.svelte
│   ├── stores/
│   │   ├── fireFilters.ts
│   │   ├── selectedState.ts
│   │   └── index.ts
│   └── data/
│       └── wildfire_clean.csv
├── static/
└── ...
```

## Components

### CauseFilter.svelte
Provides filtering options for different wildfire causes.

### CausePieChart.svelte
Displays the distribution of wildfire causes in a pie chart format.

### Map.svelte
Visualizes geographical distribution of wildfires.

### MonthlyBarChart.svelte
Shows wildfire frequency by month in a bar chart.

### TimeSeriesChart.svelte
Displays wildfire trends over time.

### YearSlider.svelte
Allows filtering of data by selecting specific years.

## State Management

The application uses Svelte stores for state management:

### fireFilters.ts
Manages filter states for the dashboard.

### selectedState.ts
Handles the currently selected state or region.

## Data

The application uses preprocessed wildfire data stored in CSV format:

### wildfire_clean.csv
Contains cleaned and processed wildfire data with attributes like location, time, cause, size, etc.

## Project Structure

```
wildfire-dashboard/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CauseFilter.svelte
│   │   │   ├── CausePieChart.svelte
│   │   │   ├── Map.svelte
│   │   │   ├── MonthlyBarChart.svelte
│   │   │   ├── TimeSeriesChart.svelte
│   │   │   └── YearSlider.svelte
│   ├── routes/
│   │   ├── +page.svelte
│   ├── stores/
│   │   ├── fireFilters.ts
│   │   ├── selectedState.ts
│   │   └── index.ts
│   └── data/
│       └── wildfire_clean.csv
├── static/
└── ...
```

## Components

### CauseFilter.svelte
Provides filtering options for different wildfire causes.

### CausePieChart.svelte
Displays the distribution of wildfire causes in a pie chart format.

### Map.svelte
Visualizes geographical distribution of wildfires.

### MonthlyBarChart.svelte
Shows wildfire frequency by month in a bar chart.

### TimeSeriesChart.svelte
Displays wildfire trends over time.

### YearSlider.svelte
Allows filtering of data by selecting specific years.

## State Management

The application uses Svelte stores for state management:

### fireFilters.ts
Manages filter states for the dashboard.

### selectedState.ts
Handles the currently selected state or region.

## Data

The application uses preprocessed wildfire data stored in CSV format:

### wildfire_clean.csv
Contains cleaned and processed wildfire data with attributes like location, time, cause, size, etc.