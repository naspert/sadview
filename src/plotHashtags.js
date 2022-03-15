import plotly from 'plotly.js-basic-dist-min';
import * as echarts from 'echarts/core';
import { GridComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GridComponent, BarChart, CanvasRenderer]);
export function plotHashtagsEC(hashtags, userHashtagsContainerId) {
    const filtHashtags = hashtags.filter(t => t.num > 1);
    const y = filtHashtags.map(t => t.name); // y axis is categories
    const x = filtHashtags.map(t => t.num); // x is count
    let options = {
        xAxis: {
            type: 'value'
        },
        yAxis: {
            type: 'category',
            data: y
        },
        series: [
            {
                data: x,
                type: 'bar'
            }
        ]
    }
    let chartDom = document.getElementById(userHashtagsContainerId);
    let userHashtagPlots = echarts.init(chartDom);
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

