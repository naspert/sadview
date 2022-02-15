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
import axios from 'axios';

echarts.use([
    SingleAxisComponent,
    TooltipComponent,
    LegendComponent,
    ThemeRiverChart,
    CanvasRenderer
]);

let echartContainer;
let currentHashtagsData;

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
                    // get the data for current time
                    const curDate = data.seriesData[0].data[0];
                    const activeAccounts = getActiveAccounts(curDate);
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

function getActiveAccounts(curDate) {
    const hashtags = echartContainer.getOption().legend[0].data;
    const selection = echartContainer.getOption().legend[0].selected;
    // list of selected accounts
    const activeHashtags = _.filter(hashtags, p => { return _.get(selection, p,  true)})

    const currentActiveHashtags = _.pick(currentHashtagsData.detailTimeline[curDate], activeHashtags);
    // now merge the accounts
    let accts = {};
    Object.keys(currentActiveHashtags).forEach(k => {
        Object.keys(currentActiveHashtags[k]).forEach(p => {
            accts[p] = (accts[p] || 0) + currentActiveHashtags[k][p];
        });
    });
    return _.pickBy(accts, p => p > 0);
}

function getDataHashtags(data, activThr = 3, minActiv=1) {
    let filtData = {};

    Object.keys(data.hashtags).forEach(k => {
        //console.log(k);
        if (_.size(data.hashtags[k]) > activThr) {// keep only hashtags active on more than x timecodes
            filtData[k] = {};
            Object.keys(data.hashtags[k]).forEach(p => {
                filtData[k][p] = _.sum(Object.values(data.hashtags[k][p]));;
            });
            if (_.max(Object.values(filtData[k])) < minActiv) // remove low activity hashtags
                delete filtData[k];
        }
    });

    let timelineData = [];
    Object.keys(filtData).forEach(k => {
        Object.keys(filtData[k]).forEach(p => timelineData.push([data.time[p].created_date_rs, filtData[k][p], k]));
    })
    const legend = Object.keys(filtData);
    const detailData =  _.pick(data.hashtags, legend);
    let detailTimeline = {};
    Object.keys(detailData).forEach(k => {
        // iterate times
        Object.keys(detailData[k]).forEach(p => {
            let t = data.time[p].created_date_rs;
            if (!detailTimeline.hasOwnProperty(t))
                detailTimeline[t] = {};
            detailTimeline[t][k] = detailData[k][p]
        });
    });
    return {data: timelineData, legend: Object.keys(filtData), details: detailData, detailTimeline: detailTimeline};
}

async function processRawData(dataUrl, numDays=30, sampleHours=24,
                              activThr=3, minActiv=3) {
    const hashtagsData = await axios.get(`${dataUrl}/${numDays}/${sampleHours}`);
    return getDataHashtags(hashtagsData.data, activThr, minActiv)
}

export async function plotHashtagsData(dataUrl, echartsElemId, numDays=20,
                                       sampleHours=24, activThr=3, minActiv=3) {
    echartContainer = echarts.init(document.getElementById(echartsElemId));
    currentHashtagsData = await processRawData(dataUrl, numDays, sampleHours, activThr, minActiv);
    option.series[0].data = currentHashtagsData.data;
    option.legend.data = currentHashtagsData.legend;
    // Draw the chart
    echartContainer.setOption(option);
    // register callback for resize
    window.onresize = function() {
        echartContainer.resize();
    };

}


