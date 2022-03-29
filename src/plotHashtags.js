import _ from 'lodash';
import * as echarts from 'echarts/core';
import {
    GridComponent,
    TitleComponent,
    TooltipComponent
} from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GridComponent, BarChart, CanvasRenderer, TitleComponent, TooltipComponent]);
export function plotHashtagsEC(hashtags, userHashtagsContainerId) {
    // aggregate hashtags having different cases
    const hashtagsLower = hashtags.map(t => ({name: t.name.toLowerCase(), num: t.num}));
    const grpHashtags = _.groupBy(hashtagsLower, 'name');
    const aggrHashtags = _.mapValues(grpHashtags, v => _.sumBy(v, 'num'));
    const filtHashtags = _.keys(aggrHashtags).map(t => ({name: t, num: aggrHashtags[t]})).filter(t => t.num>1);
    const sortHashtags = _.orderBy(filtHashtags, ['num'], ['desc']);
    const x = sortHashtags.map(t => t.name); // x axis is categories
    const y = sortHashtags.map(t => t.num); // y is count
    let options = {
        title: {
            text: 'User hashtags'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line',
                label: {
                    backgroundColor: '#283b56'
                }
            }
        },
        grid: {
            containLabel: true
        },
        xAxis: {
            z: 10,
            type: 'category',
            data: x,
            axisLabel: {
                rotate: 90,
                inside: true,
                color: '#d4a246'
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                data: y,
                type: 'bar',
                colorBy: 'data',
                showBackground: true,
                backgroundStyle:{
                    color: 'rgba(160, 160, 160, 0.2)'
                }
            }
        ]
    }
    let userHashtagPlots = echarts.init(document.getElementById(userHashtagsContainerId));
    userHashtagPlots.setOption(options);
}

