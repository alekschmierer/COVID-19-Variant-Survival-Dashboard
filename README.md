# 🌍 COVID-19 Variant Survival Dashboard

A dynamic, interactive dashboard that visualizes survival and mortality data of global COVID-19 variants using D3.js. This tool allows users to explore country-specific variant data.

🔗 **[Live Demo on Replit](https://replit.com/@gaze4beam/FinalProjectREVISED)**

## 🔍 Project Overview

This project visualizes cleaned COVID-19 variant data using:

- **Interactive Bar Chart** – Top Variants by Mortality or Lifespan
- **Dynamic Scatter Plot** – Deaths vs. Lifespan or Mortality Rate
- **Comprehensive Heat Map** – Metrics across Variants

The three visualizations are **interconnected**, allowing users to explore patterns across countries and variants with intuitive controls and responsive filtering.

## 💡 Features

- **Country Filter** – Select any country to view variant-specific statistics
- **Data Type Toggle** – Choose between "Mortality Rate" or "Lifespan"
- **Variant Selector** – Filters scatter plot and heat map by variant
- **Linked Interactions** – Clicking a bar updates scatter plot and heat map
- **Tooltips** – Hover for contextual details in each chart

## 📊 Visualizations

| Visualization   | Description |
|-----------------|-------------|
| **Bar Chart**   | Ranks top 10 variants in a country by mortality rate or lifespan |
| **Scatter Plot**| Shows total deaths vs. selected data type (mortality or lifespan) |
| **Heat Map**    | Visualizes 5 metrics across selected country’s variants |

## ⚙️ Technologies Used

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

## 🖥️ Running Locally

Because this project loads a CSV file using `d3.csv()`, it must be run from a local web server (not directly opened as a file).

### Option : Install the "Live Server" extension in VSCode

