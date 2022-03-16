import _ from 'lodash';
import * as echarts from 'echarts/core';
import { GridComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GridComponent, BarChart, CanvasRenderer]);
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
        xAxis: {
            type: 'category',
            data: x,
            axisLabel: { interval: 0, rotate: 80 }
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

