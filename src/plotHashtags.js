import plotly from 'plotly.js-basic-dist-min';

export function plotHashtags(hashtags) {
    // get sorted hashtags list with most used first
    const x = hashtags.map(t => t.name);
    const y = hashtags.map(t => t.num);
    const data = [
        {
            x: y,
            y: x,
            type: 'bar',
            orientation: 'h'
        }
    ];

    const layout = {
        autosize: true,
        width: 200,
        margin: {
            l: 50,
            r: 5,
            b: 100,
            t: 10,
            pad: 4
        },
        yaxis: {
            ticklabelposition: 'outside right',
            position: 1,
            side: 'right',
            automargin: true
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
