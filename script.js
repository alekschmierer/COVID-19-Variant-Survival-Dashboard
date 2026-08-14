//The palette lives in style.css and is read back here, so there is one copy of
//it rather than two that drift apart.
const cssTokens = getComputedStyle(document.documentElement);
const token = (name) => cssTokens.getPropertyValue(name).trim();

const theme = {
  series1: token("--series-1"),
  muted: token("--text-muted"),
  surface: token("--surface"),
  metricHues: [
    token("--metric-1"),
    token("--metric-2"),
    token("--metric-3"),
    token("--metric-4"),
    token("--metric-5"),
  ],
};

/* A sequential ramp for a dark surface has to run dark -> bright. The usual
   light -> dark ramps invert here: the largest values sink into the background
   and the smallest ones glow, which is the reading backwards.

   Built in Lab from the row's own hue so lightness climbs monotonically and the
   top of the ramp lands exactly on the validated categorical step — the colour
   a full-strength cell is meant to read as. The bottom keeps a trace of the hue
   rather than going neutral, so a near-zero cell still belongs to its row. */
function darkRamp(hex) {
  const top = d3.lab(hex);
  const bottom = d3.lab(18, top.a * 0.3, top.b * 0.3);
  return d3.interpolateLab(bottom, top);
}

//Load CSV file using d3.csv
d3.csv("surv_variants_cleaned.csv", d3.autoType).then((data) => {
  //Define margin convention
  const width = 400;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 100, left: 80 };

  //Create SVG and Group
  //Every chart is drawn against a fixed 400x400 user space, but the CSS
  //stretches the SVG to fill its column. Without a viewBox the user space is
  //1:1 with rendered pixels, so the drawing stays 400 units wide and the rest
  //of the element is dead space. The viewBox maps those 400 units onto
  //whatever width the element actually gets.
  const setUpSvg = (selector) =>
    d3
      .select(selector)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

  const barSvg = setUpSvg("#barChartSVG");
  const barChartGroup = barSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const scatterplotSVG = setUpSvg("#scatterplotSVG");
  const scatterPlotGroup = scatterplotSVG
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const heatMapSvg = setUpSvg("#heatMapSVG");
  const heatMapGroup = heatMapSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  //Create chartDimensions, so that the chart fits in the SVG space
  const chartDimWidth = width - margin.left - margin.right;
  const chartDimHeight = height - margin.top - margin.bottom;

  //Create variables to store data for filters, also set up x and y
  const countries = [...new Set(data.map((d) => d.Country))].sort();
  const variants = [...new Set(data.map((d) => d.variant))].sort();
  let variantSelection = "21F.Iota";
  let countrySelection = "Afghanistan";
  let dataTypeSelection = "mortality_rate";

  //Set up country selection from data
  const selectionOptionsCountry = d3
    .select("#countrySelection")
    .selectAll("option")
    .data(countries)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);
  const selectionOptionsVariant = d3
    .select("#variantSelection")
    .selectAll("option")
    .data(variants)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);
  updateSelectionOptionsVariant();

  //Listen for changes with the filter: Select Country
  d3.select("#countrySelection").on("change", function () {
    countrySelection = this.value;
    updateSelectionOptionsVariant();
    variantSelection = d3.select("#variantSelection").property("value");
    updateBarChart();
    updateScatterPlot();
    updateHeatMap();
  });

  //Listen for changes with the filter: Select Type Of Data
  d3.select("#dataTypeSelection").on("change", function () {
    dataTypeSelection = this.value;
    updateBarChart();
    updateScatterPlot();
    updateHeatMap();
  });

  //Listen for changes with the filter: Variants
  d3.select("#variantSelection").on("change", function () {
    variantSelection = this.value;
    updateScatterPlot();
    updateHeatMap();
    updateSelectionOptionsVariant();
  });

  function updateSelectionOptionsVariant() {
    d3.select("#variantSelection").selectAll("option").remove();
    const variantsInCountries = [
      ...new Set(
        data.filter((d) => d.Country === countrySelection).map((d) => d.variant)
      ),
    ].sort();
    const selectedVariantOption = d3
      .select("#variantSelection")
      .selectAll("option")
      .data(variantsInCountries);
    selectedVariantOption
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);
  }

  function updateBarChart() {
    const dataSelectionVar = dataTypeSelection;

    const topRates = data
      .filter((d) => d.Country === countrySelection)
      .sort((a, b) => b[dataSelectionVar] - a[dataSelectionVar])
      .slice(0, 10);

    const maxValue = d3.max(topRates, (d) => d[dataSelectionVar]);
    const xScales = d3
      .scaleBand()
      .domain(topRates.map((d) => d.variant))
      .range([0, chartDimWidth])
      .padding(0.1);

    const yScales = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([chartDimHeight, 0]);

    //Remove old bar chart elements
    barChartGroup.selectAll("*").remove();

    //Add the x and y axes
    const xAxis = d3.axisBottom(xScales);
    const yAxis = d3.axisLeft(yScales);

    barChartGroup
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${chartDimHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("dx", "-4.2em")
      .attr("dy", "1.2em")
      .style("font-family", "Arial");

    barChartGroup.append("g").attr("class", "y-axis").call(yAxis);

    // Use enter-update pattern to draw bars
    /* One colour for every bar. This was ten hues from schemeCategory10, one
       per variant, which spent the chart's only free channel restating what the
       x-axis already labels — and ten is past the eight a categorical palette
       can hold without two of them becoming indistinguishable under colour
       blindness. The bar length is the variable; the variant is the axis. */
    barChartGroup
      .selectAll(".bar")
      .data(topRates)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScales(d.variant))
      .attr("y", (d) => yScales(d[dataSelectionVar]))
      .attr("width", xScales.bandwidth())
      .attr("height", (d) => chartDimHeight - yScales(d[dataSelectionVar]))
      .attr("fill", theme.series1);

    //Hover tool tips
    var tooltip = d3.select("#tooltip");
    barChartGroup.selectAll(".bar").on("mouseover", (event, d) => {
      const total_deaths = d.total_deaths;
      const deathFormatter = d3.format(".2f");
      const dateFormatter = d3.timeFormat("%B %d, %Y");
      const start_date = new Date(d.first_seq);
      const end_date = new Date(d.last_seq);
      const label =
        dataTypeSelection === "mortality_rate"
          ? `Total Deaths: ${deathFormatter(total_deaths)}`
          : `Start Date: ${dateFormatter(
              start_date
            )}, End Date: ${dateFormatter(end_date)}`;
      tooltip
        .html(label)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("opacity", 1);
      })
      //Nothing ever hid the tooltip again, so it stayed on screen at whatever
      //position it was last given.
      .on("mouseout", () => tooltip.style("opacity", 0));

    //X-Axis Label
    barChartGroup
      .append("text")
      .attr("x", chartDimWidth / 2)
      .attr("y", chartDimHeight + 100)
      //text-anchor rather than subtracting a guess at half the label's width:
      //the offset was tuned per chart and drifts as soon as the text changes.
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-family", "Arial")
      .text("Variants");

    //Y-Axis Label
    const yAxisText =
      dataTypeSelection === "mortality_rate"
        ? `Mortality Rate (%)`
        : `Life Span (Days)`;
    barChartGroup
      .append("text")
      .attr("x", -90)
      .attr("y", chartDimHeight - 350)
      .style("font-weight", "bold")
      .attr("transform", "rotate(-90)")
      .attr("dx", "-8em")
      .attr("dy", "1em")
      .style("font-family", "Arial")
      .text(yAxisText);

    //Functionality From Bar Chart Affecting Scatter Plot
    barChartGroup.selectAll(".bar").on("click", (event, d) => {
      variantSelection = d.variant;
      d3.select("#variantSelection").property("value", variantSelection);
      updateScatterPlot();
      updateHeatMap();
    });
  }

  //Scatter Plot Function
  function updateScatterPlot() {
    //Set up variables for the x/y axes to utilize
    const countryVariantDataFilter = data.filter(
      (d) => d.Country === countrySelection
    );

    //Set up max values for the x/y axes
    let maxValue;
    const maxDeaths = d3.max(countryVariantDataFilter, (d) => d.total_deaths);
    const maxDuration = d3.max(countryVariantDataFilter, (d) => d.duration);
    const maxMortalityRate = d3.max(
      countryVariantDataFilter,
      (d) => d.mortality_rate
    );

    if (dataTypeSelection === "mortality_rate") {
      maxValue = maxMortalityRate;
    } else {
      maxValue = maxDuration;
    }

    //Set up scales
    const xScales = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([0, chartDimWidth]);

    const yScales = d3
      .scaleLinear()
      .domain([0, maxDeaths])
      .range([chartDimHeight, 0]);

    //Remove old scatter plot elements
    scatterPlotGroup.selectAll("*").remove();

    //Add the x and y axes
    const xAxis = d3.axisBottom(xScales);
    const yAxis = d3.axisLeft(yScales);

    //Call the axes
    scatterPlotGroup
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${chartDimHeight})`)
      .call(xAxis);

    scatterPlotGroup.append("g").attr("class", "y-axis").call(yAxis);

    //Create points on scatter plot
    scatterPlotGroup
      .selectAll(".circle")
      .data(countryVariantDataFilter)
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("cx", (d) =>
        xScales(
          dataTypeSelection === "duration" ? d.duration : d.mortality_rate
        )
      )
      .attr("cy", (d) => yScales(d.total_deaths))
      .attr("r", 5)
      .attr("fill", (d) =>
        d.variant === variantSelection ? theme.series1 : theme.muted
      )
      .attr("opacity", (d) => (d.variant === variantSelection ? 1.0 : 0.7));

    //Draw the selected variant on top
    scatterPlotGroup
      .selectAll(".circle")
      .filter((d) => d.variant === variantSelection)
      .raise();

    const xAxisText =
      dataTypeSelection === "mortality_rate"
        ? `Mortality Rate (%)`
        : `Life Span (Days)`;
    //X-Axis Label
    scatterPlotGroup
      .append("text")
      .attr("x", chartDimWidth / 2)
      .attr("y", chartDimHeight + 50)
      //Centred on the plot rather than nudged by a fixed offset, which matters
      //here because this label's text changes with the data-type selector.
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-family", "Arial")
      .text(xAxisText);

    //Y-Axis Label
    scatterPlotGroup
      .append("text")
      .attr("x", -45)
      .attr("y", chartDimHeight - 350)
      .style("font-weight", "bold")
      .attr("transform", "rotate(-90)")
      .attr("dx", "-8em")
      .attr("dy", "1em")
      .style("font-family", "Arial")
      .text("Total Deaths");

    //Hover tool tips
    var tooltip2 = d3.select("#tooltip2");
    scatterPlotGroup.selectAll(".circle").on("mouseover", (event, d) => {
      const variantName = d.variant;
      tooltip2
        .html(variantName)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("opacity", 1);
      })
      .on("mouseout", () => tooltip2.style("opacity", 0));
  }

  //HeatMap Function
  function updateHeatMap() {
    //Set up variables for x/y and text
    let metricSelection = dataTypeSelection;
    const countryData = data.filter((d) => d.Country === countrySelection);
    const metrics = [
      "growth_rate",
      "duration",
      "mortality_rate",
      "total_cases",
      "total_deaths",
    ];
    //For every country in Country Data create a metric object that contains the variant,     metric, and value
    const heatmapData = [];
    for (const country of countryData) {
      for (const metric of metrics) {
        const entry = {
          variant: country.variant,
          metric: metric,
          value: country[metric],
        };
        heatmapData.push(entry);
      }
    }

    //Set up scales
    const xScale = d3
      .scaleBand()
      .domain([...new Set(heatmapData.map((d) => d.variant))])
      .range([0, chartDimWidth])
      .padding(0.1);

    const yScale = d3
      .scaleBand()
      .domain(metrics)
      .range([chartDimHeight, 0])
      .padding(0.1);

    //Remove old scatter plot elements
    heatMapGroup.selectAll("*").remove();

    //Add the x and y axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    //Call the axes and set up the text
    heatMapGroup
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${chartDimHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("dx", "-4.2em")
      .attr("dy", "1.2em")
      .style("font-family", "Arial")
      .style("fill", function (d) {
        return d === variantSelection ? theme.series1 : theme.muted;
      })
      .style("font-weight", function (d) {
        return d === metricSelection ? "900" : "normal";
      });

    heatMapGroup
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-family", "Arial")
      .style("fill", function (d) {
        return d === metricSelection ? theme.series1 : theme.muted;
      });

    //X-Axis Label
    heatMapGroup
      .append("text")
      .attr("x", chartDimWidth / 2)
      .attr("y", chartDimHeight + 100)
      //text-anchor rather than subtracting a guess at half the label's width:
      //the offset was tuned per chart and drifts as soon as the text changes.
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-family", "Arial")
      .text("Variants");

    //Create color scale that uses graident-colors so we can define the "heat" in the heat map
    //Brighter colors indicate more "heat" — on a dark surface the brightest
    //cell is the one that stands out, so heat climbs toward the hue rather
    //than away from it. Each metric keeps its own hue and its own domain.
    const colorScale = {
      total_deaths: d3.scaleSequential(darkRamp(theme.metricHues[0])),
      total_cases: d3.scaleSequential(darkRamp(theme.metricHues[1])),
      mortality_rate: d3.scaleSequential(darkRamp(theme.metricHues[2])),
      duration: d3.scaleSequential(darkRamp(theme.metricHues[3])),
      growth_rate: d3.scaleSequential(darkRamp(theme.metricHues[4])),
    };
    for (metric of metrics) {
      const parameterValues = heatmapData
        .filter((d) => d.metric === metric)
        .map((d) => d.value);
      const lighter = d3.min(parameterValues);
      const darker = d3.max(parameterValues);
      colorScale[metric].domain([lighter, darker]);
    }

    //Set up each square with an associated value
    heatMapGroup
      .selectAll(".heatsquare")
      .data(heatmapData)
      .enter()
      .append("rect")
      .attr("class", "heatsquare")
      .attr("x", (d) => xScale(d.variant))
      .attr("y", (d) => yScale(d.metric))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale[d.metric](d.value));

    //Hover tool tips
    var tooltip3 = d3.select("#tooltip3");
    let formatter;
    const valueFormatter = d3.format(".2f");
    const mortalityFormatter = d3.format(".5f");
    heatMapGroup.selectAll(".heatsquare").on("mouseover", (event, d) => {
      if (d.metric === "mortality_rate") {
        formatter = mortalityFormatter;
      } else {
        formatter = valueFormatter;
      }
      tooltip3
        .html(`Value: ${formatter(d.value)}`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("opacity", 1);
      })
      .on("mouseout", () => tooltip3.style("opacity", 0));
  }

  //Update Barchart Dynamically
  updateSelectionOptionsVariant();
  updateBarChart();
  updateScatterPlot();
  updateHeatMap();
});
