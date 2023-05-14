import React, {useState,useEffect} from 'react';
// import { IconBottom } from '@aurum/icons';
import ReactECharts from 'echarts-for-react';
import SvgIcon from '@/components/SvgIcon';
import * as echarts from 'echarts';

const SalesRadar = (props, ref) => {
  const {detailInfos} = props;
  const options = {
    radar: {
      name: {
        // textStyle: {
        //   color: '#999',
        //   fontSize: '8px',
        // },
        // formatter: function(text){
        //   var strlength = text.length;
        //   if(strlength % 4 == 1){
        //     text = text.replace(/\S{4}/g,function(match){
        //       console.log(match);
        //       return match + '\n'
        //     })
        //   }else{
        //     text = text.replace(/\S{4}/g,function(match){
        //       console.log(match);
        //       return match + '\n'
        //     })
        //     strlength = text.length;
        //     text = text.substring(0,strlength - 1);
        //   }
        //   return text
        // },
      },
      indicator: [
        { name: '运算成本分数', max: 20},
        { name: '流程规范分数', max: 20},
        { name: '数据质量分数', max: 20},
        { name: '稳定性分数', max: 20},
        { name: '复用度分数', max: 20},
      ],
      splitArea: {
        show: false
      }
    },
    series: [{
      name: '分数',
      type: 'radar',
      itemStyle: {
        normal: {
          color: "#ffbc0d",
          // lineStyle: {
          //   color: "#ffbc0d"
          // }
        }
      },
      data : [
        {
          value : [...detailInfos.dataList],
          name : '暂无',
          label: {
            show: true,
            formatter: function (params) {
              return params.value;
            }
          },
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
              {
                color: 'rgba(255, 188, 13, 0.1)',
                offset: 0
              },
              {
                color: 'rgba(255, 188, 13, 0.7)',
                offset: 1
              }
            ])
          }
        },
      ]
    }]
  }
  
  return (<div className='e-charts-item'>
    <div className='e-charts-radar-title'>
      <div className='title'>{detailInfos.title}</div>
      <div className='fraction'>
        <span className='count'>{detailInfos.count}</span>
        <span className='title'>分数</span>
      </div>
    </div>
    <div className='e-charts-schedule'>
      <div className='schedule-left'>
        <div className={`step-name ${detailInfos.odsOver?'is-complete': 'is-uncomplete'}`}>ods</div>
        <div className='step-desc step-one-top'>{detailInfos.odsOver?detailInfos.odsOverString:detailInfos.odsStartString}</div>
        {/* <IconBottom className='step-arrow' /> */}
        <SvgIcon icon="arrow_to_down" className="arrow_to_down" />
        <div className={`step-name ${detailInfos.dwdOver?'is-complete': 'is-uncomplete'}`}>dwd</div>
        <div className='step-desc step-two-top'>{detailInfos.dwdOver?detailInfos.dwdOverString:detailInfos.dwdStartString}</div>
        {/* <IconBottom className='step-arrow' /> */}
        <SvgIcon icon="arrow_to_down" className="arrow_to_down" />
        <div className={`step-name ${detailInfos.publicOver?'is-complete': 'is-uncomplete'}`} style={{fontSize: '8px'}}>公共层</div>
        <div className='step-desc step-three-top'>{detailInfos.publicOver?detailInfos.publicOverString:detailInfos.publicStartString}</div>
      </div>
      <div className='radar-right'>
        <ReactECharts 
          option={options}
          style={{ height: 220 }} 
        />
      </div>
    </div>
  </div>)
}

export default SalesRadar;