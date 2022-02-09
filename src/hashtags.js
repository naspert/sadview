import $ from 'jquery';
import * as echarts from 'echarts/core';
import _ from 'lodash';

import {
    SingleAxisComponent,
    TooltipComponent,
    LegendComponent
} from 'echarts/components';
import { ThemeRiverChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
    SingleAxisComponent,
    TooltipComponent,
    LegendComponent,
    ThemeRiverChart,
    CanvasRenderer
]);



// initialize the echarts instance
const myChart = echarts.init(document.getElementById("main"));
window.chart = myChart;
let option = {
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'line',
            lineStyle: {
                color: 'rgba(0,0,0,0.2)',
                width: 1,
                type: 'solid'
            }
        },
        formatter: function (params, ticket, callback) {
            //console.log(params);
            let output = "";
            for (let k=0; k<params.length; k++) {
                if (params[k].value[1] == 0)
                    continue;

                output += `${params[k].value[2]} `;
                output += `<span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${params[k].value[1]}</span><br />`;
            }
            return output;
        }
    },
    legend: {
        data: []
    },
    singleAxis: {
        top: 50,
        bottom: 50,
        axisTick: {},
        axisLabel: {},
        type: 'time',
        axisPointer: {
            animation: true,
            label: {
                show: true,
                formatter: (data) => {
                    const hashtags = myChart.getOption().legend[0].data;
                    const selection = myChart.getOption().legend[0].selected;
                    // list of selected accounts
                    const activeHashtags = _.filter(hashtags, p => { return _.get(selection, p,  true)})
                    // get the data for current time
                    const curDate = data.seriesData[0].data[0];
                    const currentActiveHashtags = _.pick(hashtagsData.detailTimeline[curDate], activeHashtags);
                    // now merge the accounts
                    let accts = {};
                    Object.keys(currentActiveHashtags).forEach(k => {
                       Object.keys(currentActiveHashtags[k]).forEach(p => {
                         accts[p] = (accts[p] || 0) + currentActiveHashtags[k][p];
                       });
                    });
                    const activeAccounts = _.pickBy(accts, p => p > 0);
                    console.log(activeAccounts);
                    return `date: ${curDate}`;
                },
            },
        },
        splitLine: {
            show: true,
            lineStyle: {
                type: 'dashed',
                opacity: 0.2
            }
        }
    },
    series: [
        {
            type: 'themeRiver',
            emphasis: {
                itemStyle: {
                    shadowBlur: 20,
                    shadowColor: 'rgba(0, 0, 0, 0.8)'
                }
            },
            data: [
               // format is [ date, value, id]
            ]
        }
    ]
};

// register callback for resize
window.onresize = function() {
    myChart.resize();
};
myChart.on('click', function(params) {
   //console.log(params);

    //console.log(params);
});
myChart.on('mouseout', function (params) {
   //console.log('exit');
});


const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
let days = 30;
let sampleHour = 4;
let activeThr = 3;
let minActiv = 1;
let hashtagsData;
if (urlParams.has('days'))
    days = parseInt(urlParams.get('days'));
if (urlParams.has('sampleHour'))
    sampleHour = parseInt(urlParams.get('sampleHour'));
if (urlParams.has('activeThr'))
    activeThr = parseInt(urlParams.get('activeThr'));
if (urlParams.has('minActiv'))
    minActiv = parseInt(urlParams.get('minActiv'));

$.ajax({
    url: `http://localhost:8081/hashtags-data/${id}/${days}/${sampleHour}/${activeThr}/${minActiv}`,
    type: 'GET'
}).done(function(data) {
    option.series[0].data = data.data;
    option.legend.data = data.legend;
    // Draw the chart
    myChart.setOption(option);
    hashtagsData = data;
});

