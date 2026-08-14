# COVID-19 Variant Survival Dashboard

A dynamic, interactive dashboard that visualizes survival and mortality data of global COVID-19 variants using D3.js. This tool allows users to explore country-specific variant data.

## Project Overview

This project visualizes cleaned COVID-19 variant data using:

- **Interactive Bar Chart** – Top Variants by Mortality or Lifespan
- **Dynamic Scatter Plot** – Deaths vs. Lifespan or Mortality Rate
- **Comprehensive Heat Map** – Metrics across Variants

The three visualizations are **interconnected**, allowing users to explore patterns across countries and variants with intuitive controls and responsive filtering.

## Features

- **Country Filter** – Select any country to view variant-specific statistics
- **Data Type Toggle** – Choose between "Mortality Rate" or "Lifespan"
- **Variant Selector** – Filters scatter plot and heat map by variant
- **Linked Interactions** – Clicking a bar updates scatter plot and heat map
- **Tooltips** – Hover for contextual details in each chart

## Visualizations

| Visualization   | Description |
|-----------------|-------------|
| **Bar Chart**   | Ranks top 10 variants in a country by mortality rate or lifespan |
| **Scatter Plot**| Shows total deaths vs. selected data type (mortality or lifespan) |
| **Heat Map**    | Visualizes 5 metrics across selected country’s variants |

## Technologies 

### Frontend:
- **HTML5**
- **CSS3**
- **JavaScript**
- **D3.js v7**

### Data Cleaning (Python):
- `pandas`
- `numpy`
- `seaborn`
- `matplotlib.pyplot`

> Data was preprocessed and cleaned in Python, then exported to CSV for visualization.

## Live Demo

**[alekschmierer.github.io/COVID-19-Variant-Survival-Dashboard](https://alekschmierer.github.io/COVID-19-Variant-Survival-Dashboard/)**

No install, no build step, no server. D3 is vendored into the repo, so the page has no external dependencies at runtime.

## Running Locally

Serve the repo root over HTTP — `python3 -m http.server`, then open `http://localhost:8000`. (Opening `index.html` straight off the filesystem will not work: browsers block `d3.csv()` on `file://` under CORS.)

## Project Structure

```
index.html                     the page
script.js                      all three charts
style.css                      all styling
surv_variants_cleaned.csv      the cleaned dataset, loaded at runtime
d3.v7.min.js                   vendored D3 v7
Data_Cleaning_Python_Final/    the cleaning notebook and the raw CSV
Preview_Dashboard_Image.png    the screenshot above
```

