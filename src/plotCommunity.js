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

export function plotCommunityWordcloud(commInfo, iramuteqLex=true) {
    if (commInfo.lexical === null)
        return;
    const words = Object.entries(commInfo.lexical)
        .sort(function(a,b) {return iramuteqLex ? b[1]- a[1]:a[1][0] - b[1][0]})
        .slice(0, 20) // take only 50 first words
        .map((p) => {
            return {
                text:p[0],
                size: iramuteqLex ? Math.round(2.5 + 9.5*Math.log(p[1])):Math.round(2.5 + 9.5*Math.log(p[1][1]))};
        });
    console.log("Community lex has ", Object.keys(words).length, " words");

    const fillScale = scaleOrdinal(schemeTableau10);
    let svg = d3.select("#wordcloud-disp").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 300 300")
        .classed("svg-content", true)
        .append("g")

    const layout = cloud()
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

