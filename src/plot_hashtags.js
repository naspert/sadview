import plotly from 'plotly.js-basic-dist-min';

export function plotHashtags(htListJson) {
    // get sorted hashtags list with most used first
    const hashtags = JSON.parse(htListJson).map((p) => {
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
    plotly.newPlot('hashtag-disp', data, layout);
}
