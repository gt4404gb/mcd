import * as echarts from 'echarts';
import React, { useEffect, useState } from 'react';
import { Table, Row, Col, PageHeader, Radio, Statistic } from '@aurum/pfe-ui';
import { EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import DetailList from './DetailList';

const { transferAntdTableHeaderArray2Object } = common.helpers;

const chartOption: any = {
  tooltip: {
    trigger: 'axis',
    // axisPointer: { type: 'cross' }
  },
  legend: {
    data: [],
  },
  xAxis: {
    name: '时间',
    type: 'category',
    data: []
  },
  yAxis: {
    name: '访问量',
    // type: 'value',
  },
  series: []
}
export default ({ dataSource, timeRange = [], onChange }: any) => {
  const [isHour, setIsHour]: any = useState(0);
  const [byMinuteDisabled, setByMinuteDisabled]: any = useState(false);
  const [ds, setDS]: any = useState({});
  const [chart, setChart]: any = useState(null);
  const [detailList, setDetailList]: any = useState(null);
  const [detailListVisible, setDetailListVisible]: any = useState(false);

  const buildChartOption: any = (legendData: any, xData: any, series: any) => {
    chartOption.legend.data = legendData;
    chartOption.xAxis.data = xData;
    chartOption.series = series;
    chart.setOption(chartOption, true)
  }

  useEffect(() => {
    if (timeRange.length === 2) {
      const DATE_FORMAT: any = "YYYY-MM-DD HH:mm:ss";
      const momentRange: any = [
        moment(timeRange[0], DATE_FORMAT),
        moment(timeRange[1], DATE_FORMAT),
      ];
      const diffDays: any = momentRange[1].diff(momentRange[0], 'days');
      setByMinuteDisabled(diffDays > 1 ? true : false);
      if (diffDays > 1) setIsHour(1);
    } else {
      setByMinuteDisabled(false);
    }
  }, [timeRange]);

  useEffect(() => {
    const ds: any = dataSource?.data;
    if (ds) {
      ds.totalCount = ds.totalCount || 0;
      ds.successCount = ds.successCount || 0;
      ds.failCount = ds.failCount || 0;
      ds.appCount = ds.appCount || 0;
      ds.maxRT = ds.maxRT || 0;


      ds.totalCountLabel = ds.totalCount;
      ds.successCountLabel = ds.successCount;
      ds.failCountLabel = ds.failCount;
      if (ds.totalCount > 10000) ds.totalCountLabel = (ds.totalCount / 10000).toFixed(1) + ' w';
      if (ds.successCount > 10000) ds.successCountLabel = (ds.successCount / 10000).toFixed(1) + ' w';
      if (ds.failCount > 10000) ds.failCountLabel = (ds.failCount / 10000).toFixed(1) + ' w';
      if (ds.maxRT > 1000) {
        ds.maxRTLabel = (ds.maxRT / 1000).toFixed(3) + ' s';
      } else {
        ds.maxRTLabel = ds.maxRT + ' ms';
      }

      const xData: any = {};
      const legendData: any = [];
      const seriesData: any = [];

      if (Array.isArray(ds.timeCounts)) {
        ds.timeCounts.forEach((group: any) => {
          legendData.push(group.name);
          const seriesItem: any = {
            name: group.name,
            type: 'line',
            stack: 'Total',
            smooth: true,
            showSymbol: false,
            areaStyle: {},
            data: [],
            itemStyle: {
              normal: {
                lineStyle: {
                  width: 1 //设置线条粗细
                }
              }
            }
          }
          group.timeCounts.forEach((item: any) => {
            xData[item.time] = item.time;
            seriesItem.data.push(item.count);
          });
          seriesData.push(seriesItem);
        })
        buildChartOption(legendData, Object.values(xData), seriesData);
      } else {
        buildChartOption([], [], []);
      }
      setDS(ds);
    }
  }, [dataSource])

  useEffect(() => {
    const chart: any = echarts.init((document.getElementById('chart') as any));
    chart.setOption(chartOption);
    setChart(chart);
  }, []);

  useEffect(() => {
    if (typeof onChange === 'function') onChange({ isHour });
  }, [isHour]);

  return (
    <div className="search-result" >
      <DetailList visible={detailList?.visible} title={detailList?.title} columns={detailList?.data} labels={detailList?.labels} onClose={() => {
        setDetailList(null);
      }} />
      <section className="api-chart">
        <PageHeader
          ghost={true}
          title="趋势图"
          extra={[
            <Radio.Group key="by-time" value={isHour} onChange={(e: any) => {
              setIsHour(e.target.value);
              // if (typeof onChange === 'function') onChange({ isHour: e.target.value });
            }}>
              <Radio.Button value={1}>按小时</Radio.Button>
              {!byMinuteDisabled && <Radio.Button value={0}>按分钟</Radio.Button>}
            </Radio.Group>
          ]}
        >
          <Row>
            <Statistic title="API调用总次数" value={ds.totalCountLabel} />
            <Statistic title="API调用成功次数" value={ds.successCountLabel} />
            <Statistic title="API调用失败次数" value={ds.failCountLabel} />
            <Statistic title="API调用成功率" value={ds.successPercent} suffix="%" />
            <Statistic title="平均 RT" value={ds.avgRT} suffix="ms" />
            <Statistic title="最大 RT" value={ds.maxRTLabel} />
            <Statistic title="调用应用数" value={ds.appCount} />
          </Row>
        </PageHeader>
        <div id="chart" style={{ height: '100%', minHeight: '320px' }}></div>
      </section>
      <Row className="api-list" gutter={20} >
        <Col span={12}>
          <section >
            <div className="title">APP调用次数 TOP 10</div>
            <Table
              className="mcd-table"
              scroll={{ x: '100%' }}
              rowKey="appId"
              columns={transferAntdTableHeaderArray2Object([
                ['排序', 'order'],
                ['应用名称', 'appName'],
                ['应用编号', 'appId'],
                ['调用次数', 'totalCount'],
                ['操作', 'view', (value: any, record: any, index:any) => {
                  return <EyeOutlined key={`openDashboard1${index}`} onClick={() => {
                    (async () => {
                      const resp: any = await apis.getGatewayModule().appStats({
                        appId: record.appId,
                        merchantId: dataSource.searchObj.merchantId,
                        apiId: dataSource.searchObj.apiId,
                        startTime: dataSource.searchObj.startTime,
                        endTime: dataSource.searchObj.endTime,
                      });
                      setDetailList({
                        ...resp,
                        visible: true,
                        title: record.appName,
                        labels: [
                          ['接口URL', 'url'],
                          ['接口名称', 'apiName'],
                          ['调用方式', 'method'],
                          ['调用次数', 'totalCount'],
                        ]
                      });
                    })();
                  }} />
                }]
              ])}
              dataSource={ds.gatewayAppCounts}
              pagination={false} />
          </section>
        </Col>
        <Col span={12}>
          <section >
            <div className="title">API调用次数 TOP 10</div>
            <Table
              className="mcd-table"
              scroll={{ x: '100%' }}
              rowKey="apiId"
              columns={transferAntdTableHeaderArray2Object([
                ['排序', 'order'],
                ['API URL', 'url'],
                ['方法', 'method'],
                ['API 分组', 'groupName'],
                ['调用次数', 'totalCount'],
                ['操作', 'view', (value: any, record: any, index:any) => {
                  return <EyeOutlined key={`openDashboard2${index}`} onClick={() => {
                    (async () => {
                      const resp: any = await apis.getGatewayModule().apiStats({
                        apiId: record.apiId,
                        appId: dataSource.searchObj.appId,
                        merchantId: dataSource.searchObj.merchantId,
                        startTime: dataSource.searchObj.startTime,
                        endTime: dataSource.searchObj.endTime,
                      });
                      setDetailList({
                        ...resp,
                        visible: true,
                        title: record.url,
                        labels: [
                          ['商户', 'merchantName'],
                          ['应用编号', 'appId'],
                          ['应用名称', 'appName'],
                          ['调用次数', 'totalCount'],
                        ]
                      });
                    })();
                  }} />
                }],
              ])}
              dataSource={ds.gatewayApiCounts}
              pagination={false} />
          </section>
        </Col>
      </Row>
      <Row className="api-list" gutter={20} >
        <Col span={12}>
          <section >
            <div className="title">API HTTP 错误码 TOP 10</div>
            <Table
              className="mcd-table"
              scroll={{ x: '100%' }}
              rowKey="code"
              columns={transferAntdTableHeaderArray2Object([
                ['排序', 'order'],
                ['错误码', 'code'],
                ['错误原因', 'msg'],
                ['次数', 'totalCount'],
                ['操作', 'view', (value: any, record: any) => {
                  return <EyeOutlined onClick={() => {
                    (async () => {
                      const resp: any = await apis.getGatewayModule().errorStats({
                        code: record.code,
                        apiId: dataSource.searchObj.apiId,
                        appId: dataSource.searchObj.appId,
                        merchantId: dataSource.searchObj.merchantId,
                        startTime: dataSource.searchObj.startTime,
                        endTime: dataSource.searchObj.endTime,
                      });
                      setDetailList({
                        ...resp,
                        visible: true,
                        title: `${record.code} ${record.msg}`,
                        labels: [
                          ['接口URL', 'url'],
                          ['接口名称', 'apiName'],
                          ['调用方式', 'method'],
                          ['调用次数', 'totalCount'],
                        ]
                      });
                    })();
                  }} />
                }],
              ])}
              dataSource={ds.gatewayFailHttpCodeCounts}
              pagination={false} />
          </section>
        </Col>
        <Col span={12}>
          <section >
            <div className="title">API 调用失败次数 TOP 10</div>
            <Table
              className="mcd-table"
              scroll={{ x: '100%' }}
              rowKey="apiId"
              columns={transferAntdTableHeaderArray2Object([
                ['排序', 'order'],
                ['API 名称', 'url'],
                ['方法', 'method'],
                ['API 分组', 'groupName'],
                ['失败次数', 'totalCount'],
                ['操作', 'view', (value: any, record: any) => {
                  return <EyeOutlined onClick={() => {
                    (async () => {
                      const resp: any = await apis.getGatewayModule().failedApiStats({
                        apiId: record.apiId,
                        appId: dataSource.searchObj.appId,
                        merchantId: dataSource.searchObj.merchantId,
                        startTime: dataSource.searchObj.startTime,
                        endTime: dataSource.searchObj.endTime,
                      });
                      setDetailList({
                        ...resp,
                        visible: true,
                        title: record.url,
                        labels: [
                          ['商户', 'merchantName'],
                          ['应用编号', 'appId'],
                          ['应用名称', 'appName'],
                          ['调用次数', 'totalCount'],
                        ]
                      });
                    })();
                  }} />
                }],
              ])}
              dataSource={ds.gatewayApiFailCounts}
              pagination={false} />
          </section>
        </Col>
      </Row>
    </div>
  )
}