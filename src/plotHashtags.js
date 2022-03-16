import plotly from 'plotly.js-basic-dist-min';
import * as echarts from 'echarts/core';
import { GridComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GridComponent, BarChart, CanvasRenderer]);
export function plotHashtagsEC(hashtags, userHashtagsContainerId) {
    const filtHashtags = hashtags.filter(t => t.num > 1);
    const x = filtHashtags.map(t => t.name); // x axis is categories
    const y = filtHashtags.map(t => t.num); // y is count
    let options = {
        xAxis: {
            type: 'category',
            data: x,
            axisLabel: { interval: 0, rotate: 50 }
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                data: y,
                type: 'bar'
            }
        ]
    }
    let userHashtagPlots = echarts.init(document.getElementById(userHashtagsContainerId));
    userHashtagPlots.setOption(options);
}
export function plotHashtags(hashtags) {
    // get sorted hashtags list with most used first
    const filtHashtags = hashtags.filter(t => t.num > 1);
    const x = filtHashtags.map(t => t.name);
    const y = filtHashtags.map(t => t.num);
    const data = [
        {
            x: y,
            y: x,
            type: 'bar',
            orientation: 'w'
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

