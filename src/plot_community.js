import { select, selectAll } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { schemeTableau10 } from 'd3-scale-chromatic';
import * as cloud from 'd3-cloud';

const d3 = Object.assign(
    {},
    {
        select,
        selectAll,
        scaleOrdinal,
        schemeTableau10
    },
  //  request
)

export function plotCommunityWordcloud(commInfo) {
    const words = Object.entries(commInfo.lexical)
        .sort(function(a,b) {return b[1]- a[1]})
        .slice(0, 20) // take only 50 first words
        .map((p) => {
            return {text:p[0], size:Math.round(2 + 10*Math.log(p[1]))};
        });
    console.log("Community lex has ", Object.keys(words).length, " words");
    const margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = 450 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    const fillScale = scaleOrdinal(schemeTableau10);
    let svg = d3.select("#info-disp").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    const layout = cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        .rotate(function() { return 0; })
        .fontSize(d => d.size)
        .random(d => 0.4) // try to keep layout between refresh
        .on("end", words => {
            svg
                .append("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function(d) { return d.size + "px"; })
                .style("fill", function (d, i) { return fillScale(i); })
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; });
        });
    layout.start();
}

