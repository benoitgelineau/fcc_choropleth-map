(() => {
  const urlEducation = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
  const urlUS = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

  // Map dimensions
  const width = 1000;
  const height = 700;

  const margin = { top: 150, left: 50 };

  const legWidth = 250;
  const legHeight = legWidth / 20;

  // path generator that will convert GeoJSON to SVG paths
  const path = d3.geoPath();

  // Colors
  const colors = ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'];

  // Create SVG element and append map to the SVG
  const svg = d3.select('body')
    .append('svg')
    .attr('class', 'map')
    .attr('width', width)
    .attr('height', height);

  // Title
  svg.append('text')
    .attr('x', (width / 2))
    .attr('y', (margin.top / 2.5))
    .attr('id', 'title')
    .attr('text-anchor', 'middle')
    .style('font-size', 42)
    .text('United States Educational Attainment');

  // Description
  svg.append('text')
    .attr('x', (width / 2))
    .attr('y', (margin.top / 2.5) + 30)
    .attr('id', 'description')
    .attr('text-anchor', 'middle')
    .style('font-size', 18)
    .text("Percentage of 25+ adults with at least a bachelor's degree (2010-2014)");

  // Set tooltip
  const tooltip = d3.select('body')
    .append('div')
    .attr('id', 'tooltip')
    .style('opacity', 0);

  function init(error, us, education) {
    if (error) throw error;

    // Set min and max values
    const minVal = d3.min(education, d => d.bachelorsOrHigher);
    const maxVal = d3.max(education, d => d.bachelorsOrHigher);

    // Set scales
    const x = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([(width - legWidth - 40), width - 40]);

    const color = d3.scaleThreshold()
      .domain(((min, max, count) => {
        const colorDomain = [];
        const step = ((max - min) / count);
        for (let i = 1; i < count; i++) {
          colorDomain.push(min + step * i);
        }
        return colorDomain;
      })(minVal, maxVal, colors.length))
      .range(colors);

    // Set counties
    svg.append('g')
      .attr('class', 'counties')
      .attr('transform', `translate(${margin.left}, ${margin.top / 2})`)
      .selectAll('path')
      .data(topojson.feature(us, us.objects.counties).features)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('data-fips', (d, i) => education[i].fips)
      .attr('data-education', (d, i) => education[i].bachelorsOrHigher)
      .style('fill', (d, i) => color(education[i].bachelorsOrHigher))
      .attr('d', path)
      .on('mouseover', (d, i) => {
        tooltip.attr('data-education', education[i].bachelorsOrHigher);
        tooltip.transition()
          .duration(100)
          .style('opacity', 0.9);
        tooltip.html(`${education[i].area_name}, ${education[i].state}: ${education[i].bachelorsOrHigher}%`)
          .style('left', `${d3.event.pageX + 5}px`)
          .style('top', `${d3.event.pageY - 5}px`);
      })
      .on('mouseout', (d) => {
        tooltip.transition()
          .duration(300)
          .style('opacity', 0);
      });

    // Set states
    svg.append('path')
      .attr('transform', `translate(${margin.left}, ${margin.top / 2})`)
      .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
      .attr('class', 'states')
      .attr('d', path);

    // Set legend
    const leg = svg.append('g')
      .attr('id', 'legend')
      .attr('transform', `translate(${-margin.left}, ${margin.top})`)
      .style('font-size', 9)
      .style('font-weight', 'bold');

    leg.selectAll('rect')
      .data(color.range().map((value) => {
        const d = color.invertExtent(value);
        if (!d[0]) return [x.domain()[0], d[1]];
        if (!d[1]) return [d[0], x.domain()[1]];
        return d;
      }))
      .enter()
      .append('rect')
      .attr('height', legHeight)
      .attr('x', d => x(d[0]))
      .attr('width', d => x(d[1]) - x(d[0]))
      .style('fill', d => color(d[0]))
      .style('opacity', 0.8);

    const legAxis = d3.axisBottom(x)
      .tickSizeInner(legHeight + 3)
      .tickSizeOuter(0)
      .tickFormat(d => `${d.toFixed(1)}%`)
      .tickValues(color.domain());

    leg.call(legAxis)
      .select('.domain') // remove x-axis line
      .remove();
  }

  // Fetch data
  d3.queue()
    .defer(d3.json, urlUS)
    .defer(d3.json, urlEducation)
    .await(init);
})();
