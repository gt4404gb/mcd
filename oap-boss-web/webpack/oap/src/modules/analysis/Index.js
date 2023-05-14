import React from 'react';
import { IconClose, IconEditA, IconSetupA, IconPeopleJudge, IconInfoCircle } from '@aurum/icons';
import { Spin, Modal, Form, Row, Col, Button, Select, Input, Table, message, Collapse, Tooltip, Space } from '@aurum/pfe-ui';
import SetCondition from './components/SetCondition'
import { ReactSortable } from "react-sortablejs";
import {
  prepareChart,
  openChart,
  saveChart,
  taskPageResultPage,
  downloadAsync,
  saveTemplateInfo,
  getTemplateDetail,
  toSaveSegment,
  saveTemplateInfoByPublic,
  queryTableFilterDataByCk,
  queryTableFilterDataByTrino
} from '@/api/oap/self_analysis.js';
import {
  prepareChartTrino,
  openChartTrino,
  saveChartTrino,
  taskPageResultPageTrino,
  downloadAsyncTrino
} from '@/api/oap/trino.js';
import moment from 'moment';
import { numToMoneyField, clearComma, uuid } from '@/utils/store/func';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import ShowDragContion from '@/components/showDragCondition';
import ExploreEmailModal from '@/components/ExploreEmailModal';
import SaveTemplateModal from '@/components/saveTemplateModal';
import SaveSegmentModal from '@/components/saveSegmentModal';
import AutoNotice from '@/components/autoNotice';
import { getCurrentUserIsStaff } from '@/api/oap/commonApi.js';
import SearchInput from '@/components/SearchInput';
import SvgIcon from '@/components/SvgIcon';
import { runAnalysisTaskForSelfCheckout } from '@/api/oap/buried_api.js';
import { TABLE_TYPE } from '@/constants/index';
import TableFilter from './components/TableFilter';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.formRef = React.createRef()
    this.formRefBasicInfo = React.createRef()
    this.timer = null;
    this.defDragList = [
      {
        label: 'filters',
        classify: ['dimensions:filterable', 'dimensions:filterable:groupby', 'dragDimensions:filterable', 'dimensions:filterable:isusertag', 'dimensions:filterable:groupby:isusertag'],
        iconName: 'filter',
        flag: 'dragFilter',
        title: '筛选',
        children: []
      },
      {
        label: 'dimensions',
        classify: ['dimensions:groupby', 'dimensions:filterable:groupby', 'dimensions:groupby:istag', 'dimensions:filterable:groupby:istag', 'dragFilter:groupby', 'dimensions:groupby:isusertag', 'dimensions:filterable:groupby:isusertag'],
        iconName: 'dimensions',
        flag: 'dragDimensions',
        title: '维度',
        children: [],
      },
      {
        label: 'indexes',
        classify: ['indexes'],
        iconName: 'indexes',
        flag: 'dragIndexes',
        title: '指标',
        children: [],
      },
      {
        label: 'sorts',
        classify: ['dimensions', 'dimensions:filterable', 'dimensions:groupby', 'dimensions:filterable:groupby'],
        iconName: 'sort',
        flag: 'dragSort',
        title: '排序',
        children: []
      }
    ]
    this.defDragListConditions = {
      filters: [],
      indexes: [],
      sorts: [],
      dimensions: []
    }
    this.state = {
      isLoading: false,
      checkedValue: [],
      columns: [],
      dataList: [],
      tableLoading: false,
      pageSize: 10,
      pageNo: 1,
      activeCollapse: [],
      defCollapseList: [],
      collapseList: [],
      dragList: JSON.parse(JSON.stringify(this.defDragList)),
      visibleConditon: false,
      dragListConditions: JSON.parse(JSON.stringify(this.defDragListConditions)),
      itemConditon: {},
      runDataParams: {},
      basicInfo: {},
      visibleBasicInfo: false,
      dragFromClassify: '',
      dragItemId: null,
      currentModelId: null,
      tableHeight: '',
      childCondition: [],
      currentConditionIndex: null,
      dragToFlag: '',
      bigBoxId: `bigBox${uuid()}`,
      leftBoxId: `leftBox${uuid()}`,
      resizeBox1Id: `resizeBox1${uuid()}`,
      middleBoxId: `middleBox${uuid()}`,
      resizeBox2Id: `resizeBox2${uuid()}`,
      rightBoxId: `rightBox${uuid()}`,
      emailModalData: {
        isStaff: false,
        mcdEmail: '',
        visibleEmailInfo: false,
        isLoading: false,
      },
      templateModalData: {
        visible: false,
        businessId: null,
        subjectModelList: [],
        isLoading: false
      },
      noticeData: {
        visible: false,
        defaultOpen: false
      },
      segemntModalData: {
        visible: false,
        record: {},
        isLoading: false
      },
      tableFilterModalData: {
        visible: false,
        record: {},
        isLoading: false
      }
    }
  }

  componentDidMount () {
    //modelId用来查询preCharts接口，无论何种情况，均存在
    this.setState({
      currentModelId: this.props?.modelId,
    }, () => {
      this.initAsync(this.props?.sliceId);
    })
    getCurrentUserIsStaff().then(res => {
      this.setState(state => ({
        ...state,
        emailModalData: {
          ...state.emailModalData,
          isStaff: res.data ?? false,
        }
      }))
    }).catch(() => {

    })
  }

  componentWillUnmount () {
    clearTimeout(this.timer)
  }

  onPageChange = (pageNo, pageSize) => {
    this.setState({
      pageNo: pageNo,
      pageSize: pageSize
    }, () => {
      this.getData(this.props?.sliceId);
    });
  }

  //异步
  initAsync = async (id) => {
    this.setState({
      isLoading: true,
      collapseList: [],
      ///activeCollapse:[],
      defCollapseList: [],
      runDataParams: {},
    })
    try {
      console.log('initAsync', this.props)
      const prepareChartApi = this.props.tableType == 0 ? prepareChart : prepareChartTrino;
      const openChartApi = this.props.tableType == 0 ? openChart : openChartTrino;
      const taskPageResultPageApi = this.props.tableType == 0 ? taskPageResultPage : taskPageResultPageTrino;
      let promiseAllRequest = [
        prepareChartApi({
          modelId: this.props?.modelId,
          vizType: 'TABLE'
        })
      ];
      if (['edit', 'copy'].includes(this.props.type)) {
        promiseAllRequest.push(openChartApi(id))
      }
      if (['edit'].includes(this.props.type)) {
        promiseAllRequest.push(
          taskPageResultPageApi({
            id,
            size: this.state.pageSize,
            page: this.state.pageNo - 1
          })
        )
      }
      if (['template'].includes(this.props.type)) {
        promiseAllRequest.push(getTemplateDetail(id))
      }
      const promiseAllList = await Promise.all(promiseAllRequest);
      const [{ data: resPrepareChart } = {}, { data: resOpenChart } = {}, { data: resTaskPageResultPage } = {}] = promiseAllList;
      let modelInfo = resPrepareChart?.modelInfo || {},
        activeCollapse = [],
        collapseList = [
          {
            label: 'dimensions',
            title: '维度',
            children: []
          },
          {
            label: 'indexes',
            title: '指标',
            children: []
          }
        ],
        formatTableDataTemp = {};
      collapseList.forEach(collapse => {
        const arr = modelInfo[collapse.label] || []
        collapse.children = arr.reduce((total, cur) => {
          let hasValue = total.findIndex(current => {
            return cur.columnType != 'INDEX' && current.title === cur.decorationName
          })
          if (cur.columnType != 'INDEX') {
            hasValue == -1 && total.push({
              title: cur.decorationName,
              list: [cur]
            }) && activeCollapse.push(cur.decorationName)
            hasValue != -1 && total[hasValue].list.push(cur)
          } else {
            total.push(cur)
          }
          return total
        }, [])
      });
      //自定义维度
      if (modelInfo['customDimensions'] != null && modelInfo['customDimensions']?.length) {
        collapseList[0].children.push({
          title: '自定义维度',
          icon: <IconSetupA onClick={this.gotoCustomPage} />,
          list: modelInfo['customDimensions']?.length ? [{
            id: uuid(),
            filterable: true,
            groupby: true,
            isCustomDimension: 1,
            showDataType: "SelectMulti",
            showName: '自定义维度',
            description: "自定义维度"
          }] : []
        })
      }
      //人群包/tag
      if (modelInfo.hasSegment || modelInfo.hasTag || modelInfo.hasUserTag) {
        let listArr = [];
        if (modelInfo.hasTag) {
          listArr.push({
            ...modelInfo?.tagModelVo,
            id: uuid(),
            icon: <IconSetupA onClick={() => this.gotoSegmentTagPage('/imp/nre-segment/create', 'NRE人群')} style={{ marginRight: '6px' }} />
          })
        }
        if (modelInfo.hasSegment) {
          listArr.push({
            ...modelInfo?.segmentModelVo,
            icon: <IconSetupA onClick={() => this.gotoSegmentTagPage('/imp/segment/create', '人群圈选')} style={{ marginRight: '6px' }} />
          })
        }
        if (modelInfo.hasUserTag) {
          listArr.push({
            ...modelInfo?.userTagModelVo,
            id: uuid()
          })
        }
        collapseList[0].children.push({
          title: 'Tag/人群包',
          list: listArr
        })
      }
      if (resOpenChart) {
        let oapTableFilterInfoArr = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapTableFilterInfo'))) || [];
        let hasIndex = oapTableFilterInfoArr.findIndex(it => it.sliceId == this.props?.sliceId);
        if (hasIndex != -1) {
          oapTableFilterInfoArr[hasIndex] = { sliceId: this.props?.sliceId, tableFilter: resOpenChart.taskResultCondition }
        } else {
          if (resOpenChart.taskResultCondition?.length) {
            oapTableFilterInfoArr.push({ sliceId: this.props?.sliceId, tableFilter: resOpenChart.taskResultCondition })
          }
        }
        console.log('resOpenChart', oapTableFilterInfoArr)
        if (oapTableFilterInfoArr.length) {
          sessionStorage.setItem('oapTableFilterInfo', encodeURIComponent(JSON.stringify(oapTableFilterInfoArr)));
        }
      }
      if (promiseAllList.length == 3) {
        formatTableDataTemp = this.formatTableData(resTaskPageResultPage);
      }
      this.setState({
        basicInfo: {
          ...this.state.basicInfo,
          sliceName: ['edit'].includes(this.props.type) ? resOpenChart?.sliceName : '',
          description: ['edit'].includes(this.props.type) ? resOpenChart?.description : '',
          id: ['edit'].includes(this.props.type) ? resOpenChart?.id : '',
          subjectName: modelInfo.name,
          name: `【${modelInfo.name}】${modelInfo.queryName}`,
          lastModifyAt: modelInfo.updateDataTime ? moment(modelInfo.updateDataTime).format('YYYY-MM-DD HH:mm:ss') : '---',
          queryStatus: ['edit'].includes(this.props.type) ? resOpenChart?.queryStatus : '',
          business: modelInfo.queryName,
        },
        collapseList,
        //activeCollapse:[],
        defCollapseList: collapseList,
        subjectId: resPrepareChart?.subjectId || '',//业务域ID
        isSegmentRequired: modelInfo?.isSegmentRequired,//是否筛选必选人群 0 不必选，1必选
        isTagRequired: modelInfo?.isTagRequired,//是否维度必选tag 0 不必选，1必选
        isUserTagRequired: modelInfo?.isUserTagRequired,//是否用户标签必选 0 不必选，1必选
        columns: formatTableDataTemp.tableCloumns,
        checkedValue: promiseAllList.length == 3 ? formatTableDataTemp.checkedValue : [],
        dataList: formatTableDataTemp && formatTableDataTemp.tempRecords ? formatTableDataTemp?.tempRecords.map((record, index) => {
          return { ...record, key: index }
        }) : [],
        pageNo: promiseAllList.length == 3 && resTaskPageResultPage ? resTaskPageResultPage.data?.page + 1 : null,
        total: promiseAllList.length == 3 && resTaskPageResultPage ? resTaskPageResultPage.data?.totalCount : null,
        runDataParams: {
          datasourceId: resPrepareChart?.modelId,
          datasourceName: modelInfo.name,
          tableName: modelInfo.tableName,
          vizType: "TABLE",
          params: {},
          queryContext: ""
        },
        noticeData: {
          visible: resPrepareChart?.hasMessage == 1,
          defaultOpen: resPrepareChart?.hasMessage == 1 && resPrepareChart?.isShow == 1,
          auto: resPrepareChart?.isShow == 1
        },
        isLoading: false
      }, () => {
        if (promiseAllList.length == 3 && resTaskPageResultPage) {
          if (resTaskPageResultPage.data?.isOver == 1) {
            message.warning('此数据已超过100000条，查询结果最多为100000条')
          }
        }
        this.timer = setTimeout(() => {
          this.setState((state) => ({
            noticeData: {
              ...state.noticeData,
              defaultOpen: false
            }
          }))
        }, 5000);
      })
      const queryContext = resOpenChart?.queryContext || '{"filters":[],"indexes":[],"sorts":[],"dimensions":[]}'
      let params = resOpenChart?.params || {};
      // 如果是复制
      if (['copy'].includes(this.props.type) && this.props?.localCopyUid) {
        // 此处需要掉用一个接口，查询存储的条件
        let localCondition = JSON.parse(localStorage.getItem(this.props.localCopyUid));
        this.setState({
          dragListConditions: localCondition.dragListConditions,
          dragList: localCondition.dragList,
        }, () => {
          localStorage.removeItem(this.props.localCopyUid);
        })
        return
      }
      if (!this.props?.sliceId && modelInfo.filters) params = { filters: modelInfo.filters };
      this.feedbackDragList(params, queryContext);
    } catch (err) {
      console.log(44444, err)
      err.msg && message.error(err.msg);
      this.setState({
        isLoading: false
      })
    }
  }

  //table 筛选
  getColumnSearchProps = (column) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
      let text = '按数值筛选', filterType = 'numerical';
      //人群/NRE/自定义维度
      if ((column.isSegment ?? '') != '' || (column.isTag ?? '') != '' || (column.isCustomDimension ?? '') != '' || (column.isUserTag ?? '') != '') {
        text = '按文本筛选', filterType = 'text';
      } else if (column.columnType.toUpperCase() == "DIMENSION") {
        //若 showDataType 是时间格式3种类型时间 或者 dataType（ck是包含date，trino是包含time），那就是用时间控件
        //若 dataType  是ck 包含string trino是包含varchar,并且不是时间控件，则下拉列表
        let isDate = false;
        if (['Date', 'DateUnlimited', 'DateTime'].includes(column.showDataType)) {
          isDate = true;
        } else if (this.props.tableType == TABLE_TYPE.ck) {
          if (column.dataType.toLowerCase().includes('date')) {
            isDate = true;
          }
        } else if (this.props.tableType == TABLE_TYPE.trino) {
          if (column.dataType.toLowerCase().includes('time')) {
            isDate = true;
          }
        }
        if (isDate) {
          text = '按时间筛选';
          filterType = 'time';
        } else if (!['Date', 'DateUnlimited', 'DateTime'].includes(column.showDataType)) {
          if (this.props.tableType == TABLE_TYPE.ck) {
            if (column.dataType.toLowerCase().includes('string')) {
              text = '按文本筛选';
              filterType = 'text';
            }
          } else if (this.props.tableType == TABLE_TYPE.trino) {
            if (column.dataType.toLowerCase().includes('varchar')) {
              text = '按文本筛选';
              filterType = 'text';
            }
          }
        }
      }
      const openTableFilter = () => {
        this.setState({
          tableFilterModalData: {
            visible: true,
            record: column,
            tableType: this.props.tableType,
            filterType,
            sliceId: this.props?.sliceId,
            isLoading: false
          }
        }, () => {
          confirm()
        })
      }
      const clearTableFilter = () => {
        let oapTableFilterInfoArr = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapTableFilterInfo'))) || [];
        let dupoOapTableFilterInfo = [], uniqueKey = 'id';
        if (column.isTag == 1) uniqueKey = 'tagId';
        console.log('clearTableFilter', oapTableFilterInfoArr)
        let oapTableFilterInfoArrTemp = oapTableFilterInfoArr.reduce((total, next) => {
          if (next.sliceId == this.props?.sliceId) {
            dupoOapTableFilterInfo = next.tableFilter.filter(it => it[uniqueKey] != column[uniqueKey])
            total.push({ sliceId: next.sliceId, tableFilter: dupoOapTableFilterInfo })
          } else {
            total.push(next)
          }
          return total
        }, []);
        sessionStorage.setItem('oapTableFilterInfo', encodeURIComponent(JSON.stringify(oapTableFilterInfoArrTemp)));
        close();
        this.confirmSaveTableFilter({ action: 'ok', taskResultCondition: [...dupoOapTableFilterInfo] });
      }
      return <Space direction="vertical" size={1}>
        <Button type="text" block style={{ textAlign: 'left', textIndent: '8px' }} onClick={clearTableFilter}>清除筛选条件</Button>
        <Button type="text" block style={{ textAlign: 'left', textIndent: '8px' }} onClick={openTableFilter}>{text}</Button>
      </Space >
    },
  })

  //处理table数据格式
  formatTableData = (resTaskPageResultPage) => {
    if (!resTaskPageResultPage?.data) {
      return { tableCloumns: [], checkedValue: [], tempRecords: [] }
    }
    const cloumns = resTaskPageResultPage.data?.columns || [];
    let tempRecords = resTaskPageResultPage.data?.records || [], tableCloumns = [], checkedValue = [];
    for (let j = 0; j < cloumns.length; j++) {
      tempRecords.forEach(record => {
        record[cloumns[j].showName] = cloumns[j].columnType === 'INDEX' && cloumns[j].isItThousands == 1 ? numToMoneyField(record[cloumns[j].showName], cloumns[j].precisions) : record[cloumns[j].showName];
      })
      const sortableFn = (key, columnType) => {
        let result = 0, arrSort = []
        return (a, b) => {
          arrSort = [a[key], b[key]].sort()
          if (a[key] != b[key]) {
            if (arrSort[0] == a[key]) {
              result = -1;
            } else {
              result = 1;
            }
          }
          return columnType == 'INDEX' ? (clearComma(a[key]) - clearComma(b[key])) : result
        }
      }
      tableCloumns[j] = {
        title: cloumns[j].showName,
        dataIndex: cloumns[j].showName,
        key: cloumns[j].showName,
        width: 200,
        align: 'left',
        ellipsis: true,
        sorter: sortableFn(cloumns[j].showName, cloumns[j].columnType),
        ...this.getColumnSearchProps(cloumns[j])
      }
      if (cloumns[j].segmentIndexType == 1) {
        tableCloumns[j].ellipsis = false;
        tableCloumns[j].render = (text, record) => {
          return <div key={record.key} className='oap-flex-between'>
            <span>{text}</span>
            {checkMyPermission('oap:home:createSeg') && <Tooltip placement="topLeft" title="创建为人群">
              <IconPeopleJudge style={{ color: '#4880ff' }} onClick={() => this.createSegment(cloumns[j].showName, record, cloumns)} />
            </Tooltip>}
          </div>
        }
      }
    }
    checkedValue = tableCloumns.map(it => it.dataIndex)
    return { tableCloumns, checkedValue, tempRecords }
  }

  //去自定义规则页面
  gotoCustomPage = () => {
    let pathname = "/oap/customRules", tabNameZh = '自定义规则';
    const params = {
      tabNameZh: tabNameZh,
      tabNameEn: tabNameZh,
      path: pathname,
    };
    this.saveTabActive();
    window.EventBus && window.EventBus.emit("setAppTab", null, params);
  }

  //去人群包页面
  gotoSegmentTagPage = (pathname, tabNameZh) => {
    const params = {
      tabNameZh: tabNameZh,
      tabNameEn: tabNameZh,
      path: pathname,
    };
    window.EventBus && window.EventBus.emit("setAppTab", null, params);
  }

  saveTabActive = () => {
    sessionStorage.setItem('oapHomeActiveTab', encodeURIComponent(JSON.stringify({
      activeTab: ['edit'].includes(this.props.type) ? this.state.basicInfo?.id : this.props.activeKey,
    })))
  }

  setSortStart = (classify, target) => {
    let dragFromClassify = classify;
    // filterable 是否可以拖动至filters , groupby 是否可以拖动至dimensions
    if (classify === 'dimensions' && target.item.dataset?.filterable === 'true') dragFromClassify = `${dragFromClassify}:filterable`;
    if (classify === 'dimensions' && target.item.dataset?.groupby === 'true') dragFromClassify = `${dragFromClassify}:groupby`;
    //tag 、用户标签 不能拖至排序
    if (classify === 'dimensions' && target.item.dataset?.istag === '1') dragFromClassify = `${dragFromClassify}:istag`;
    if (classify === 'dimensions' && target.item.dataset?.isusertag === '1') dragFromClassify = `${dragFromClassify}:isusertag`;
    this.setState({
      dragFromClassify,
      dragItemId: target.item?.dataset.id
    }, () => {
      console.log(2323, dragFromClassify)
    })
  }

  setDragBoxSortStart = (boxIndex, target) => {
    let dragFromClassify = target.item?.dataset.classify;
    //自定义规则、人群包、NRE暂不支持互相拖拽
    if (['tag', 'segment', 'custom'].includes(target.item.dataset?.tagsegment)) return;
    // filterable 是否可以拖动至filters , groupby 是否可以拖动至dimensions
    if (dragFromClassify === 'dragDimensions' && target.item.dataset?.filterable === 'true') dragFromClassify = `${dragFromClassify}:filterable`;
    if (dragFromClassify === 'dragFilter' && target.item.dataset?.groupby === 'true') dragFromClassify = `${dragFromClassify}:groupby`;
    this.setState({
      dragFromClassify,
      dragFromIndex: boxIndex,
      //dragItemId: null,
      dragItemId: target.item?.dataset.id,
      dragFromIscascade: target.item?.dataset.cascade,
      dragItemTargetId: target.item?.dataset.id
    })
  }

  setDragBoxSortEnd = (boxIndex, target, dragBox) => {
    let { dragList, dragListConditions, dragItemId, dragFromIscascade, dragFromClassify, sortNewArr, dragToFlag } = this.state;
    //判断是否是组内拖动
    // if (dragItemId == null && dragFromClassify == 'dragFilter') {
    //     console.log('setDragBoxSortEnd 组内')
    //     //级联
    //     if (dragFromIscascade == 1) {
    //         dragList[0].children = [...sortNewArr];
    //         dragListConditions['filters'] = [...sortNewArr];
    //         this.setState({ dragList, dragListConditions })
    //     }
    // }
    this.setState({
      dragFromClassify: '',
      dragFromIndex: null,
      dragItemId: null,
      dragItemTargetId: null
    })
  }

  // 拖拽
  setSortableList = (newState, index) => {
    let { dragList, dragListConditions, dragFromIscascade, dragItemTargetId, dragFromClassify } = this.state;
    let item = dragList[index],
      copyNewState = JSON.parse(JSON.stringify(newState)),
      noRepeatObj = {},
      cascadeArrFirth = dragListConditions['filters'].findIndex(itm => itm.isCascade),
      cascadeArrLength = dragListConditions['filters'].filter(itm => itm.isCascade).length,
      dragFromClassifyArr = dragFromClassify.split(':');//dragFilter:groupby
    //判断是否是组内拖动
    if (dragFromClassifyArr.includes(item.flag)) { //this.state.dragItemId == null
      if (dragFromClassifyArr.includes('dragFilter')) {  //dragFromClassify == 'dragFilter'
        const toIndex = newState.findIndex(itm => {
          return itm.id == dragItemTargetId
        })
        let otherArr = [], cascadeArr = [];
        //级联
        if (dragFromIscascade == 1) {
          dragListConditions['filters'].forEach(itm => {
            if (itm.isCascade) {
              cascadeArr.push(itm)
            } else {
              otherArr.push(itm)
            }
          })
          cascadeArr.forEach((field, fieldIdx) => {
            otherArr.splice(toIndex + fieldIdx, 0, field)
          })
          this.setState({ sortNewArr: otherArr })
          return;
        } else {
          const currentItemIndex = dragListConditions['filters'].findIndex(itm => itm.id == dragItemTargetId)
          if (toIndex > cascadeArrFirth) {
            if (currentItemIndex > toIndex && toIndex <= (cascadeArrFirth + cascadeArrLength - 1)) {
              return
            } else if (currentItemIndex < toIndex && toIndex < (cascadeArrFirth + cascadeArrLength - 1)) {
              return
            }
          } else if (toIndex == cascadeArrFirth && currentItemIndex < cascadeArrFirth) {
            return
          }
        }
      }
      item.children = [...newState];
      dragListConditions[item.label] = [...newState];
      this.setState({ dragList, dragListConditions })
      return;
    }
    //是否有权限
    if (!this.hasRightLegal(item)) return;
    //级联，一拖三
    if (item.label == 'filters') {
      newState.forEach((child, childIdx) => {
        if (child.isCascade && child.cascadeField) {
          let cascadeFieldArr = [...child.cascadeField]
          cascadeFieldArr.reverse().forEach(field => {
            copyNewState.splice(childIdx, 0, field)
          })
        }
      })
    }
    //去重
    let noRepeatNewState = copyNewState.reduce((cur, next) => {
      if (next.isTag == 1 || next.isCustomDimension == 1) {
        cur.push(next);
      } else if (!noRepeatObj[next?.id]) {
        noRepeatObj[next?.id] = true;
        cur.push(next);
      } else if (next.filterValues || next.condition || next.segmentList) {
        cur[cur.findIndex(p => p.id == next.id)] = next;
      }
      return cur
    }, []);

    let visibleConditon = false;
    if (['filters'].includes(item.label)) {
      visibleConditon = true;
      //级联放一起
      const sliceArr = noRepeatNewState.slice(cascadeArrFirth, (cascadeArrFirth + cascadeArrLength))
      const judgeHasC = sliceArr.findIndex(itm => !itm.isCascade)
      if (judgeHasC != -1) {
        const sliceItem = noRepeatNewState.splice(cascadeArrFirth + judgeHasC, 1)
        noRepeatNewState.splice(cascadeArrFirth + cascadeArrLength, 0, sliceItem[0])
        item.children = [...noRepeatNewState];
        dragListConditions[item.label] = [...noRepeatNewState];
      }
      //最多拖拽5个
      // if (tempItemObj?.isUserTag) {
      //   const isUserTagArrs = item.children.filter(child => child.isUserTag)
      //   if (isUserTagArrs?.length >= 5) {
      //     message.warning('最多可添加5个用户标签条件')
      //     return
      //   }
      // }
    } else if (['sorts'].includes(item.label)) {
      visibleConditon = true;
    } else {
      let tempItemObj = noRepeatNewState.find(item => item.id == this.state.dragItemId)
      if (['indexes'].includes(item.label) && tempItemObj && tempItemObj?.hasCondition) {
        visibleConditon = true;
      } else if (['dimensions'].includes(item.label) && tempItemObj && (tempItemObj?.isSegment || tempItemObj?.isTag || tempItemObj?.isCustomDimension || tempItemObj?.isUserTag)) { //人群/tag/自定义规则/用户标签
        //【维度】中的，用户标签/NRE 最多拖拽5个
        if (tempItemObj?.isUserTag) {
          const isUserTagArr = item.children.filter(child => child.isUserTag)
          if (isUserTagArr?.length >= 5) {
            message.warning('最多可添加5个用户标签维度')
            return
          }
        }
        if (tempItemObj?.isTag) {
          const isTagArr = item.children.filter(child => child.isTag)
          if (isTagArr?.length >= 5) {
            message.warning('最多可选择5个NRE人群')
            return
          }
        }
        visibleConditon = true;
      } else {
        item.children = [...noRepeatNewState];
        dragListConditions[item.label] = [...noRepeatNewState];
      }
    }
    this.setState({
      dragList,
      dragListConditions,
      visibleConditon,
      classifyConditon: item.label,
      itemConditon: noRepeatNewState.find(item => item.id == this.state.dragItemId),
      childCondition: noRepeatNewState,
      currentConditionIndex: noRepeatNewState.findIndex(item => {
        return item.id == this.state.dragItemId
      }),
      dragToFlag: item.flag
    })
  }

  hasRightLegal = (item) => {
    const rightLegal = item.classify
    const leftLegal = this.state.dragFromClassify
    if (rightLegal.includes(leftLegal)) {
      return true
    }
    return false
  }

  handleEdit = (classify, id, index) => {
    this.setState({
      visibleConditon: true,
      classifyConditon: classify,
      itemConditon: this.state.dragListConditions[classify].find((condition) => condition.id == id),
      childCondition: this.state.dragListConditions[classify],
      currentConditionIndex: index,
    })
  }

  handleDelete = (dragIdx, listIdx) => {
    const that = this
    let dragList = [...that.state.dragList],
      dragListConditions = { ...that.state.dragListConditions },
      cascadeUpThanThisLayer = []; //级联时，本层及下层的id
    if (dragList[dragIdx].label === 'filters' && dragList[dragIdx].children[listIdx].isCascade) {
      let hasIndex = dragList[dragIdx].children[listIdx].extendIds.findIndex(extendIdsItem => extendIdsItem === dragList[dragIdx].children[listIdx].id);
      if (hasIndex != -1) {
        cascadeUpThanThisLayer = dragList[dragIdx].children[listIdx].extendIds.filter((extendIdsItem, extendIdsIndex) => extendIdsIndex >= hasIndex)
      }
    }
    let tempArr = dragListConditions[dragList[dragIdx].label].filter(item => {
      //如果是级联且是筛选，删除的是本层及下层
      if (dragList[dragIdx].label === 'filters' && item.isCascade) {
        if (cascadeUpThanThisLayer.length) {
          return !cascadeUpThanThisLayer.includes(item.id)
        }
      }
      return item.id != dragList[dragIdx].children[listIdx].id
    })
    if (dragList[dragIdx].label === 'filters' && dragList[dragIdx].children[listIdx].isCascade) {
      dragList[dragIdx].children = [...tempArr];
    } else {
      dragList[dragIdx].children.splice(listIdx, 1)
    }
    that.setState({
      dragList,
      dragListConditions: {
        ...dragListConditions,
        [dragList[dragIdx].label]: tempArr
      },
      classifyConditon: '',
      itemConditon: {},
      childCondition: []
    })
  }

  changeSetConditionVisible = (visible) => {
    this.setState({
      visibleConditon: visible,
    })
  }

  handCompleteSet = (data) => {
    let { childCondition, dragList, dragListConditions, currentConditionIndex } = this.state;
    let tempChild = childCondition.reduce((total, cur, index) => {
      if (cur.isUserTag == 1 && data?.isUserTag == 1) {
        const isExist4 = childCondition.findIndex(totalItm => totalItm.id == data.form.showName?.value);
        //let keyName = data.classify == 'filters' ? 'filterValues' : 'usertagValues';
        console.log('handCompleteSet', cur, data.form, isExist4)
        if (isExist4 == -1) {
          if (cur.id == data.form.id) {
            total.push({
              ...data.form,
              id: data.form.showName.id,
              showName: data.classify == 'filters' ? data.form.showName.label : `${data.form.showName.label}-${data.form.usertagValues[0].version}`,
              isUserTag: data.isUserTag,
              userTag: data.userTag
            })
          } else {
            total.push({ ...cur })
          }
        }
        // else {
        //   if (cur.id == data.form.showName.value) {
        //     if (index == currentConditionIndex) {
        //       total.push({ ...cur, forShowList: data.form.forShowList, filterValues: data.form.filterValues })
        //     }
        //   } else {
        //     if (index == currentConditionIndex) {
        //       total.push({ ...data.form, id: data.form.showName.id, showName: data.form.showName.label, isUserTag: data.isUserTag, userTag: data.userTag })
        //     } else {
        //       total.push({ ...cur })
        //     }
        //   }
        // }
      } else if (cur.isCustomDimension == 1 && data?.isCustomDimension == 1 && data.classify == 'filters') {
        const isExist3 = childCondition.findIndex(totalItm => totalItm.id == data.form.showName?.value)
        if (isExist3 == -1) {
          if (cur.id == data.form.id) {
            total.push({ ...data.form, id: data.form.showName.value, showName: data.form.showName.label })
          } else {
            total.push({ ...cur })
          }
        } else {
          if (cur.id == data.form.showName.value) {
            if (index == currentConditionIndex) {
              total.push({ ...cur, forShowList: data.form.forShowList, filterValues: data.form.filterValues })
            }
          } else {
            if (index == currentConditionIndex) {
              total.push({ ...data.form, id: data.form.showName.value, showName: data.form.showName.label })
            } else {
              total.push({ ...cur })
            }
          }
        }
      } else if (cur?.id === data.form?.id && ['tag', 'segment', 'custom'].includes(data.tagSegment)) {
        if (['tag'].includes(data.tagSegment)) {
          const isExist = childCondition.findIndex(totalItm => totalItm.tagId == data.form.tagSelected?.value)
          if (isExist == -1) {
            total.push({
              showName: data.form.tagSelected.label,
              isTag: 1,
              tagId: data.form.tagSelected.value
            })
          }
        } else if (['custom'].includes(data.tagSegment)) {
          const isExist2 = childCondition.findIndex(totalItm => totalItm.id == data.form.tagSelected?.value)
          if (isExist2 == -1) {
            total.push({
              showName: data.form.tagSelected.label,
              isCustomDimension: 1,
              id: data.form.tagSelected.value
            })
          }
        } else {
          total.push({ ...cur, ...data.form })
        }
      } else if (cur?.id === data.form?.id && !data.isCascade) {
        total.push({ ...cur, ...data.form })
      } else if (data.isCascade && cur.isCascade) {
        console.log('handCompleteSet', cur, data)
        if (data.classify === 'filters') {
          data.form['conditionalFormat'].forEach((cascadeItem, cascadeIndex) => {
            let totalFind = total.find(totalItem => totalItem.id === cascadeItem.id)
            console.log('handCompleteSet 11', totalFind, cascadeItem)
            if (!totalFind) {
              total.push({
                ...cascadeItem,
                logicalOperator: cascadeIndex == 0 ? cascadeItem.logicalOperator : 'AND',
                cascadeIndexChoosed: cascadeIndex
              })
            }
          })
        } else if (data.classify === 'sorts') {
          total.push(data.form);
        }
      } else if (data?.isCustomDimension == 1 && data.classify == 'sorts' && !cur.name) {
        const isExist5 = childCondition.findIndex(totalItm => totalItm.id == data.form.id)
        if (isExist5 == -1) {
          total.push({ ...data.form });
        }
      } else {
        total.push(cur);
      }
      return total;
    }, [])
    dragList.forEach(dragItem => {
      if (dragItem.label === data.classify) {
        dragItem.children = [...tempChild];
      }
    })
    dragListConditions[data.classify] = [...tempChild];
    //人群包:人群包维度添加后，自动在筛选范围内增加人群包的筛选条件
    if (['segment'].includes(data.tagSegment)) {
      const isExistInDe = dragList[1].children.some(child => child.isSegment)
      const isExistInFil = dragList[0].children.some(child => child.isSegment)
      const segmentChild = {
        ...data.form,
        filterValues: [{
          compareOperator: 'in',
          comparator: data.form.segmentList.map(i => i.value),
          logicalOperator: 'AND'
        }],
        forShowList: data.form.segmentList,
        columnName: data.form.showName,
        tagSegment: data.tagSegment
      }
      if (data.classify == "dimensions" && isExistInDe && !isExistInFil) {
        dragList[0].children.push(segmentChild);
        dragListConditions['filters'].push(segmentChild);
      }
    }
    this.setState({
      dragList,
      dragListConditions
    })
  }

  handleAnalysisEdit = () => {
    this.setState({
      visibleBasicInfo: true
    })
  }

  handleParams = (action, formData) => {
    let params = {},
      queryContext = { filters: [], indexes: [], sorts: [], dimensions: [] },
      { segemntModalData } = this.state;
    for (let key in this.state.dragListConditions) {
      params[key] = this.state.dragListConditions[key];
      if (key == 'filters') {
        let temp = params[key].reduce((total, child) => {
          //去除未填写完整的条件
          if (child.isCascade) {
            total.push(child)
          } else {
            if (child.filterValues && child.filterValues.length) {
              let temp = child.filterValues.filter(condition => {
                return (condition.comparator ?? '') !== '' && (condition.compareOperator ?? '') !== '' && condition.comparator.length != 0
              })
              temp.length && total.push({
                ...child,
                filterValues: temp.map((tempItem, tempIdx) => {
                  return tempIdx == 0 ? {
                    ...tempItem,
                    logicalOperator: ''
                  } : { ...tempItem }
                })
              })
            }
          }
          return total
        }, [])
        params[key] = [...temp]
      } else if (key === 'sorts') {
        params[key] = params[key].map(item => {
          return {
            direction: item?.direction || 'desc',
            id: item.id,
            showName: item.showName
          }
        })
      } else if (key == 'dimensions' && action == 'saveSegment') {
        params[key].forEach(item => {
          const hasIndex = segemntModalData.cloumns.findIndex(k => k.id == item.id);
          if (hasIndex != -1) {
            item.segmentParams = segemntModalData.record[segemntModalData.cloumns[hasIndex].showName]
          }
        })
      }
    }
    return {
      ...this.state.runDataParams,
      params,
      queryContext: JSON.stringify(queryContext)
    }
  }

  //运行按钮
  handleExplore = () => {
    // 判断是否拖拽过
    const hasDraged = this.state.dragList.some(dragItem => {
      return dragItem.children.length
    })
    if (!hasDraged) {
      message.warning('请先完成拖拽')
      return
    }
    let commitParams = this.handleParams();
    //排序字段需存在于维度中
    let result = [];
    if (commitParams.params.sorts.length) {
      result = this.isExistArr(commitParams.params.sorts, commitParams.params.dimensions, 'id')
    }
    if (result.length) {
      message.warning('所有排序需存在于维度中')
      return;
    }
    //指标必填---0325增加校验
    if (!this.state.dragList[2].children.length) {
      message.warning('请至少选择一个指标')
      return
    }
    //筛选里人群包是否必选
    if (this.state.isSegmentRequired) {
      const judgeSegmentRequired = this.state.dragList[0].children.some(child => child.isSegment)
      if (!judgeSegmentRequired) {
        message.warning('人群包必选，请拖动【人群包】至筛选中')
        return
      }
    }
    //维度里tag是否必选
    const nreTagArr = this.state.dragList[1].children.filter(child => child.isTag)
    if (this.state.isTagRequired) {
      if (!nreTagArr.length) {
        message.warning('人群包必选，请拖动【tag包】至维度中')
        return
      }
    }
    //最多可添加5个NRE人群
    if (nreTagArr.length > 5) {
      message.warning('最多可选择5个NRE人群dd')
      return;
    }
    //用户标签是否必选
    if (this.state.isUserTagRequired) {
      const judgeUserTagRequired = this.state.dragList[0].children.some(child => child.isUserTag)
      if (!judgeUserTagRequired) {
        message.warning('用户标签必选，请拖动【用户标签】至筛选中')
        return
      }

    }
    //用户标签最多5个
    const userTagArr = this.state.dragList[1].children.filter(child => child.isUserTag)
    if (userTagArr.length > 5) {
      message.warning('最多可添加5个用户标签维度')
      return;
    }
    //如果是新增页面 或者 复制查询条件 或者 模板
    if (['create', 'copy', 'template'].includes(this.props.type)) {
      this.setState({
        visibleBasicInfo: true
      })
      return;
    }
    Modal.confirm({
      title: '提示',
      content: (<>重新运行会覆盖原数据结果</>),
      cancelText: "取消",
      okText: "继续",
      onOk: () => {
        this.handleBasicInfoAsync('edit')
      }
    });
  }

  //过滤维度、指标
  handleSearch = (str) => {
    let collapseList = [...this.state.defCollapseList],
      keyWords = str || ''; // this.queryKeyWords.current.input.value.trim();
    if (!keyWords) {
      this.setState({
        collapseList
      })
      return;
    }
    let arr = collapseList.reduce((total, collapse) => {
      if (collapse.label == 'indexes') {
        let tempIndex = collapse.children.filter(item => {
          return item.showName.toLowerCase().includes(keyWords.toLowerCase())
        })
        tempIndex.length && total.push({
          ...collapse,
          children: [...tempIndex]
        })
      } else {
        let temp = collapse.children.reduce((cur, next) => {
          let temList = next.list.filter(item => {
            let name = item.showName;
            return name.toLowerCase().includes(keyWords.toLowerCase())
          })
          temList.length && cur.push({
            ...next,
            list: [...temList]
          })
          return cur
        }, [])
        temp.length && total.push({
          ...collapse,
          children: [...temp]
        })
      }
      return total
    }, [])
    this.setState({
      collapseList: arr,
      activeCollapse: arr.length && arr[0].children[0]?.title
    }, () => {
      //console.log(232323,arr,this.state.activeCollapse)
    })
  }

  //已分析过的数据回显
  feedbackDragList = (params, queryContext) => {
    let dragList = [...this.state.dragList],
      initQueryContext = JSON.parse(queryContext),
      obj = JSON.parse(JSON.stringify(this.state.dragListConditions))
    for (let key in params) {
      switch (key) {
        case 'dimensions':
          obj['dimensions'] = params[key].reduce((total, paramsItem) => {
            let hasValue = initQueryContext[key].findIndex(current => {
              return current.id == paramsItem.id
            })
            hasValue != -1 && total.push({
              ...paramsItem,
              queryContext: initQueryContext[key][hasValue]
            })
            hasValue == -1 && total.push({
              ...paramsItem
            })
            return total
          }, [])
          dragList[1].children = [...params[key]]
          break;
        case 'indexes':
          obj['indexes'] = params[key].reduce((total, paramsItem) => {
            let hasValue = initQueryContext[key].findIndex(current => {
              return current.id == paramsItem.id
            })
            hasValue != -1 && total.push({
              ...paramsItem,
              queryContext: initQueryContext[key][hasValue],
              runDataParams: {
                aggregate: paramsItem.aggregate,
                columnName: paramsItem.name
              }
            })
            hasValue == -1 && total.push({
              ...paramsItem
            })
            return total
          }, [])
          dragList[2].children = [...obj['indexes']]
          break;
        case 'filters':
          obj['filters'] = params[key].reduce((total, paramsItem) => {
            let hasValue = initQueryContext[key] ? initQueryContext[key].findIndex(current => {
              return current.id == paramsItem.id
            }) : -1
            let tempObj = { ...paramsItem };
            hasValue != -1 && total.push({
              ...tempObj,
              //queryContext:initQueryContext[key][hasValue]
            })
            hasValue == -1 && total.push(tempObj)
            return total
          }, [])
          dragList[0].children = [...obj.filters]
          break;
        case 'sorts':
          obj['sorts'] = params[key].reduce((total, paramsItem) => {
            let hasValue = initQueryContext[key] ? initQueryContext[key].findIndex(current => {
              return current.id == paramsItem.id
            }) : -1
            hasValue != -1 && total.push({
              ...paramsItem,
              queryContext: initQueryContext[key][hasValue]
            })
            hasValue == -1 && total.push(paramsItem)
            return total
          }, [])
          dragList[3].children = [...obj.sorts]
          break;
      }
    }
    this.setState({
      dragListConditions: obj,
      dragList
    })
  }

  // 左右拽-改变宽度
  darggableWidth = (e, idName) => {
    let resize = document.getElementById(idName);
    let leftBox = document.getElementById(this.state.leftBoxId);
    let middleBox = document.getElementById(this.state.middleBoxId);
    let rightBox = document.getElementById(this.state.rightBoxId);
    let bigBox = document.getElementById(this.state.bigBoxId);
    let startX = e.clientX;
    resize.left = resize.offsetLeft;
    document.onmousemove = function (e) {
      let endX = idName.includes('resizeBox1') ? e.clientX + 3 : e.clientX - 13;
      let moveLen = idName.includes('resizeBox1') ? resize.left + (endX - startX) : resize.left + (endX - startX) - leftBox.offsetWidth;
      let maxT = idName.includes('resizeBox1') ? bigBox.clientWidth - middleBox.offsetWidth - resize.offsetWidth : bigBox.clientWidth - leftBox.offsetWidth - resize.offsetWidth;
      if (moveLen < 160) moveLen = 160;
      if (moveLen > maxT - 160) moveLen = maxT - 160;
      resize.style.left = moveLen;
      if (idName.includes('resizeBox1')) {
        leftBox.style.width = (moveLen - 3) + "px";
        rightBox.style.width = (bigBox.clientWidth - moveLen - middleBox.offsetWidth - 32) + "px";
      } else {
        middleBox.style.width = (moveLen - 3) + "px";
        rightBox.style.width = (bigBox.clientWidth - moveLen - leftBox.offsetWidth - 32) + "px";
      }
    }
    document.onmouseup = function (evt) {
      document.onmousemove = null;
      document.onmouseup = null;
      resize.releaseCapture && resize.releaseCapture();
    }
    resize.setCapture && resize.setCapture();
    return false;
  }

  // 上下拽-改变高度
  darggableHeight = (e, index) => {
    let resize = document.getElementById(`midResizeBox${index}`), that = this;
    let top = document.getElementById(`analysisDrag${index}`);
    let startY = e.clientY, topY = top.offsetTop;
    resize.top = resize.offsetTop;
    document.onmousemove = function (e) {
      let endY = e.clientY;
      let moveLen = resize.top + (endY - startY) - topY;
      if (moveLen > 500) moveLen = 500;
      resize.style.top = moveLen;
      top.style.height = moveLen + 'px';
      if (index == 3) document.getElementsByClassName('ant-tabs-content ant-tabs-content-top')[1].scrollTop = document.getElementsByClassName('ant-tabs-content ant-tabs-content-top')[1].scrollHeight;
    }
    document.onmouseup = function (evt) {
      document.onmousemove = null;
      document.onmouseup = null;
      resize.releaseCapture && resize.releaseCapture();
    }
    resize.setCapture && resize.setCapture();
    return false;
  }

  //基础信息弹框的保存与取消
  handleBasicModal = (btnTxt) => {
    if (btnTxt == 'ok') {
      this.formRefBasicInfo.current.validateFields().then(values => {
        if (['edit'].includes(this.props.type)) {
          Modal.confirm({
            title: '提示',
            content: (<>重新运行会覆盖原数据结果</>),
            cancelText: "取消",
            okText: "继续",
            zIndex: 1200,
            onOk: () => {
              this.handleBasicInfoAsync()
            }
          });
        } else {
          this.handleBasicInfoAsync();
        }
      }).catch(errorInfo => {
        console.log('Failed:', errorInfo);
      })
      return;
    }
    this.setState({
      visibleBasicInfo: false
    })
  }

  //异步：保存并运行
  handleBasicInfoAsync = async (flag = '') => {
    const values = flag == '' && await this.formRefBasicInfo.current.validateFields();
    // 埋点start
    const currentUserInfo = localStorage.getItem('USER_INFO');
    let _operatorId = '', _operatorName = '', _sliceId = null;
    if (currentUserInfo) {
      let info = JSON.parse(currentUserInfo);
      _operatorId = info?.employeeNumber;
      _operatorName = `${info?.chineseName}（${info?.firstName} ${info?.lastName}）`;
    }
    console.log('props = ', this.props);
    if (this.props.type === 'edit') {
      _sliceId = this.props.sliceId;
    }
    // const obj = {
    // business: this.state.basicInfo.business, // this.props.business,
    // businessId: this.props.modelId,
    // businessDomain: this.state.basicInfo.subjectName,
    // tableType: 0,
    // sliceName: values?.sliceName || this.state.basicInfo?.sliceName,
    // sliceId: _sliceId,
    // operatorId: _operatorId,
    // operatorName: _operatorName,
    // }
    // console.log('obj = ', obj);
    // runAnalysisTaskForSelfCheckout(obj).then(res => {
    // console.log('埋点成功')
    // }).catch(() => {
    // console.log('埋点失败')
    // })
    // 埋点over
    try {
      let commitParams = this.handleParams()
      commitParams = {
        ...commitParams,
        sliceName: values?.sliceName || this.state.basicInfo?.sliceName,
        description: values.description || this.state.basicInfo?.description || '',
        id: this.state.basicInfo.id || null,
        subjectId: this.state.subjectId,
      }
      console.log('saveChart', commitParams)
      //return
      this.setState({
        exploreLoading: true,
        isLoading: true,
      }, () => {
        const saveChartApi = this.props.tableType == 0 ? saveChart : saveChartTrino;
        saveChartApi(commitParams).then(res => {
          const that = this;
          console.log('xxxx保存后 res = ', res);
          if (res.msg == 'success') {
            runAnalysisTaskForSelfCheckout({ sliceId: res.data.id || null }).then(() => {
              console.log('埋点成功')
            }).catch((err) => {
              console.log('埋点失败')
              message.error(err.msg || '埋点失败')
            })
            this.setState({
              visibleBasicInfo: false,
              exploreLoading: false,
              //isLoading:false
            }, () => {
              message.success('保存成功', 2, function () {
                that.props.onBack();
              })
            })
          }
        }).catch(err => {
          message.error(err?.msg || '保存并运行失败，请联系开发人员');
          this.setState({
            visibleBasicInfo: false,
            exploreLoading: false,
            isLoading: false
          })
        })
      })
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  }

  isExistArr = (arr1, arr2, key) => {
    let result = [];
    arr1.forEach(arr1Item => {
      if (arr2.findIndex(arr2Item => arr2Item[key] === arr1Item[key]) == -1) {
        result.push(arr1Item)
      }
    })
    return result;
  }

  //异步：下载
  downLoadAsync = () => {
    const downLoadApi = this.props.tableType == 0 ? downloadAsync : downloadAsyncTrino;
    this.setState((state) => ({
      ...state,
      emailModalData: {
        ...state.emailModalData,
        visibleEmailInfo: true,
        downLoadApi,
        downLoadParams: {
          id: this.props?.sliceId
        }
      }
    }))
  }

  getData = async (id) => {
    this.setState({ isLoading: true })
    try {
      const taskPageResultPageApi = this.props.tableType == 0 ? taskPageResultPage : taskPageResultPageTrino;
      let resData = await taskPageResultPageApi({ id, size: this.state.pageSize, page: this.state.pageNo - 1 });
      let formatTableDataTemp = {};
      formatTableDataTemp = this.formatTableData(resData.data);
      this.setState({
        columns: formatTableDataTemp?.tableCloumns,
        checkedValue: formatTableDataTemp?.checkedValue,
        dataList: formatTableDataTemp && formatTableDataTemp.tempRecords ? formatTableDataTemp?.tempRecords.map((record, index) => {
          return { ...record, key: index }
        }) : [],
        pageNo: resData.data ? resData.data.data?.page + 1 : null,
        total: resData.data ? resData.data.data?.totalCount : null,
        isLoading: false
      })
    } catch (err) {
      err.msg && message.error(err.msg);
      this.setState({
        isLoading: false
      })
    }
  }

  //复制查询条件
  handleCopy = () => {
    // 先把当前的条件存到浏览器缓存中
    let uid = uuid();
    const conditionObj = {
      dragListConditions: JSON.parse(JSON.stringify(this.state.dragListConditions)),
      dragList: JSON.parse(JSON.stringify(this.state.dragList)),
    }
    localStorage.setItem(uid, JSON.stringify(conditionObj));
    this.props.onCreate('copy', { ...this.props, localCopyUid: uid });
  }

  handleExploreForDownloadData = (data) => {
    console.log('handleExploreForDownloadData', data)
    if (data.operation === 'ok') {
      const res = data.downResponse;
      const url = window.URL.createObjectURL(new Blob([res.fileBlob], { type: 'application/octet-stream' }))
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      let downName = res.fileName.replace(/"|'/g, '');
      link.setAttribute('download', downName);
      document.body.appendChild(link)
      link.click();
      document.body.removeChild(link);
      this.setState((state) => ({
        ...state,
        isLoading: false,
        emailModalData: {
          ...state.emailModalData,
          visibleEmailInfo: false,
          isLoading: false,
        }
      }))
    } else if (data.operation === 'cancel') {
      this.setState((state) => ({
        ...state,
        emailModalData: {
          ...state.emailModalData,
          visibleEmailInfo: false,
          isLoading: false,
        }
      }))
    }
  }

  handleExploreForDownloadData2 = (data) => {
    if (data.operation === 'ok') {
      if (this.state.emailModalData.isStaff) {
        console.log('雇员取当前用户的邮箱，非雇员才取输入的邮箱')
      }
      this.setState((state) => ({
        ...state,
        isLoading: true,
        emailModalData: {
          ...state.emailModalData,
          isLoading: true,
        }
      }), () => {
        const downObj = {
          id: this.props?.sliceId,
          email: data.emailStr ?? '',
        }
        downloadAsync(downObj).then(res => {
          const url = window.URL.createObjectURL(new Blob([res.data.fileBlob], { type: 'application/octet-stream' }))
          const link = document.createElement('a');
          link.style.display = 'none';
          link.href = url;
          let downName = res.data.fileName.replace(/"|'/g, '');
          link.setAttribute('download', downName);
          document.body.appendChild(link)
          link.click();
          document.body.removeChild(link);
          this.setState((state) => ({
            ...state,
            isLoading: false,
            emailModalData: {
              ...state.emailModalData,
              visibleEmailInfo: false,
              isLoading: false,
            }
          }))
        }).catch(err => {
          message.error('下载失败');
          this.setState({
            isLoading: false
          })
        })
      })
    } else if (data.operation === 'cancel') {
      this.setState((state) => ({
        ...state,
        emailModalData: {
          ...state.emailModalData,
          visibleEmailInfo: false,
          isLoading: false,
        }
      }))
    }
  }

  handleTemplate = () => {
    const { dragList, runDataParams, subjectId } = this.state;
    // 判断是否拖拽过
    const hasDraged = dragList.some(dragItem => {
      return dragItem.children.length
    })
    if (!hasDraged) {
      message.warning('请先完成拖拽')
      return
    }
    let commitParams = this.handleParams();
    //排序字段需存在于维度中
    let result = [];
    if (commitParams.params.sorts.length) {
      result = this.isExistArr(commitParams.params.sorts, commitParams.params.dimensions, 'id')
    }
    if (result.length) {
      message.warning('所有排序需存在于维度中')
      return;
    }
    //指标必填---0325增加校验
    if (!dragList[2].children.length) {
      message.warning('请至少选择一个指标')
      return
    }
    this.setState({
      templateModalData: {
        visible: true,
        subjectId: subjectId, //业务域id
        businessId: runDataParams.datasourceId, //业务id
        subjectModelList: this.props?.subjectModelList,
        isLoading: false
      }
    })
  }

  confirmSaveTemplate = (data) => {
    const { templateModalData } = this.state;
    if (data.operation == 'ok') {
      const paramsObj = this.handleParams()
      //自定义维度、NRE人群、人群包条件暂不支持保存为系统模板
      if (data.formData.publicType) {
        for (let key in paramsObj.params) {
          if (['filters', 'dimensions'].includes(key)) {
            const hasValue = paramsObj.params[key].findIndex(paramsItm => {
              return (paramsItm.isCustomDimension && paramsItm.isCustomDimension == 1) || (paramsItm.isSegment && paramsItm.isSegment == 1) || (paramsItm.isTag && paramsItm.isTag == 1)
            })
            if (hasValue != -1) {
              message.warning('自定义维度、NRE人群、人群包条件暂不支持保存为系统模板')
              return
            }
          }
        }
      }
      this.setState({
        isLoading: true,
        templateModalData: {
          ...templateModalData,
          isLoading: true,
        }
      }, () => {
        const commitParams = {
          ...data.formData,
          businessId: templateModalData.businessId, //业务id
          templateParams: paramsObj.params,
          isDelete: 0,
          queryContext: paramsObj.queryContext
        }
        let requestApi = data.formData.publicType ? saveTemplateInfoByPublic : saveTemplateInfo;
        requestApi(commitParams).then(res => {
          this.setState({
            isLoading: false,
            templateModalData: {
              ...templateModalData,
              isLoading: false,
              visible: false,
            }
          }, () => {
            message.success('模板保存成功')
          })
        }).catch(err => {
          err.msg && message.error(err.msg);
          this.setState({
            isLoading: false,
            templateModalData: {
              ...templateModalData,
              isLoading: false,
              visible: false,
            }
          })
        })
      })
    } else if (data.operation === 'cancel') {
      this.setState({
        templateModalData: {
          ...templateModalData,
          visible: false,
        }
      })
    }
  }

  openChange = (newOpen, auto) => {
    const { noticeData } = this.state;
    this.setState({
      noticeData: {
        ...noticeData,
        defaultOpen: newOpen,
        auto
      }
    })
  }

  //创建为人群
  createSegment = (key, record, cloumns) => {
    const { segemntModalData } = this.state;
    this.setState({
      segemntModalData: {
        ...segemntModalData,
        visible: true,
        record,
        midNum: record[key],
        cloumns
      }
    })
  }

  confirmSaveSegement = (data) => {
    const { segemntModalData } = this.state;
    if (data.operation == 'ok') {
      this.setState({
        isLoading: true,
        segemntModalData: {
          ...segemntModalData,
          isLoading: true,
        }
      }, () => {
        let paramsObj = this.handleParams('saveSegment', data.formData)
        const commitParams = {
          ...paramsObj,
          segName: data.formData.segName || '',
          segDescription: data.formData.segDescription || '',
          sliceName: this.state.basicInfo?.sliceName,
          description: this.state.basicInfo?.description || '',
          id: this.state.basicInfo.id || null,
          subjectId: this.state.subjectId,
        }
        console.log(1212, commitParams)
        //return
        toSaveSegment(commitParams).then(res => {
          this.setState({
            isLoading: false,
            segemntModalData: {
              ...segemntModalData,
              isLoading: false,
              visible: false,
            }
          }, () => {
            message.success('人群创建成功')
          })
        }).catch(err => {
          err.msg && message.error(err.msg);
          this.setState({
            isLoading: false,
            segemntModalData: {
              ...segemntModalData,
              isLoading: false,
              visible: false,
            }
          })
        })
      })
    } else if (data.operation === 'cancel') {
      this.setState({
        segemntModalData: {
          ...segemntModalData,
          visible: false
        }
      })
    }
  }

  confirmSaveTableFilter = (data) => {
    if (data.action == 'ok') {
      console.log('confirmSaveTableFilter', data)
      this.setState({
        isLoading: true,
        tableFilterModalData: {
          ...this.state.tableFilterModalData,
          visible: false
        }
      }, () => {
        const commitParams = {
          id: this.state.basicInfo.id || null,
          taskResultCondition: data.taskResultCondition
        }
        console.log(1212, commitParams)
        let requestApi;
        if (this.props.tableType == TABLE_TYPE.ck) {
          requestApi = queryTableFilterDataByCk;
        } else if (this.props.tableType == TABLE_TYPE.trino) {
          requestApi = queryTableFilterDataByTrino;
        }
        //return
        requestApi(commitParams, { size: this.state.pageSize, page: 0 }).then(res => {
          if (res.data) {
            let formatTableDataTemp = this.formatTableData(res.data);
            console.log(200, res, formatTableDataTemp)
            this.setState({
              columns: formatTableDataTemp?.tableCloumns,
              checkedValue: formatTableDataTemp?.checkedValue,
              dataList: formatTableDataTemp?.tempRecords ? formatTableDataTemp.tempRecords.map((record, index) => {
                return { ...record, key: index }
              }) : [],
              pageNo: res.data.data?.page + 1,
              total: res.data.data?.totalCount,
              isLoading: false
            }, () => {
              if (res.data && res.data.data?.isOver == 1) {
                message.warning('此数据已超过100000条，查询结果最多为100000条')
              }
            })
          }
        }).catch(err => {
          err.msg && message.error(err.msg);
          this.setState({ isLoading: false })
        })
      })
    } else {
      this.setState({
        tableFilterModalData: {
          ...this.state.tableFilterModalData,
          visible: false
        }
      })
    }
  }

  render () {
    const { basicInfo, currentModelId } = this.state;
    return <Spin spinning={this.state.isLoading}>
      <div className="oap-container" style={{ padding: '0 16px 16px' }}>
        <Row id={this.state.bigBoxId} className="oap-row">
          <Col id={this.state.leftBoxId} className="oap-analysis-col-flex" style={{ width: '182px', height: '100vh' }}>
            <div className="oap-card">
              <div className="oap-flex-between content-title">
                <span>数据信息</span>
                <AutoNotice noticeData={this.state.noticeData} modelId={currentModelId} openChange={this.openChange} />
              </div>
              <div className="oap-update-time">
                <Tooltip placement="topLeft" title={basicInfo.name}>
                  <p className="title ellipsis">{basicInfo.name || '--'}</p>
                </Tooltip>
                <p className="font-gray">数据更新时间:</p>
                <p>{basicInfo.lastModifyAt || '----'}</p>
              </div>
            </div>
            <SearchInput onSearch={(str) => this.handleSearch(str)} />
            <div className="oap-card padnone oap-analysis-leftList">
              {this.state.collapseList.length ? this.state.collapseList.map(collapse => {
                return <div className="oap-Collapse-area" key={collapse.title}>
                  <div className="content-title">{collapse.title}</div>
                  {collapse.label == "indexes" ? <ReactSortable
                    list={collapse.children}
                    setList={(newState) => { }}
                    animation={150}
                    group={{ name: "disable-group-name", pull: "clone", put: false }}
                    clone={item => ({ ...item })}
                    sort={false}
                    chosenClass="sortable-drag"
                    onStart={(target) => this.setSortStart(collapse.label, target)}
                    onEnd={() => this.setState({ dragFromClassify: '', dragItemId: null })}>
                    {collapse.children && collapse.children.map(listItem => {
                      return <div key={listItem.id} data-filterable={listItem?.filterable} data-groupby={listItem?.groupby}>
                        <Tooltip title={`${listItem.showName}: ${listItem?.description}`} trigger="click">
                          <div className="oap-drag-item ellipsis">{listItem.showName}</div>
                        </Tooltip>
                      </div>
                    })}
                  </ReactSortable> : <Collapse activeKey={this.state.activeCollapse} accordion expandIconPosition="end" ghost onChange={(key) => this.setState({ activeCollapse: key })}>
                    {collapse.children.map(child => {
                      return <Collapse.Panel header={<div><Tooltip title={child.title} trigger="click">{child.title}&nbsp;&nbsp;{child.icon ? child.icon : null}</Tooltip></div>} key={child.title}>
                        <ReactSortable
                          list={child.list}
                          setList={(newState) => { }}
                          animation={150}
                          group={{ name: "disable-group-name", pull: "clone", put: false }}
                          clone={item => ({ ...item })}
                          sort={false}
                          chosenClass="sortable-drag"
                          onStart={(target) => this.setSortStart(collapse.label, target)}
                          onEnd={() => this.setState({ dragFromClassify: '', dragItemId: null })}>
                          {child.list && child?.list.map(listItem => {
                            return <div key={listItem.id} data-filterable={listItem?.filterable} data-groupby={listItem?.groupby} data-istag={listItem?.isTag || 'false'} data-isusertag={listItem?.isUserTag || 'false'}>
                              <Tooltip title={`${listItem.showName}: ${listItem?.description}`} trigger="click">
                                <div className="oap-flex-between oap-drag-item">
                                  <span className="ellipsis" style={{ maxWidth: '80%' }}>
                                    {listItem.isSegment == 1 ? <SvgIcon icon='gcpch' className="normal_gcpch_icon"></SvgIcon> : (
                                      listItem.isTag == 1 ? <SvgIcon icon='diversion' className="normal_gcpch_icon"></SvgIcon> : (
                                        listItem.isCustomDimension == 1 ? <SvgIcon icon='framework' className="normal_gcpch_icon"></SvgIcon> : (
                                          listItem.isUserTag == 1 ? <SvgIcon icon='user_tag' className="normal_gcpch_icon"></SvgIcon> : null)
                                      )
                                    )}
                                    {listItem.showName}
                                  </span>
                                  {listItem.icon ? listItem.icon : null}
                                </div>
                              </Tooltip>
                            </div>
                          })}
                        </ReactSortable>
                      </Collapse.Panel>
                    })}
                  </Collapse>}
                </div>
              }) : <div className="oap-flex-center">暂无数据</div>}
            </div>
          </Col>
          <Col id={this.state.resizeBox1Id}>
            <div style={{ width: '16px', height: '100%', cursor: 'ew-resize' }} onMouseDown={(e) => this.darggableWidth(e, this.state.resizeBox1Id)}></div>
          </Col>
          <Col id={this.state.middleBoxId} style={{ width: '182px', overflowY: 'auto' }}>
            {this.state.dragList.map((dragBox, boxIndex) => {
              return <div className="oap-card oap-drag-containBox" key={dragBox.title} id={`analysisDrag${boxIndex}`}>
                <div className="oap-drag-container">
                  <div className="content-title">
                    <img src={require(`@/locales/images/${dragBox.iconName}.png`)} alt="icon" width={20} />
                    <span className="label">{dragBox.title}</span>
                  </div>
                  <ReactSortable
                    list={dragBox.children}
                    setList={(newState) => this.setSortableList(newState, boxIndex)}
                    animation={150}
                    group={{ name: "disable-group-name", pull: "clone" }}
                    chosenClass="sortable-drag"
                    onStart={(target) => this.setDragBoxSortStart(boxIndex, target)}
                    onEnd={(target) => this.setDragBoxSortEnd(boxIndex, target, dragBox)}
                    className={['drag-toContent', dragBox.classify.includes(this.state.dragFromClassify) ? 'drag-able-content' : ''].join(' ')}>
                    {dragBox.children.map((child, childIdx) => {
                      let tagSegment = 'false', isAbleEdit = false;
                      if (child?.isSegment) {
                        tagSegment = 'segment';
                        isAbleEdit = true;
                      };
                      if (child?.isTag) tagSegment = 'tag';
                      if (child?.isCustomDimension) tagSegment = 'custom';
                      if (child?.isUserTag) {
                        tagSegment = 'usertag';
                        isAbleEdit = true;
                      };
                      return <div className="oap-flex-between oap-drag-item" key={child.id || child.tagId} data-classify={dragBox.flag} data-cascade={child.isCascade ? child?.isCascade : 'false'} data-targetindex={childIdx} data-filterable={child?.filterable} data-groupby={child?.groupby} data-tagsegment={tagSegment}>
                        <div className="name ellipsis">
                          <div className="ellipsis">{child.isSegment == 1 ? <SvgIcon icon='gcpch' className="normal_gcpch_icon"></SvgIcon> : (
                            child.isTag == 1 ? <SvgIcon icon='diversion' className="normal_gcpch_icon"></SvgIcon> : (
                              child.isCustomDimension == 1 ? <SvgIcon icon='framework' className="normal_gcpch_icon"></SvgIcon> : (
                                child.isUserTag == 1 ? <SvgIcon icon='user_tag' className="normal_gcpch_icon"></SvgIcon> : null
                              )
                            )
                          )
                          }{child?.showName}</div></div>
                        <div className="oap-drag-item-action">
                          {(dragBox.label === 'dimensions' && !isAbleEdit) || (dragBox.label === 'indexes' && child.hasCondition != 1) ? null : <IconEditA onClick={() => this.handleEdit(dragBox.label, child.id, childIdx)} />}
                          {dragBox.label === 'filters' && child?.deleteFlag ? null : <IconClose onClick={() => this.handleDelete(boxIndex, childIdx)} />}
                        </div>
                      </div>
                    })}
                  </ReactSortable>
                </div>
                <div id={`midResizeBox${boxIndex}`} style={{ width: '100%', height: '0px', cursor: 'ns-resize' }}></div>
              </div>
            })}
          </Col>
          <Col id={this.state.resizeBox2Id}>
            <div style={{ width: '16px', height: '100%', cursor: 'ew-resize' }} onMouseDown={(e) => this.darggableWidth(e, this.state.resizeBox2Id)}></div>
          </Col>
          <Col id={this.state.rightBoxId} className="oap-ananlysis-right">
            <div className="table-container oap-card oap-analysisList" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="oap-card-top">
                <Row className="oap-row" justify="space-between">
                  <Col style={{ minWidth: '452px', width: '62%' }}>
                    {basicInfo.sliceName ? <div className="oap-card-top-title">
                      <Tooltip title={basicInfo.sliceName} className="oap-flex-row oap-flex-row-align">
                        <div className="title ellipsis" style={{ maxWidth: '90%' }}>
                          <span>{basicInfo.sliceName}</span>
                        </div>
                        <IconEditA onClick={this.handleAnalysisEdit} />
                      </Tooltip>
                      <Tooltip title={basicInfo.description}>
                        <div className="ellipsis">{basicInfo.description}</div>
                      </Tooltip>
                    </div> : ''}
                  </Col>
                  {checkMyPermission('oap:home:saveChart') ? <Col flex={['edit'].includes(this.props.type) ? '200px' : '80px'}><Space>
                    <Button type="primary" onClick={this.props.onChooseData}>创建分析</Button>
                    {['edit'].includes(this.props.type) && <Button onClick={this.handleCopy}>复制查询条件</Button>}
                  </Space></Col> : null}
                </Row>
              </div>
              <ShowDragContion conditionList={this.state.dragListConditions['filters']}></ShowDragContion>
              <div className="table-top-wrap" style={{ paddingTop: this.state.checkedValue.length ? '32px' : '68px' }}>
                <div className="table-top-btn" style={{ top: '16px' }}>
                  <Space>
                    {checkMyPermission('oap:home:saveChart') ? <Button type="primary" onClick={this.handleExplore} disabled={currentModelId == null} loading={this.state.exploreLoading}>保存并运行</Button> : null}
                    {checkMyPermission('oap:templatemain:save') ? <Button onClick={this.handleTemplate} disabled={currentModelId == null}>保存为模板</Button> : null}
                    {checkMyPermission('oap:home:sqlDownload') && !(['template'].includes(this.props.type)) ? <Button disabled={['create', 'copy'].includes(this.props.type) || (basicInfo.queryStatus && basicInfo.queryStatus.toLowerCase() != 'finish')} onClick={this.downLoadAsync}>导出CSV</Button> : null}
                  </Space>
                </div>
                <Table
                  columns={this.state.columns}
                  dataSource={this.state.dataList}
                  loading={this.state.tableLoading}
                  allFilterColumns={this.state.checkedValue}
                  tableKey={`analysis_${Date.now()}`}
                  pagination={{
                    showQuickJumper: true,
                    showSizeChanger: true,
                    pageSize: this.state.pageSize,
                    current: this.state.pageNo,
                    total: this.state.total,
                    onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
                  }}
                  scroll={{ x: '100%' }} />
              </div>
            </div>
          </Col>
        </Row>
      </div>
      <SetCondition
        visible={this.state.visibleConditon}
        item={this.state.itemConditon}
        childCondition={this.state.childCondition}
        classify={this.state.classifyConditon}
        currentModelId={this.state.currentModelId}
        currentIndex={this.state.currentConditionIndex}
        tableType={this.props.tableType}
        changeVisible={this.changeSetConditionVisible}
        completeSet={this.handCompleteSet}
        saveTabActive={this.saveTabActive} />
      <Modal
        title={!this.props?.sliceId ? '基础信息创建' : '基础信息修改'}
        visible={this.state.visibleBasicInfo}
        className="basicInfo"
        zIndex={1030}
        cancelText="取消"
        okText="确定"
        confirmLoading={this.state.exploreLoading}
        onCancel={() => this.handleBasicModal('cancel')}
        onOk={() => this.handleBasicModal('ok')}>
        <div className="table-container">
          <Form
            ref={this.formRefBasicInfo}
            layout="vertical"
            size="middle"
            initialValues={this.state.basicInfo}>
            <div>
              <Row gutter={32}>
                <Col span={6}>
                  <Form.Item name="subjectName" label="业务域名称">
                    <Select placeholder="全部" disabled>
                      {this.props.subjectModelList.length && this.props.subjectModelList.map(model => {
                        return <Select.Option value={model.name} key={model.id}>{model.name}</Select.Option>
                      })}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="sliceName"
                    label="查询名称"
                    rules={[
                      {
                        validator: (rule, value, callback) => {
                          if ((value ?? '') !== '') {
                            if (value.replace(/\s+/g, "").length == 0) {
                              callback('您输入的全部是空格，请重新输入')
                            } else {
                              callback()
                            }
                          } else {
                            callback("请输入查询名称")
                          }
                        }
                      }
                    ]}>
                    <Input
                      placeholder="请输入查询名称"
                      maxLength="255"
                      allowClear />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="description" label="详情">
                    <Input.TextArea rows={6} maxLength="255" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        </div>
      </Modal>
      <ExploreEmailModal onExplored={(data) => this.handleExploreForDownloadData(data)} {...this.state.emailModalData} />
      <SaveTemplateModal {...this.state.templateModalData} onSaved={this.confirmSaveTemplate} />
      <SaveSegmentModal {...this.state.segemntModalData} onSaved={this.confirmSaveSegement} />
      <TableFilter {...this.state.tableFilterModalData} changeVisible={this.confirmSaveTableFilter} />
    </Spin>
  }
}
export default Index