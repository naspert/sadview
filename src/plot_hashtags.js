import plotly from 'plotly.js-basic-dist-min';

export function plotHashtags(htListJson) {
    // get sorted hashtags list with most used first
    const hashtags = Object.entries(JSON.parse(htListJson.replace(/\'/g, '"'))).map((p) => {
        return {name:p[0], num:p[1]};
    }).sort(function(a,b) {return b.num - a.num});
    const x = hashtags.map(t => t.name);
    const y = hashtags.map(t => t.num);
    const data = [
        {
            x: x,
            y: y,
            type: 'bar',
        }
    ];

    const layout = {
        autosize: false,
        height: 200,
        margin: {
            l: 50,
            r: 5,
            b: 100,
            t: 10,
            pad: 4
        }
    };
    plotly.newPlot('userhashtags-disp', data, layout);
}

export function plotCommunityVoc(commInfo) {
    const sortedLex = Object.entries(commInfo.lexical).map((p) => {
        return {name:p[0], num:p[1]};
    }).sort(function(a,b) {return b.num - a.num});
    const x = sortedLex.map(t => t.name);
    const y = sortedLex.map(t => t.num);
    const data = [
        {
            x: x,
            y: y,
            type: 'bar',
        }
    ];

    const layout = {
        autosize: false,
        height: 200,
        margin: {
            l: 50,
            r: 5,
            b: 100,
            t: 10,
            pad: 4
        }
    };
    plotly.newPlot('cluster-lex', data, layout);
}
