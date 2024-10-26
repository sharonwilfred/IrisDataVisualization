// Load the Iris data from CSV
d3.csv("iris.csv").then(data => {
    // Convert string values to numbers for petal length and width
    data.forEach(d => {
        d.PetalLength = +d.PetalLength; // Convert to number
        d.PetalWidth = +d.PetalWidth;   // Convert to number
    });

    // Dimensions and margins for the SVG canvas
    const margin = { top: 20, right: 30, bottom: 50, left: 40 };
    const width = 600 - margin.left - margin.right; 
    const height = 400 - margin.top - margin.bottom;

    // Create SVG canvas for the scatter plot
    const svgScatter = d3.select("#scatterPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PetalLength)]) // Range for x-axis
        .range([0, width]); // Map to width of the canvas

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PetalWidth)]) // Range for y-axis
        .range([height, 0]); // Invert for SVG coordinate system

    // Set color scale for species
    const colorScale = d3.scaleOrdinal()
        .domain(["setosa", "versicolor", "virginica"]) // Define species
        .range(d3.schemeCategory10); // Color palette

    // Add x and y axes to the plot
    svgScatter.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(10)); // X-axis with ticks

    svgScatter.append("g")
        .call(d3.axisLeft(yScale).ticks(10)); // Y-axis with ticks

    // Add labels for x and y axes
    svgScatter.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 2)
        .style("text-anchor", "middle")
        .text("Petal Length");

    svgScatter.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left / 2)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .text("Petal Width");

    // Add circles for each data point
    svgScatter.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.PetalLength)) // Position x
        .attr("cy", d => yScale(d.PetalWidth)) // Position y
        .attr("r", 5) // Circle radius
        .attr("fill", d => colorScale(d.Species)); // Color based on species

    // Create a legend for species
    const legend = svgScatter.selectAll(".legend")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`); // Position

    // Add colored rectangles to legend
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorScale);

    // Add text labels to legend
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d); // Show species name

    // Part 2.2: Side-by-side Boxplot
    
    // Set up for the boxplot
    const boxplotMargin = { top: 20, right: 30, bottom: 50, left: 40 };
    const boxplotWidth = 600 - boxplotMargin.left - boxplotMargin.right; 
    const boxplotHeight = 400 - boxplotMargin.top - boxplotMargin.bottom;

    // Create SVG canvas for boxplot
    const boxplotSvg = d3.select("#boxplot")
        .append("svg")
        .attr("width", boxplotWidth + boxplotMargin.left + boxplotMargin.right)
        .attr("height", boxplotHeight + boxplotMargin.top + boxplotMargin.bottom)
        .append("g")
        .attr("transform", `translate(${boxplotMargin.left},${boxplotMargin.top})`);

    // Convert strings into numeric data for boxplot
    data.forEach(d => {
        d.PetalLength = +d.PetalLength; // Ensure it's a number
    });

    // Set up scales for boxplot
    const boxXScale = d3.scaleBand()
        .domain(["setosa", "versicolor", "virginica"]) // Species on x-axis
        .range([0, boxplotWidth]) // Map to boxplot width
        .padding(0.1); // Add some padding between boxes

    const boxYScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PetalLength)]) // Max petal length
        .range([boxplotHeight, 0]); // Invert for SVG coordinate system

    // Create the boxplot metrics function
    const rollupFunction = v => {
        const q1 = d3.quantile(v.map(d => d.PetalLength).sort(d3.ascending), 0.25);
        const median = d3.quantile(v.map(d => d.PetalLength).sort(d3.ascending), 0.5);
        const q3 = d3.quantile(v.map(d => d.PetalLength).sort(d3.ascending), 0.75);
        return { q1, median, q3 }; // Return the metrics
    };

    // Calculate quartiles for each species
    const quartilesBySpecies = d3.rollup(data, rollupFunction, d => d.Species);

    // Draw boxes for each species in the boxplot
    quartilesBySpecies.forEach((quartiles, species) => {
        const x = boxXScale(species); // Get x position
        const boxWidth = boxXScale.bandwidth(); // Width of each box

        // Draw the vertical line for IQR
        boxplotSvg.append("line")
            .attr("x1", x + boxWidth / 2) // Start position
            .attr("x2", x + boxWidth / 2) // End position
            .attr("y1", boxYScale(quartiles.q1 - 1.5 * (quartiles.q3 - quartiles.q1))) // Bottom of whisker
            .attr("y2", boxYScale(quartiles.q3 + 1.5 * (quartiles.q3 - quartiles.q1))) // Top of whisker
            .attr("stroke", "black"); // Line color

        // Draw the rectangle for the box
        boxplotSvg.append("rect")
            .attr("x", x) // Position
            .attr("y", boxYScale(quartiles.q3)) // Position from the top
            .attr("height", boxYScale(quartiles.q1) - boxYScale(quartiles.q3)) // Height of the box
            .attr("width", boxWidth) // Width of the box
            .attr("fill", "lightgray"); // Box color

        // Draw the median line inside the box
        boxplotSvg.append("line")
            .attr("x1", x) // Start position
            .attr("x2", x + boxWidth) // End position
