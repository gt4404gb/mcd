import React from "react";
import { Space, Spin, Modal, Form, Row, Col, Button, Select, Input, message, Collapse, Tooltip } from '@aurum/pfe-ui';
import { IconClose, IconEditA } from '@aurum/icons';
import { getTableKey } from '@mcd/portal-components/dist/utils/table';
import SetCondition from './components/SetCondition'
import AutoNotice from '@/components/autoNotice';
import { ReactSortable } from "react-sortablejs";
import {
  prepareChartForKylin,
  taskPageResultPage,
  getKylinMetaList,
  saveKylinAnyData,
  getKylinResultByAnyData,
  viewKylinAnyData,
  saveTemplateInfo,
  getTemplateDetail,
  getKylinDownLoadData,
  getKylinDownLoadStart,
  getKylinDownLoadStatus,
  saveTemplateInfoByPublic
} from '@/api/oap/self_analysis.js';
import moment from 'moment';
import { numToMoneyField, clearComma, uuid } from '@/utils/store/func';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import ShowCondition from './components/ShowCondition';
import _ from "lodash";
import SvgIcon from '@/components/SvgIcon';
import '@/style/kylin-analysis.less';
import LikeTreeTable from "./components/LikeTreeTable";
import PageJump from './components/PageJump';
import SaveTemplateModal from '@/components/saveTemplateModal';
import ExploreEmailModal from '@/components/ExploreEmailModal';
import { getCurrentUserIsStaff } from '@/api/oap/commonApi.js';
import SearchInput from "../../components/SearchInput";
// import LikeLDW from "./components/LikeLDW";
import MergeTable from "./components/MergeTable";
import { runAnalysisTaskForSelfCheckout } from '@/api/oap/buried_api.js';
// 分析选择的是麒麟的数据源
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.formRefBasicInfo = React.createRef();
    this.queryKeyWordsRef = React.createRef();
    this.pagination = React.createRef();
    this.defDragList = [
      {
        label: "kylin_filters",
        classify: ["dimensions", "dimensions:rows", "dimensions:columns", "filters_ky"],
        iconName: "filter",
        flag: "dragFilter",
        title: "筛选",
        children: [],
      },
      {
        label: "kylin_dimensions_rows",
        classify: ["dimensions", "dimensions:rows", "dimensions:columns"],
        iconName: "dimensions",
        flag: "dragRows",
        title: "维度",
        children: [],
      },
      {
        label: "kylin_quotas",
        classify: [
          "quotas",
        ],
        iconName: "indexes",
        flag: "dragQuota",
        title: "指标",
        children: [],
      },
    ];
    this.defDragListConditions = {
      kylin_filters: [],
      kylin_quotas: [],
      kylin_dimensions_rows: [],
      kylin_dimensions_columns: [],
    };
    this.state = {
      isLoading: false,
      visibleChooseData: false,
      chooseData: {
        filterOptions: [],
        checkedValue: [],
        defcolumns: [],
        columns: [
          { title: "查询名称", dataIndex: 'businessName', fixed: 'left', width: 200, align: 'left', ellipsis: true },
          { title: "业务域", dataIndex: 'modelNameByCode', ellipsis: true, width: 140, align: 'left' },
          { title: "更新时间", dataIndex: 'lastModifyAtFormat', ellipsis: true, width: 160, align: 'left' },
        ],
        dataList: [],
        loading: false,
        initValues: {}
      },
      filterOptions: [],
      checkedValue: [],
      defcolumns: [],
      columns: [],
      dataList: [],
      combinedColumns: {
        dim_columns: [],
        mea_columns: [],
      },
      tableLoading: false,
      pageSize: 10,
      pageNo: 1,
      activeCollapseForDM: [],
      activeCollapseForQM: [],
      defCollapseList: [],
      collapseList: [],
      dragList: JSON.parse(JSON.stringify(this.defDragList)),
      visibleConditon: false,
      titleConditon: '设置条件',
      dragListConditions: JSON.parse(JSON.stringify(this.defDragListConditions)),
      itemConditon: {},
      runDataParams: {},
      basicInfo: {
        id: '',
        name: '',
        lastModifyAt: '',
        subjectName: '',
        sliceName: '',
        description: '',
        business: '',
      },
      visibleBasicInfo: false,
      dragFromClassify: '',
      dragItemId: null,
      subjectModel: [],
      selectedRows: [], //选中
      selectedRowKeys: [],
      currentModelId: null,
      tableHeight: '',
      childCondition: [],
      currentConditionIndex: null,
      bigBoxId: `bigBox${uuid()}`,
      leftBoxId: `leftBox${uuid()}`,
      resizeBox1Id: `resizeBox1${uuid()}`,
      middleBoxId: `middleBox${uuid()}`,
      resizeBox2Id: `resizeBox2${uuid()}`,
      rightBoxId: `rightBox${uuid()}`,
      defQueryContext: {},
      defQueryContextForDown: {},
      projectName: '',
      tableName: '',
      projectId: '',
      pageOptionsVisible: false,
      pageOptions: {
        pageSize: 10,
        curPage: 0,
        offset: 0,
        hasNext: false,
      },
      templateModalData: {
        visible: false,
        businessId: null,
        subjectModelList: [],
        isLoading: false
      },
      emailModalData: {
        isStaff: false,
        mcdEmail: '',
        visibleEmailInfo: false,
        isLoading: false,
      },
      // firstSaveSliceId: '',
      noticeData: {
        visible: false,
        defaultOpen: false
      }
    };
    this.recordForDimension = [];
    this.timer = null;
  }
  componentDidMount () {
    //modelId用来查询preCharts接口，无论何种情况，均存在
    //有modelId,跳过选择数据  （从【首页】引导页过来的）
    // if (this.props.sliceId) {
    //   this.setState({
    //     firstSaveSliceId: this.props.sliceId,
    //   })
    // }
    if (this.props.modelId && !this.props?.sliceId) {
      this.setState({
        currentModelId: this.props?.modelId,
        isLoading: true
      }, () => {
        this.getPrepareChart(this.props?.modelId);
      })
    } else if (this.props.modelId && this.props?.sliceId) { //如果sliceId有值，就是编辑页面 (从【自助取数】列表过来) 或者 复制查询条件
      this.setState({
        currentModelId: this.props?.modelId,
      }, async () => {
        this.getPrepareChart(this.props.modelId);
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
        }
      })
    }
    /**
     * 判断当前用户是否雇员
     */
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

  shouldComponentUpdate () {
    return true;
  }
  _getKylinMetaList = async (id) => {
    this.setState({
      isLoading: true,
    })
    getKylinMetaList(id).then(res => {
      this._dealWithKylinMetaData(res.data);
    }).catch(() => {
    }).finally(() => {
      if (['edit', 'template'].includes(this.props.type) && this.props?.sliceId) {
        this.initViewKylinAnyData(this.props.sliceId);
      } else {
        this.setState({
          isLoading: false,
        })
      }
    })
  }
  _dealWithKylinMetaData = (data) => {
    let modelNameList = [];
    let dimensionAll = [];
    let dm_folder = [], qm_folder = [];
    if (data.models.length > 0) {
      data.models.forEach(model => {
        let measuresChildren = [];
        if (model.measures.length > 0) {
          model.measures.forEach(measure => {
            if (JSON.parse(measure.is_visible)) {
              let descJson = {
                order: 0,
                type: '',
              };
              if (measure.desc.length > 0) {
                try {
                  let json_desc = JSON.parse(measure.desc)
                  descJson = Object.assign({}, descJson, json_desc);
                } catch (err) {
                  console.log('非JSON格式字符串')
                }
              }
              if (measure.subfolder) {
                qm_folder.push({
                  name: measure.name,
                  alias: measure.alias,
                  is_visible: JSON.parse(measure.is_visible),
                  desc: measure.desc,
                  translation: measure.translation?.['zh-CN'] || '',
                  format_type: measure.format_type,
                  is_calculate: false,
                  desc: descJson,
                  id: measure.alias,
                  subfolder: measure.subfolder,
                  isLeaf: true,
                })
              } else {
                measuresChildren.push({
                  name: measure.name,
                  alias: measure.alias,
                  is_visible: JSON.parse(measure.is_visible),
                  desc: measure.desc,
                  translation: measure.translation?.['zh-CN'] || '',
                  format_type: measure.format_type,
                  is_calculate: false,
                  desc: descJson, // measure.desc
                  id: measure.alias,
                  isLeaf: true,
                })
              }
            }
          })
        }
        if (data.calculate_measures.length > 0) {
          data.calculate_measures.forEach(measure => {
            if (measure.folder === model.model_name && measure.is_visible) {
              let descJson = {
                order: 0,
                type: '',
              };
              if (measure.desc.length > 0) {
                try {
                  let json_desc = JSON.parse(measure.desc)
                  descJson = Object.assign({}, descJson, json_desc);
                } catch (err) {
                  console.log('非JSON格式字符串')
                }
                // descJson = Object.assign({}, descJson, JSON.parse(measure.desc));
              }
              if (measure.subfolder) {
                qm_folder.push({
                  name: measure.name,
                  alias: measure.name,
                  is_visible: JSON.parse(measure.is_visible),
                  desc: measure.desc,
                  translation: measure.translation?.['zh-CN'] || '',
                  format_type: measure.format_type,
                  is_calculate: true,
                  desc: descJson,
                  id: measure.name,
                  subfolder: measure.subfolder,
                  isLeaf: true,
                })
              } else {
                measuresChildren.push({
                  name: measure.name,
                  alias: measure.name,
                  is_visible: JSON.parse(measure.is_visible),
                  desc: measure.desc,
                  translation: measure.translation?.['zh-CN'] || '',
                  format_type: measure.format_type,
                  is_calculate: true,
                  desc: descJson, // measure.desc
                  id: measure.name,
                  isLeaf: true,
                })
              }
            }
          })
        }
        if (model.dimension_tables.length > 0) {
          model.dimension_tables.forEach(dimension => {
            let children = [];
            dimension.dim_cols.forEach(dim => {
              if (JSON.parse(dim.is_visible)) {
                let descJson = {
                  order: 0,
                  type: '',
                };
                if (dim.desc.length > 0) {
                  try {
                    let json_desc = JSON.parse(dim.desc)
                    descJson = Object.assign({}, descJson, json_desc);
                  } catch (err) {
                    console.log('非JSON格式字符串')
                  }
                }
                if (dim.subfolder) {
                  dm_folder.push({
                    name: dim.name,
                    alias: dim.alias,
                    is_visible: JSON.parse(dim.is_visible),
                    is_drill_down: false,
                    dimension_tables_alias: dimension.alias,
                    data_type: dim.data_type,
                    dim_cols_alias: [],
                    dim_cols: [],
                    translation: dim.translation?.['zh-CN'] || '',
                    desc: descJson, // dim.desc,
                    subfolder: dim.subfolder,
                    isLeaf: true,
                  })
                } else {
                  children.push({
                    name: dim.name,
                    alias: dim.alias,
                    is_visible: JSON.parse(dim.is_visible),
                    is_drill_down: false,
                    dimension_tables_alias: dimension.alias,
                    data_type: dim.data_type,
                    dim_cols_alias: [],
                    dim_cols: [],
                    translation: dim.translation?.['zh-CN'] || '',
                    desc: descJson, // dim.desc,
                    isLeaf: true,
                  })
                }
              }
            })
            dimension.hierarchys.forEach(dim => {
              let dim_cols_alias = dimension.dim_cols.reduce((pre, cur) => {
                if (dim.dim_cols.includes(cur.name)) {
                  let idx = dim.dim_cols.indexOf(cur.name);
                  pre[idx] = cur.alias;
                }
                return pre
              }, [])
              let descJson = {
                order: 0,
                type: '',
              };
              if (dim.desc.length > 0) {
                try {
                  let json_desc = JSON.parse(dim.desc)
                  descJson = Object.assign({}, descJson, json_desc);
                } catch (err) {
                  console.log('非JSON格式字符串')
                }
              }
              children.push({
                name: dim.name,
                alias: dim.name,
                is_visible: true,
                is_drill_down: true,
                dimension_tables_alias: dimension.alias,
                data_type: 'Hierarchy',
                dim_cols_alias,
                dim_cols: dim.dim_cols,
                translation: dim.translation?.['zh-CN'] || '',
                desc: descJson, // dim.desc,
                isLeaf: true,
              })
            })
            let _c = children.sort((a, b) => {
              if (a.desc?.order == b.desc?.order) {
                let a_ = a.alias.toLowerCase();
                let b_ = b.alias.toLowerCase();
                if (a_ > b_) return 1;
                if (a_ < b_) return -1;
                return 0
              } else {
                return b.desc?.order - a.desc?.order;
              }
            }) || []

            dimensionAll.push({
              name: dimension.name,
              alias: dimension.alias,
              isLeaf: true,
              isFolder: false,
              key: dimension.name,
              pKey: 0,
              children: _c,
            })
          })
        }
        /**
         * */
        let _m = measuresChildren.sort((a, b) => {
          if (a.desc?.order == b.desc?.order) {
            let a_ = a.alias.toLowerCase();
            let b_ = b.alias.toLowerCase();
            if (a_ > b_) return 1;
            if (a_ < b_) return -1;
            return 0
          } else {
            return b.desc?.order - a.desc?.order;
          }
        }) || []

        modelNameList.push({
          alias: model.model_alias,
          name: model.model_name,
          isLeaf: true,
          isFolder: false,
          key: model.model_alias,
          pKey: 0,
          children: _m,
        })
      })
      if (data.calculate_measures.length > 0) {
        let measuresChildren = [];
        data.calculate_measures.forEach(measure => {
          if (JSON.parse(measure.is_visible) && measure.folder === 'Calculated Measure') {
            let descJson = {
              order: 0,
              type: '',
            };
            if (measure.desc.length > 0) {
              try {
                let json_desc = JSON.parse(measure.desc)
                descJson = Object.assign({}, descJson, json_desc);
              } catch (err) {
                console.log('非JSON格式字符串')
              }
            }
            measuresChildren.push({
              name: measure.name,
              alias: measure.name,
              is_visible: JSON.parse(measure.is_visible),
              format_type: measure.format_type,
              is_calculate: true,
              translation: measure.translation?.['zh-CN'] || '',
              desc: descJson,
              id: measure.name,
              isLeaf: true,
            })
          }
        })
        /**
         * */
        let _m = measuresChildren.sort((a, b) => {
          if (a.desc?.order == b.desc?.order) {
            let a_ = a.alias.toLowerCase();
            let b_ = b.alias.toLowerCase();
            if (a_ > b_) return 1;
            if (a_ < b_) return -1;
            return 0
          } else {
            return b.desc?.order - a.desc?.order;
          }
        }) || []

        modelNameList.push({
          alias: 'Calculate',
          name: '计算度量',
          isLeaf: true,
          isFolder: false,
          key: 'Calculate',
          pKey: 0,
          children: _m,
        })
      }

      let dm_tree = this.metaDealByFolder(dm_folder);
      let qm_tree = this.metaDealByFolder(qm_folder);
      /**
       * 需要对维度，指标进行order排序，如果order相同按字母排序
       * list.sort((a,b) => {
        if(a.order == b.order) {
          let a_ = a.alias.toLowerCase();
          let b_ = b.alias.toLowerCase();
          if (a_ > b_) return 1;
          if (a_ < b_) return -1;
          return 0
        } else {
          return a.order-b.order;
        }
      })
       */
      let dim_finall = [...dimensionAll, ...dm_tree],
        quo_finall = [...modelNameList, ...qm_tree];
      let new_dim_finall = this.giveYourBodyAddTreeKeyForMeta(dim_finall, '0') || [];
      let new_quo_finall = this.giveYourBodyAddTreeKeyForMeta(quo_finall, '0') || [];
      this.setState(state => ({
        ...state,
        collapseList: [
          {
            label: 'dimensions',
            title: '维度',
            children_dim: new_dim_finall, // [...dimensionAll, ...dm_tree],
            folder_tree: [...dm_tree],
          },
          {
            label: 'quotas',
            title: '指标',
            children: new_quo_finall, // [...modelNameList, ...qm_tree],
            folder_tree: [...qm_tree],
          }
        ],
        defCollapseList: [
          {
            label: 'dimensions',
            title: '维度',
            children_dim: new_dim_finall, // [...dimensionAll, ...dm_tree],
          },
          {
            label: 'quotas',
            title: '指标',
            children: new_quo_finall, // [...modelNameList, ...qm_tree]
          }
        ]
      }))
    }
  }
  // 打开open treekey的层层key 
  openTreekey = (key, type, item) => {
    let newKey = [];
    if (key) {
      let keyList = key.split('-');
      if (keyList.length > 2) {
        newKey = keyList.reduce((prev, cur, index) => {
          let str = '';
          if (index > 0) {
            str = `${prev[index - 1]}-${cur}`;
          } else {
            str = `${cur}`;
          }
          prev.push(str);
          return prev;
        }, []);
        if (newKey[0] === '0') {
          newKey.shift();
        }
      } else {
        newKey = [key];
      }
    }
    if (typeof key == 'undefined') {
      if (item && Object.prototype.hasOwnProperty.call(item, 'parentTreekey')) {
        let keyList = item.parentTreekey.split('-');
        if (keyList.length > 2) {
          newKey = keyList.reduce((prev, cur, index) => {
            let str = '';
            if (index > 0) {
              str = `${prev[index - 1]}-${cur}`;
            } else {
              str = `${cur}`;
            }
            prev.push(str);
            return prev;
          }, []);
          if (newKey[0] === '0') {
            newKey.shift();
          }
        } else {
          newKey = [item.parentTreekey];
        }
      }
    }
    if (type === 'QM') {
      this.setState({
        activeCollapseForQM: newKey
      })
    } else if (type === 'DM') {
      this.setState({
        activeCollapseForDM: newKey
      })
    }
  }
  // 添加唯一标识
  giveYourBodyAddTreeKeyForMeta = (data, preKey) => {
    return (function recurse (children, parentKey) {
      return children && children.map((node, index) => {
        let curKey = `${parentKey}-${index}`
        return Object.assign({}, node, {
          treekey: curKey,
          parentTreekey: parentKey,
          children: recurse(node.children, curKey) || []
        })
      })
    })(data, preKey)
  }
  // 按文件夹层级--划分数据
  metaDealByFolder = (list) => {
    list = JSON.parse(JSON.stringify(list));
    let obj = _.groupBy(list, 'subfolder');
    let fList = Object.keys(obj);
    let newL = [];
    fList.forEach((fl, index) => {
      let l = fl.split('\\');
      for (let i = 0; i < l.length; i++) {
        let id = l.slice(0, i + 1).join('\\');
        newL.push({
          key: id,
          pKey: i > 0 ? l[i - 1] : 0,
          name: l[i],
          alias: l[i],
          children: i + 1 === l.length ? obj[id] : [],
          isLeaf: i + 1 === l.length ? true : false,
          isFolder: true,
        });
      };
    })
    for (let j = 0; j < newL.length; j++) {
      if (newL[j].pKey === 0 && !newL[j].isLeaf) {
        let sameL = newL.filter((it, idx) => {
          if (it.key === newL[j].key && it.pKey === newL[j].pKey && it.isLeaf) {
            newL.splice(idx, 1);
            return true;
          } else {
            return false;
          }
        });
        sameL.forEach(s => {
          newL[j].children.push(...s.children)
        })
      }
    }
    newL.forEach(item => {
      if (item.children && item.children.length > 0) {
        let _c = item.children.sort((a, b) => {
          if (Object.prototype.hasOwnProperty.call(a, 'desc') && Object.prototype.hasOwnProperty.call(b, 'desc')) {
            if (a.desc?.order == b.desc?.order) {
              let a_ = a.alias.toLowerCase();
              let b_ = b.alias.toLowerCase();
              if (a_ > b_) return 1;
              if (a_ < b_) return -1;
              return 0
            } else {
              return b.desc?.order - a.desc?.order;
            }
          }
          if (Object.prototype.hasOwnProperty.call(a, 'desc') && !Object.prototype.hasOwnProperty.call(b, 'desc')) {
            return -1;
          }
          if (!Object.prototype.hasOwnProperty.call(a, 'desc') && Object.prototype.hasOwnProperty.call(b, 'desc')) {
            return 1;
          }
          return 0;
        })
        item.children = _c;
      }
    })
    let result = this.arrToTree(newL, 'key', 'pKey');
    return result;
  }
  arrToTree = (arr, key, pKey) => {
    arr = JSON.parse(JSON.stringify(arr));
    let res = arr.reduce((prev, cur) => {
      prev[cur[pKey]] ? prev[cur[pKey]].push(cur) : (prev[cur[pKey]] = [cur]);
      return prev;
    }, {});
    for (let prop in res) {
      res[prop].forEach(item => {
        if (res[item[key]]) {
          item.children.push(...res[item[key]]);
          let _c = item.children.sort((a, b) => {
            if (Object.prototype.hasOwnProperty.call(a, 'desc') && Object.prototype.hasOwnProperty.call(b, 'desc')) {
              if (a.desc?.order == b.desc?.order) {
                let a_ = a.alias.toLowerCase();
                let b_ = b.alias.toLowerCase();
                if (a_ > b_) return 1;
                if (a_ < b_) return -1;
                return 0
              } else {
                return b.desc?.order - a.desc?.order;
              }
            }
            if (Object.prototype.hasOwnProperty.call(a, 'desc') && !Object.prototype.hasOwnProperty.call(b, 'desc')) {
              return -1;
            }
            if (!Object.prototype.hasOwnProperty.call(a, 'desc') && Object.prototype.hasOwnProperty.call(b, 'desc')) {
              return 1;
            }
            return 0;
          })
          item.children = [..._c];
        }
      })
    }
    return res[0] || [];
  }
  _dealWithKylinMetaDataNew = (data) => {
    let dimensionMeta = [], quotaMeta = [];
    if (data.models.length > 0) {
      let dm_all = [], qm_all = [];
      data.models.forEach(model => {

      })
    }
  }

  onFilterChange = (checkedValue, key) => {
    key == 'chooseData' && this.setState({
      chooseData: {
        ...this.state.chooseData,
        columns: this.state.chooseData.defcolumns.filter((it) =>
          checkedValue.includes(it.dataIndex)
        ),
        checkedValue
      }
    })
    key == 'analysis' && this.setState({
      columns: this.state.defcolumns.filter((it) =>
        checkedValue.includes(it.dataIndex)
      ),
      checkedValue,
    })
  }

  resetColumns = (key) => {
    key == 'chooseData' && this.setState({
      chooseData: {
        ...this.state.chooseData,
        columns: this.state.chooseData.defcolumns,
        checkedValue: this.state.chooseData.filterOptions.map((it) => it.value)
      }
    })
    key == 'analysis' && this.setState({
      columns: this.state.defcolumns,
      checkedValue: this.state.filterOptions.map((it) => it.value)
    })
  }

  onPageChange = (pageNo, pageSize) => {
    this.setState({
      pageNo: pageNo,
      pageSize: pageSize
    }, () => {
      this.getData(this.props?.sliceId);
    });
  }

  initViewKylinAnyData = async (id) => {
    this.setState({
      isLoading: true,
    });
    try {
      let requestApi = viewKylinAnyData;
      if (['template'].includes(this.props.type)) {
        requestApi = getTemplateDetail;
      }
      const responseData = await requestApi(id);
      let {
        slice,
        result,
      } = responseData.data;
      Object.keys(slice.params).forEach(key => {
        slice.params[key].forEach(it => {
          if (it.desc && it?.desc.length > 0) {
            // it.desc = JSON.parse(it.desc);
            try {
              it.desc = JSON.parse(measure.desc)
            } catch (err) {
              console.log('非JSON格式字符串')
            }
          }
        })
      })
      let {
        kylin_filters,
        kylin_dimensions_rows,
        kylin_dimensions_columns,
        kylin_quotas
      } = slice.params, myDreamData, dataList_finally = [];
      if ((result ?? '') !== '') myDreamData = this._dealWithKylinResultData(result, '0', null, false);
      if ((result ?? '') !== '') dataList_finally = this._forReplace(myDreamData.dataList);
      console.log('dataList_finally = ', dataList_finally);
      let { pageOptions } = this.state;
      if (result?.rows_axis?.size >= this.state.pageOptions.pageSize) {
        pageOptions.hasNext = true;
      } else {
        pageOptions.hasNext = false;
      }
      this.defDragListConditions = {
        kylin_filters,
        kylin_dimensions_rows,
        kylin_dimensions_columns,
        kylin_quotas
      }
      this.defDragList.forEach(drag => {
        if (drag.label) {
          drag.children = [...slice.params[drag.label]]
        }
      })
      let payload = JSON.parse(slice.queryContext);
      this.recordForDimension = [...payload.rows_axis.dimensions]; // 编辑时，重置初始的条件
      this.setState((state) => ({
        ...state,
        basicInfo: {
          ...state.basicInfo,
          sliceName: slice.sliceName,// ['edit'].includes(this.props.type) ? slice.sliceName:'',
          description: slice.description, // ['edit'].includes(this.props.type) ? slice.description:'',
          id: slice.id, // ['edit'].includes(this.props.type) ? slice.id:'',
          queryStatus: ['edit'].includes(this.props.type) ? slice?.queryStatus : '',
        },
        dragList: JSON.parse(JSON.stringify(this.defDragList)),
        dragListConditions: JSON.parse(JSON.stringify(this.defDragListConditions)),
        defQueryContext: JSON.parse(slice.queryContext),
        defQueryContextForDown: JSON.parse(slice.queryContext),
        columns: myDreamData?.columns || [],
        dataList: dataList_finally, // myDreamData?.dataList || [],
        combinedColumns: myDreamData?.combinedColumns || {
          dim_columns: [],
          mea_columns: [],
        },
        isLoading: false,
        pageOptionsVisible: myDreamData?.dataList ? true : false,
        pageOptions: pageOptions,
      }), () => {
        console.log('AAAAAAAAAA - dragListConditions = ', this.state.dragListConditions['kylin_dimensions_rows']);
      })
    } catch (err) {
      err.msg && message.error(err.msg);
      this.setState({
        isLoading: false
      })
    }
  }
  //最左侧——维度、指标列表
  getPrepareChart = async (id) => {
    this.setState({
      collapseList: [],
      defCollapseList: [],
      runDataParams: {}
    })
    try {
      let resPrepareChart = await prepareChartForKylin({ modelId: id, vizType: 'TABLE' });
      if (resPrepareChart.data?.modelInfo?.datasetId) {
        this.setState(state => ({
          ...state,
          projectName: resPrepareChart.data?.modelInfo?.projectName,
          tableName: resPrepareChart.data?.modelInfo?.tableName,
          projectId: resPrepareChart.data?.modelInfo?.projectId,
        }), () => {
          this._getKylinMetaList(resPrepareChart.data.modelInfo.datasetId);
        })

      }
      const modelInfo = resPrepareChart.data?.modelInfo || {};
      const updateTime = (modelInfo.updateDataTime && moment(modelInfo.updateDataTime).format('YYYY-MM-DD HH:mm:ss')) || '-----';
      let basicInfo = {
        ...this.state.basicInfo,
        subjectName: modelInfo.name,
        name: `【${modelInfo.name}】${modelInfo.queryName}`,
        lastModifyAt: updateTime, // moment(modelInfo.updateDataTime).format('YYYY-MM-DD HH:mm:ss') || '-----'
        business: modelInfo.queryName,
      }
      this.setState({
        activeCollapseForDM: [],
        activeCollapseForQM: [],
        basicInfo,
        runDataParams: {
          datasourceId: resPrepareChart.data?.modelId,
          datasourceName: modelInfo?.name,
          tableName: modelInfo?.tableName,
          vizType: "TABLE",
          params: {},
          queryContext: ""
        },
        subjectId: resPrepareChart.data?.subjectId || '',//业务域ID
        noticeData: {
          visible: resPrepareChart.data?.hasMessage == 1,
          defaultOpen: resPrepareChart.data?.hasMessage == 1 && resPrepareChart.data?.isShow == 1,
          auto: resPrepareChart.data?.isShow == 1
        },
      }, () => {
        this.timer = setTimeout(() => {
          this.setState((state) => ({
            noticeData: {
              ...state.noticeData,
              defaultOpen: false
            }
          }))
        }, 5000);
      })
    } catch (err) {
      this.setState({
        isLoading: false
      })
    };
  }

  setSortStart = (classify, target, child) => {
    let dragFromClassify = classify;
    // 1个维度只能拖到行、列中一次
    // 但是1个维度可以同时在条件，行或者列中
    let hasDraged = false;
    for (let key in this.state.dragList) {
      if (['kylin_dimensions_rows', 'kylin_dimensions_columns'].includes(this.state.dragList[key].label)) {
        if (this.state.dragList[key].children.length > 0) {
          let temp = this.state.dragList[key].children.find(it => it.alias === target.item.dataset.id);
          if (temp) {
            hasDraged = true;
            break;
          }
        }
        continue;
      }
      continue;
    }
    if (!hasDraged) {
      if (classify === 'dimensions' && target.item.dataset?.isdrilldown === 'false') {
        dragFromClassify = `${dragFromClassify}`;
      }
      if (classify === 'dimensions' && target.item.dataset?.isdrilldown === 'true') {
        dragFromClassify = `${dragFromClassify}:rows`;
      }
    } else {
      dragFromClassify = 'filters_ky';
    }
    this.setState({
      dragFromClassify,
      dragItemId: target.item?.dataset.id
    })
  }

  setDragBoxSortStart = (boxIndex, target) => {
    this.setState({
      dragFromClassify: target.item?.dataset.classify,
      dragFromIndex: boxIndex,
      dragItemId: null
    })
  }

  // 拖拽
  setSortableList = (newState, index) => {
    let { dragList, dragListConditions } = this.state;
    let item = dragList[index],
      copyNewState = JSON.parse(JSON.stringify(newState)),
      noRepeatObj = {};
    //判断是否是组内拖动
    if (this.state.dragItemId == null) {
      if (this.state.dragFromIndex != index) return; //禁止组间拖动
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
      if (!noRepeatObj[next.alias]) {
        noRepeatObj[next.alias] = true;
        cur.push(next);
      } else {
        if (next.filter_values || next.condition) {
          cur[cur.findIndex(p => p.alias == next.alias)] = next;
        }
      }
      return cur
    }, [])
    let visibleConditon = false;
    let titleConditon = '设置维度';
    if (['kylin_filters'].includes(item.label)) {
      visibleConditon = true;
    } else if (['kylin_dimensions_rows', 'kylin_dimensions_columns'].includes(item.label)) {
      // 现如今--维度拖入行、列中，无需弹框，但是任然要赋值给该属性，以便结果的查询条件构造
      let dimensions = [];
      const { tableName, projectId } = this.state;
      let _item = noRepeatNewState.find(item => `${item.dimension_tables_alias}_${item.alias}` == this.state.dragItemId);
      if (_item.is_drill_down) { // 下钻维度
        dimensions.push({
          dimension: `${_item.alias}-Hierarchy`,
          dimension_table: _item.dimension_tables_alias,
          levels: [
            {
              level: _item.dim_cols_alias[0]
            }
          ]
        })
      } else {
        dimensions.push({
          dimension: _item.alias,
          dimension_table: _item.dimension_tables_alias,
          levels: [
            {
              level: _item.alias,
            }
          ]
        })
      }
      const data = {
        dataset: tableName,
        rows_axis: {
          dimensions: dimensions,
        }
      }
      let filter_arr = [];
      let tempFormData = {
        filter_values: [
          {
            comparator_equals: false,
            disabled: true,
            filter_members: ['all--root'],
            filter_members_arr: [...filter_arr],
            filter_members_name: ['All'],
            level: '',
            logicalOperator: 'OR',
            operator: 'IN',
            second_comparator_equals: false,
            second_value: '',
            second_level: '',
            treeRef: '',
            treeSearchValue: '',
            uuid: uuid(),
            value: '',
            negative: false,
          }
        ],
        show_name: _item.alias,
      }
      const formData = {
        form: {
          ...tempFormData,
          id: _item.alias,
          name: _item.name,
          show_data_type: 'SelectMulti',
        },
        classify: item.label,
      }
      let tempChild = noRepeatNewState.reduce((total, cur) => {
        if (cur.alias === formData.form?.id) {
          total.push({
            ...cur,
            ...formData.form,
          })
        } else {
          total.push(cur);
        }
        return total;
      }, [])
      dragList.forEach(dragItem => {
        if (dragItem.label === formData.classify) {
          dragItem.children = [...tempChild];
        }
      })
      dragListConditions[formData.classify] = [...tempChild];
      // })
    } else {
      let tempItemObj = noRepeatNewState.find(item => `${item.dimension_tables_alias}_${item.alias}` == this.state.dragItemId)
      if (['kylin_quotas'].includes(item.label) && tempItemObj && tempItemObj?.hasCondition) {
        visibleConditon = true;
      } else {
        item.children = [...noRepeatNewState];
        dragListConditions[item.label] = [...noRepeatNewState];
      }
    }
    if (['kylin_filters'].includes(item.label)) {
      titleConditon = '设置条件'
    }
    this.setState({
      dragList,
      dragListConditions,
      visibleConditon,
      classifyConditon: item.label,
      titleConditon: titleConditon,
      itemConditon: noRepeatNewState.find(item => `${item.dimension_tables_alias}_${item.alias}` == this.state.dragItemId) || {},
      childCondition: noRepeatNewState,
      currentConditionIndex: noRepeatNewState.findIndex(item => {
        return `${item.dimension_tables_alias}_${item.alias}` == this.state.dragItemId
      })
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
    let i_list = {};
    this.state.dragListConditions[classify].forEach((condition) => {
      if (condition.id == id) {
        if (condition.desc && typeof condition.desc === 'string') {
          i_list = Object.assign({}, {
            ...condition,
            desc: JSON.parse(condition.desc),
          })
        } else {
          i_list = Object.assign({}, condition)
        }
      }
    });
    this.setState({
      visibleConditon: true,
      classifyConditon: classify,
      itemConditon: i_list, // this.state.dragListConditions[classify].find((condition) => condition.id == id),
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
      if (dragList[dragIdx].label === 'kylin_quotas') {
        return `${item.alias}--${item.name}` != `${dragList[dragIdx].children[listIdx].alias}--${dragList[dragIdx].children[listIdx].name}`;
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
    let { childCondition, dragList, dragListConditions } = this.state;
    let tempChild = childCondition.reduce((total, cur) => {
      if (cur.alias === data.form?.id) {
        total.push({
          ...cur,
          ...data.form,
        })
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

  parseRecord = (hostData) => {
    let dataArray = hostData.split('\n'), tableData = []
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i].length == 0) { continue }
      const colArray = dataArray[i].split('\t')
      tableData.push(colArray)
    }
    return tableData
  }
  setQueryContextForResult = (obj, target) => {
    for (let key in obj) {
      if (key === 'kylin_quotas') {
        obj[key].forEach(quota => {
          target.measures.push(quota.alias);
        })
      }
      if (key === 'kylin_filters') {
        let filters = obj[key].reduce((pre, cur) => {
          if (cur.is_visible) {
            if (cur.is_drill_down) {
              let fm_list = [];
              cur.filter_values.forEach(fv => {
                let filter_members = fv.filter_members_arr.reduce((preStr, curStr) => {
                  if (curStr && curStr.length > 0) {
                    let members = curStr.split(',');
                    preStr.push(members)
                  }
                  return preStr;
                }, [])
                let operator_ = '', level = '', value = '', second_value = '';
                switch (fv.operator) {
                  case 'IN': fm_list.push({
                    operator: fv.operator,
                    filter_members: filter_members,
                    negative: false,
                  })
                    break;
                  case 'NOT_IN': fm_list.push({
                    operator: 'IN', // fv.operator,
                    filter_members: filter_members,
                    negative: true,
                  }); break;
                  case 'BETWEEN':
                    value = fv.value.split('--').shift();
                    level = fv.value.split('--').pop();
                    second_value = fv.second_value.split('--').shift();
                    fm_list.push({
                      operator: fv.operator,
                      level: level,
                      value: value,
                      comparator_equals: true,
                      second_value: second_value,
                      second_comparator_equals: true,
                    })
                    break;
                  default:
                    value = fv.value.split('--').shift();
                    level = fv.value.split('--').pop();
                    if (fv.operator.includes('>')) operator_ = 'GREATER_THAN';
                    if (fv.operator.includes('<')) operator_ = 'LESS_THAN';
                    fm_list.push({
                      operator: operator_,
                      level: level,
                      value: value,
                      comparator_equals: fv.operator.includes('=') ? true : false,
                    })
                    break;
                }
              })
              pre.push({
                dimension_table: cur.dimension_tables_alias,
                dimension: `${cur.alias}-${cur.data_type}`,
                by_dimension_grouped: [fm_list]
              });
            } else {
              let fm_list = [];
              cur.filter_values.forEach(fv => {
                let filter_members = [];
                fv.filter_members_arr.forEach(member => {
                  filter_members.push([member])
                })
                let operator_ = '', level = '', value = '', second_value = '';
                switch (fv.operator) {
                  case 'IN': fm_list.push({
                    operator: fv.operator,
                    filter_members: filter_members,
                    negative: false,
                  });
                    break;
                  case 'NOT_IN': fm_list.push({
                    operator: 'IN', // fv.operator,
                    filter_members: filter_members,
                    negative: true,
                  });
                    break;
                  case 'BETWEEN':
                    value = fv.value.split('--').shift();
                    level = fv.value.split('--').pop();
                    second_value = fv.second_value.split('--').shift();
                    fm_list.push({
                      operator: fv.operator,
                      level: level,
                      value: value,
                      comparator_equals: true,
                      second_value: second_value,
                      second_comparator_equals: true,
                    })
                    break;
                  default:
                    value = fv.value.split('--').shift();
                    level = fv.value.split('--').pop();
                    if (fv.operator.includes('>')) operator_ = 'GREATER_THAN';
                    if (fv.operator.includes('<')) operator_ = 'LESS_THAN';
                    fm_list.push({
                      operator: operator_,
                      level: level,
                      value: value,
                      comparator_equals: fv.operator.includes('=') ? true : false,
                    })
                    break;
                }
              })
              pre.push({
                dimension_table: cur.dimension_tables_alias,
                dimension: `${cur.alias}`,
                by_dimension_grouped: [fm_list],
              })
            }
          }
          return pre;
        }, [])
        target.filters = [...filters];
      }
      if (['kylin_dimensions_rows'].includes(key)) {
        let dim_rows = obj[key].reduce((pre, cur) => {
          if (cur.is_visible) {
            if (cur.is_drill_down) {
              pre.push({
                dimension: `${cur.alias}-Hierarchy`,
                dimension_table: cur.dimension_tables_alias,
                levels: [{
                  level: cur.dim_cols_alias[0],
                }]
              })
            } else {
              pre.push({
                dimension: cur.alias,
                dimension_table: cur.dimension_tables_alias,
                levels: [
                  {
                    level: cur.alias,
                  }
                ]
              })
            }
          }
          return pre;
        }, [])

        target.rows_axis.dimensions = [...dim_rows];
        this.recordForDimension = [...dim_rows]; // 记录最新的dimension
      }
      if (['kylin_dimensions_columns'].includes(key)) {
        let dim_cols = obj[key].reduce((pre, cur) => {
          if (cur.is_visible) {
            if (cur.is_drill_down) {
              // 列中不支持拖拽下钻维度
              return pre;
            } else {
              pre.push({
                dimension_table: cur.dimension_tables_alias,
                dimension: cur.alias,
                levels: [
                  {
                    level: cur.alias,
                  }
                ]
              })
            }
          }
          return pre;
        }, [])
        target.columns_axis.dimensions = [...dim_cols];
      }
    }
    return target;
  }
  handleParams = () => {
    let params = {},
      queryContext = {
        dataset: this.state.tableName,
        rows_axis: {
          limit: +this.state.pageOptions.pageSize,
          offset: +this.state.pageOptions.offset,
          dimensions: [],
        },
        columns_axis: {
          dimensions: [],
          measure_dimension_index: 0,
        },
        filters: [],
        measures: [],
      };
    for (let key in this.state.dragListConditions) {
      params[key] = this.state.dragListConditions[key];
      params[key].forEach(p => {
        if (typeof p.desc == 'object') {
          let _desc = JSON.stringify(p.desc);
          p.desc = _desc;
        }
      })
      if (key == 'filters') {
        let temp = params[key].reduce((total, child) => {
          //去除未填写完整的条件
          if (child.isCascade) {
            total.push(child)
          } else {
            if (child.filter_values && child.filter_values.length) {
              let temp = child.filter_values.filter(condition => {
                return (condition.filter_members ?? '') !== '' && (condition.operator ?? '') !== '' && condition.filter_members.length != 0
              })
              temp.length && total.push({
                ...child,
                filter_values: temp.map((tempItem, tempIdx) => {
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
      }
    }
    let { dragListConditions } = this.state;
    queryContext = this.setQueryContextForResult(dragListConditions, queryContext);
    this.setState({
      defQueryContext: queryContext,
      defQueryContextForDown: JSON.parse(JSON.stringify(queryContext))
    })
    return {
      ...this.state.runDataParams,
      params,
      queryContext: JSON.stringify(queryContext), // 此处记录查询结果的请求体
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
    //指标必填---0325增加校验
    let isQuotasObj = this.state.dragList.find(it => it.label === 'kylin_quotas') || {};
    if (!isQuotasObj?.children.length) {
      message.warning('请至少选择一个指标')
      return
    }
    //如果是新增页面 或者 复制查询条件
    if (!this.state.basicInfo.id) {
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
      keyWords = str || ''; // this.queryKeyWordsRef.current.state.value.trim().toLowerCase();
    if (!keyWords) {
      this.setState({
        collapseList
      })
      return;
    }
    let activeCollapseForQM = [], activeCollapseForDM = []; // , activeCollapseForDMC = [];
    function recurisionFun (list, keyWords) {
      function recurse (children, key) {
        let result = [];
        if (children) {
          result = children.map(node => {
            if (Object.prototype.hasOwnProperty.call(node, 'translation')) {
              if (node.alias.toLowerCase().includes(key)) {
                return node;
              }
            } else {
              let children_ = recurse(node.children, key) || [];
              if (children_) {
                return Object.assign({}, node, {
                  children: children_
                })
              }
            }
          })
          result = _.compact(result);
        }
        if (result && result.length > 0) {
          return result;
        }
      }
      let res = recurse(list, keyWords);
      if (res && res.length) {
        return res;
      }
    }
    let arr = collapseList.reduce((total, cur) => {
      if (cur.label === 'dimensions') {
        let child = [];
        child = recurisionFun(cur.children_dim, keyWords) || [];
        if (child && child.length > 0) {
          total.push({
            ...cur,
            children_dim: [...child]
          })
          if (activeCollapseForDM.length < 1) {
            function recurseKey (item) {
              if (Object.prototype.hasOwnProperty.call(item, 'translation')) {
                return item.treekey
              } else {
                return recurseKey(item.children[0])
              }
            }
            let deepKey = recurseKey(child[0]);
            let keyUrl = deepKey.split('-');
            keyUrl.pop();
            let keyStr = keyUrl.join('-');
            this.openTreekey(keyStr, 'DM');
          }
        }
      } else if (cur.label === 'quotas') {
        let child = [];
        child = recurisionFun(cur.children, keyWords) || [];
        if (child && child.length > 0) {
          total.push({
            ...cur,
            children_dim: [...child],
            children: [...child],
          })
          if (activeCollapseForQM.length < 1) {
            function recurseKey (item) {
              if (Object.prototype.hasOwnProperty.call(item, 'translation')) {
                return item.treekey
              } else {
                return recurseKey(item.children[0])
              }
            }
            let deepKey = recurseKey(child[0]);
            let keyUrl = deepKey.split('-');
            keyUrl.pop();
            let keyStr = keyUrl.join('-');
            this.openTreekey(keyStr, 'QM');
          }
        }
      }
      return total;
    }, []);
    this.setState({
      collapseList: arr,
    }, () => {
    })
  }

  rowSelection = (record, selectedRows, action) => {
    this.setState({
      selectedRows,
      selectedRowKeys: [selectedRows[0].id]
    }, () => {
      //本地存储
      sessionStorage.setItem("chooseAnalysis", encodeURIComponent(JSON.stringify({ selectedRows, selectedRowKeys: [selectedRows[0].id] })));
    })
  };

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
  // 处理多个行维度的结构
  _dealMyChildren = (curObj, list, index) => {
    let defCurObj = JSON.parse(JSON.stringify(curObj));
    if (curObj) {
      let it = list[index];
      if (it.dimension !== 'Measures') {
        if (it.dimension.includes('-Hierarchy')) {
          let dims = this.state.collapseList.find(col => col.label === 'dimensions');
          if (dims) {
            for (let j in dims.children_dim) {
              let lastFind = dims.children_dim[j].children.find(child => `${child.alias}-Hierarchy` === it.dimension && child.dimension_tables_alias === it.dimension_table);
              if (lastFind) {
                let currentLevel = lastFind.dim_cols_alias.indexOf(it.level);
                let obj = {
                  name: it.caption,
                  dimension: it.dimension,
                  isDrill: true,
                  isLeaf: currentLevel < lastFind.dim_cols_alias.length - 1 ? false : true,
                  curLevel: currentLevel,
                  levelAll: lastFind.dim_cols_alias,
                  dimTablesAlias: lastFind.dimension_tables_alias,
                  alias: lastFind.alias,
                  selfUrlKey: it.key,
                  ownSon: [],
                  fuckSon: [],
                }
                Object.assign(curObj, obj);
                break;
              }
              continue;
            }
          }
        } else {
          let obj = {
            name: it.caption,
            isDrillDown: false,
            isLeaf: true,
            curLevel: 0,
            levelLength: 0,
            levelAll: [],
            dimTablesAlias: '',
            alias: it.dimension,
            selfUrlKey: it.key,
            ownSon: [],
            fuckSon: [],
            keyList: it.key,
          }
          Object.assign(curObj, obj);
        }
      }
      if (index < list.length - 1) {
        let son = this._dealMyChildren(defCurObj, list, index + 1);
        curObj.isLastDrillDimension = false;
        curObj.fuckSon.push(son);
      }
    }
    return curObj;
  }
  // 添加标记
  giveYourBodyAddTag = (data, rootLen) => {
    return (function recurse (fuckSon, parentLen) {
      return fuckSon && fuckSon.map(node => {
        let curChildLen = `${parentLen}-${node.fuckSon.length || 1}`
        return Object.assign({}, node, {
          myBodyTag: curChildLen,
          fuckSon: recurse(node.fuckSon, curChildLen)
        })
      })
    })(data, rootLen)
  }
  giveYourBodyAddTag2 = (data, rootLen) => {
    return (function recurse (children, parentLen) {
      return children && children.map(node => {
        let curChildLen = `${parentLen}-${node.children.length || 1}`
        return Object.assign({}, node, {
          myBodyTag: curChildLen,
          children: recurse(node.children, curChildLen) || []
        })
      })
    })(data, rootLen)
  }
  giveYourBodyAddTreeKey = (data, preKey) => {
    return (function recurse (children, parentKey) {
      return children && children.map((node, index) => {
        let curKey = `${parentKey}-${index}`
        return Object.assign({}, node, {
          key: curKey,
          parentKey: parentKey,
          children: recurse(node.children, curKey) || []
        })
      })
    })(data, preKey)
  }
  // 截取我要的数据
  spliceTreeDataNeed = (list, item) => {
    return list.reduce((preDim, curDim) => {
      if (curDim.alias === item.selfAlias && curDim.selfUrlKey.length - 1 === item.selfUrlKey.length) {
        preDim.push(curDim);
      } else {
        if (curDim.fuckSon && curDim.fuckSon.length > 0) {
          let dddm = this.spliceTreeDataNeed(curDim.fuckSon, item);
          preDim.push(...dddm);
        }
      }
      return preDim;
    }, [])
  }
  setCellToYourPosition = (list, cells, columns, cols_l, row_len) => {
    let currentSort = 0;
    let num = row_len > 0 ? 1 : 0;
    return (function recurse (children, cells, columns, cols_l) {
      return children && children.map(node => {
        if (!node.hasFuckSon && node.children.length < 1) {
          for (let i = 1; i <= cols_l; i++) {
            for (let c in cells) {
              let cell = cells[c];
              if (+cell.ordinal === currentSort) {
                let x = cell.ordinal % cols_l;
                node[columns[x + num].dataIndex] = cell.formatted_value ? cell.formatted_value : cell.value;
                break;
              }
              continue;
            }
            currentSort += 1;
          }
          return node;
        }
        return Object.assign({}, node, {
          children: recurse(node.children, cells, columns, cols_l) || []
        })
      })
    })(list, cells, columns, cols_l)
  }
  // 麒麟查询结果处理
  _dealWithKylinResultData = (data, curKey, record, isGetDrill) => {
    let rows_l = 0,
      cols_l = 0, // data.columns_axis.tuples.length, 
      measures_l = 0,
      rows_name_list = [],
      cols_name_list = [],
      measures_name_list = [],
      columns_for_table = [],
      data_for_table = [],
      dimension_back_list = [];
    if (data.rows_axis) {
      let levelTreeList = [];
      let rootIndex = 0;
      levelTreeList = data.rows_axis.tuples.reduce((preTup, curTup, index) => {
        if (curTup.length > 0) {
          if (dimension_back_list.length < curTup.length) {
            curTup.forEach((item, index) => {
              if (item.dimension !== 'Measures') {
                !dimension_back_list.includes(item.dimension) && dimension_back_list.push({
                  dimensionName: item.dimension,
                  dimensionLevel: index,
                });
              }
            })
          }
          let curObj = {
            name: '',
            fuckSon: [],
            isLastDrillDimension: true,
          };
          let idx = 0;
          curObj = this._dealMyChildren(curObj, curTup, idx);
          let hasTup = preTup.find(tup => JSON.stringify(tup.selfUrlKey) === JSON.stringify(curObj.selfUrlKey));
          let hasTupIndex = preTup.findIndex(tup => JSON.stringify(tup.selfUrlKey) === JSON.stringify(curObj.selfUrlKey));
          if (hasTup) {
            preTup[hasTupIndex].isLastDrillDimension = false;
            preTup[hasTupIndex].fuckSon.push(...curObj.fuckSon);
          } else {
            if (Object.keys(curObj).length > 0) {
              preTup.push(curObj)
            }
          }
        };
        return preTup;
      }, []);
      let tagLength = `${levelTreeList.length}`;
      if (isGetDrill) {
        levelTreeList = [...this.spliceTreeDataNeed(levelTreeList, record)];
        let newTag = record.myBodyTag.split('-');
        newTag.pop();
        tagLength = `${newTag.join('-')}-${levelTreeList.length}`;
      }
      let newTree = this.giveYourBodyAddTag(levelTreeList, tagLength);
      rows_name_list = [...newTree];
    }

    if (data.columns_axis) {
      data.columns_axis.tuples && data.columns_axis.tuples.forEach(tuple => {
        tuple.forEach(it => {
          if (it.dimension === 'Measures') {
            !measures_name_list.includes(it.caption) && measures_name_list.push(it.caption);
          } else {
            !cols_name_list.includes(it.caption) && cols_name_list.push(it.caption);
          }
        })
      })
    }

    measures_l = measures_name_list.length;
    if (cols_name_list.length < 1) {
      cols_l = measures_name_list.length;
    } else {
      cols_l = measures_name_list.length * cols_name_list.length;
    }
    rows_l = rows_name_list.length > 0 ? 1 : 0;
    // 先计算出表格的表头columns
    console.log('dimension_back_list = ', dimension_back_list);
    if (rows_name_list.length > 0) {
      columns_for_table.push({
        title: '行维度',
        dataIndex: 'dimensionName',
        key: 'dimensionName',
      })
    }
    let columns_for_dim = [];
    let columns_for_mea = [];
    if (dimension_back_list.length > 0) {
      dimension_back_list.sort((a, b) => a - b).forEach(item => {
        let isHierarchy = item.dimensionName.endsWith('-Hierarchy');
        let name = isHierarchy ? item.dimensionName.replace('-Hierarchy', '') : item.dimensionName;
        columns_for_dim.push({
          title: name,
          dataIndex: name,
          key: name,
          level: item.dimensionLevel,
          isHierarchy: isHierarchy,
        })
      })
    }
    if (measures_name_list.length > 0) {
      measures_name_list.forEach(name => {
        columns_for_mea.push({
          title: name,
          dataIndex: name,
          key: name,
          level: 1
        })
      })
    }
    if (cols_name_list.length === 0) {
      measures_name_list.forEach(name => {
        columns_for_table.push({
          title: name,
          dataIndex: name,
          key: name,
        })
      })
    } else {
      measures_name_list.forEach(m_name => {
        cols_name_list.forEach(c_name => {
          columns_for_table.push({
            title: `${c_name}(${m_name})`,
            dataIndex: `${c_name}(${m_name})`,
            key: `${c_name}(${m_name})`,
          })
        })
      })
    }

    if (data.cells) {
      if (rows_name_list.length > 0) {
        rows_name_list.forEach((item, index) => {
          let obj = this.getObjectUseSelfAttr(columns_for_table, item.isDrill, item, `${curKey}-${index}`, data.cells, cols_l, rows_name_list, curKey);
          obj.key = `${curKey}-${index}`;
          obj.parentKey = `${curKey}`;
          obj.dimensionName = item.name;
          data_for_table.push(obj);
        });
      } else {
        // 如果没有行列，只有指标，则需要把指标当成表头行
        measures_name_list.forEach((item, index) => {
          let item_ = {
            name: item,
            fuckSon: [],
            levelAll: [],
            curLevel: 0,
            dimTablesAlias: '',
            alias: item,
            selfUrlKey: [item],
            isLeaf: true,
            myBodyTag: `0-${index}`
          };
          let obj = this.getObjectUseSelfAttr(columns_for_table, false, item_, `${curKey}-${index}`, data.cells, cols_l, rows_name_list, curKey);
          obj.key = `${curKey}-${index}`;
          obj.parentKey = `${curKey}`;
          index < 1 && data_for_table.push(obj)
        })
      }
    }
    let new_data_for_table = this.setCellToYourPosition(data_for_table, data.cells, columns_for_table, cols_l, rows_name_list.length);
    return {
      columns: columns_for_table,
      dataList: new_data_for_table,
      pageOptionsVisible: true,
      combinedColumns: {
        dim_columns: columns_for_dim,
        mea_columns: columns_for_mea,
      }// [...columns_for_dim,...columns_for_mea],
    }
  }
  // 还要再洗一次，主要是把son中嵌套的元素给放到对应的子集中区
  _forReplace = (list) => {
    let finalList = this._dealKylinRes(list);
    finalList.forEach(item => {
      if (item.children.length > 1) {
        item.children = this._forReplace(item.children);
      }
    })
    return finalList;
  }
  _dealKylinRes = (list) => {
    /**
     * 记录list中的selfKey的顺序，结果也按该顺序返回
     */
    let list_key_stash = [];
    list.forEach(l => {
      list_key_stash.push(l.selfUrlKey);
    })
    // let dim_obj = _.groupBy(list, 'dimensionTablesAlias');
    let dim_obj = _.groupBy(list, 'selfAlias');
    let result = [];
    Object.keys(dim_obj).forEach(dim_key => {
      let record = {};
      dim_obj[dim_key].forEach(it => {
        if (record[it.selfUrlKey.length]) {
          record[it.selfUrlKey.length].push(it.selfUrlKey)
        } else {
          record[it.selfUrlKey.length] = [it.selfUrlKey];
        }
      })
      let rList = Object.keys(record).sort((a, b) => a - b);

      let l = rList.length - 1;
      let curList = [];
      _.uniqBy(record[rList[l]], JSON.stringify).forEach(rec => {
        let temp = _.filter(list, it => {
          return it.selfUrlKey.join(',') === rec.join(',');
        })

        if (temp.length > 0) {
          // 判断是否重复
          let _temp = [];
          temp.forEach(it => {
            if (it.levelAll.length > 0 && it.levelCur) {
              _temp.push(it);
            } else {
              let f_id = _.findIndex(_temp, i => i.selfUrlKey.join(',') === rec.join(','));
              if (f_id !== -1) {
                _temp[f_id].children.push(...it.children);
              } else {
                _temp.push(it);
              }
            }
          })
          curList.push(..._temp);
        }
      });
      if (l > 0) {
        while (l > 0) {
          let preList = [];
          let urlKeyList = [];
          // _.uniqBy(record[rList[l-1]], JSON.stringify).forEach(rec => {
          record[rList[l - 1]].forEach(rec => {
            let temp = _.find(list, it => {
              return it.selfUrlKey.join(',') === rec.join(',');
            })
            if (temp) {
              preList.push(temp);
            }
          })
          preList.forEach((pre) => {
            curList.forEach((cur) => {
              let proxy = [...cur.selfUrlKey];
              proxy.pop();
              if (pre.selfUrlKey.join(',') === proxy.join(',')) {
                pre.children.push(cur);
                pre.expanded = true;
                pre.hasRemote = true;
                urlKeyList.push(cur.selfUrlKey.join(','));
              }
            })
          })
          let remainingKey = [];
          let itemUrlKey = [];
          record[rList[l]].forEach(item => {
            itemUrlKey.push(item.join(','));
          })
          remainingKey = _.difference(itemUrlKey, urlKeyList);
          remainingKey.forEach(key => {
            let temp = _.find(curList, it => it.selfUrlKey.join(',') === key);
            if (temp) {
              preList.push(temp);
              record[rList[l - 1]].push(temp.selfUrlKey);
            }
          })
          curList = [...preList];
          l--;
        }
      }
      result = [...result, ...curList];
    })
    let result_prev = [];
    let result_next = JSON.parse(JSON.stringify(result));
    list_key_stash.forEach(lk => {
      let temp = _.find(result_next, it => it.selfUrlKey.join(',') === lk.join(','))
      let temp_idx = _.findIndex(result_next, it => it.selfUrlKey.join(',') === lk.join(','))
      if (temp) {
        result_prev.push(temp);
        result_next.splice(temp_idx, 1);
      }
    })
    // return result;
    return [...result_prev, ...result_next];
  }
  getObjectUseSelfAttr = (list, hasChildren, item, selfKey, cells, cols_l, parent, rootKey) => {
    let obj = new Object();
    for (let key of list) {
      obj[key.dataIndex] = '';
    }
    if (hasChildren || item.fuckSon.length > 0) {
      obj.isDrillDown = true;
      obj.expanded = false;
      obj.constraint_members = item.name;
      obj.levelAll = item.levelAll || [];
      obj.level = item.levelAll[item.curLevel + 1];
      obj.levelCur = item.levelAll[item.curLevel];
      obj.dimensionTablesAlias = item.dimTablesAlias;
      obj.selfAlias = item.alias;
      obj.selfUrlKey = item.selfUrlKey;
      obj.isLeaf = item.isLeaf;
      obj.hasFuckSon = false;
      obj.visible = true;
      obj.hasRemote = false;
      obj.myBodyTag = item.myBodyTag;
      obj.children = [];
      if (item.ownSon.length < 1 && item.fuckSon.length > 0) {
        let son_data_for_table = [];
        item.fuckSon.forEach((it, sonIndex) => {
          let sonObj = this.getObjectUseSelfAttr(list, it.isDrill, it, `${selfKey}-${sonIndex}`, cells, cols_l, item.fuckSon, rootKey);
          sonObj.key = `${selfKey}-${sonIndex}`;
          sonObj.parentKey = `${selfKey}`;
          sonObj.dimensionName = it.name;
          son_data_for_table.push(sonObj);
        })
        obj.children = [...son_data_for_table];
        obj.hasFuckSon = true;
      }
    } else {
      obj.isDrillDown = false;
      obj.expanded = false;
      obj.constraint_members = item.name;
      obj.level = [];
      obj.levelAll = item.levelAll || [];
      obj.level = item.levelAll[item.curLevel + 1];
      obj.levelCur = item.levelAll[item.curLevel];
      obj.dimensionTablesAlias = item.dimTablesAlias;
      obj.selfAlias = item.alias;
      obj.selfUrlKey = item.selfUrlKey;
      obj.isLeaf = item.isLeaf;
      obj.hasFuckSon = false;
      obj.visible = true;
      obj.hasRemote = false;
      obj.myBodyTag = item.myBodyTag;
      obj.children = [];
    }
    return obj;
  }
  whereAreYou = (treeList, posList, posLen, itemList, idx_, expandedKey, columnName) => {
    for (let i = 0; i < treeList.length; i++) {
      if (treeList[i].key == expandedKey) {
        treeList[i].expanded = true;
        treeList[i].hasRemote = true;
      }
      if (i === +posList[idx_]) {
        if (idx_ === posLen - 1) {
          return treeList[i].children = [...itemList];
        } else {
          idx_ += 1;
          return this.whereAreYou(treeList[i].children, posList, posLen, itemList, idx_, expandedKey, columnName);
        }
      }
      continue
    }
  }
  getYourDimensonUrlByKey = (list, key) => {
    return list.reduce((preDim, curDim) => {
      if (curDim.key === key) {
        preDim.push(curDim)
      } else {
        let arr = key.split(curDim.key);
        if (arr[0] === '' && curDim.children) {
          preDim.push(curDim);
          let itemDim = this.getYourDimensonUrlByKey(curDim.children, key);
          preDim.push(...itemDim)
        }
      }
      return preDim;
    }, [])
  }
  getDrillDownResult = (expanded, record) => {
    if (!expanded) return;
    let { projectName, defQueryContext, projectId, dataList } = this.state;
    let defQueryContextCopy = JSON.parse(JSON.stringify(defQueryContext));
    let itemDDDim = this.getYourDimensonUrlByKey(dataList, record.key);
    let spliceIndex = defQueryContextCopy.rows_axis.dimensions.findIndex(dim => dim.dimension_table === record.dimensionTablesAlias && dim.dimension.includes(record.selfAlias));
    defQueryContextCopy.rows_axis.dimensions.forEach(dimension_ => {
      dimension_.levels.forEach(level => {
        itemDDDim.forEach(dddim => {
          let itemMemberIdx = level.constraint_members.findIndex(member => {
            return (dddim.selfUrlKey.join(',').includes(member.join(',')) && dimension_.dimension.includes(dddim.selfAlias));
          })
          if (itemMemberIdx > -1) {
            level.constraint_members = [dddim.selfUrlKey]; // [level.constraint_members[itemMemberIdx]];
          }
        })
      })
    })
    let itemContext = defQueryContextCopy.rows_axis.dimensions.find(dim => {
      return (dim.dimension_table === record.dimensionTablesAlias && dim.dimension.includes(record.selfAlias));
    });
    itemContext.levels.forEach((level, lIdx) => {
      let itemMemberIdx = level.constraint_members.findIndex(member => {
        return record.selfUrlKey.join(',').includes(member.join(','));
      })
      if (itemMemberIdx > -1) {
        level.constraint_members.splice(itemMemberIdx, 1);
        if (level.constraint_members.length < 1) {
          itemContext.levels.splice(lIdx, 1);
        }
      }
    })
    console.log('constraint_members = ', record.selfUrlKey);
    // 要根据record的key去找父层级的维度
    record.level && itemContext.levels.push({
      level: record.level,
      constraint_members: [record.selfUrlKey],
    })
    defQueryContextCopy.rows_axis.dimensions.splice(spliceIndex, 1, itemContext);
    let data = {
      dataset: this.state.tableName,
      rows_axis: {
        dimensions: [...defQueryContextCopy.rows_axis.dimensions],
      },
      columns_axis: defQueryContext.columns_axis,
      measures: defQueryContext.measures,
      filters: defQueryContext.filters,
    }
    this.setState({
      isLoading: true,
      defQueryContextForDown: JSON.parse(JSON.stringify(data))
    })
    let _businessId = this.props.modelId;
    console.log('实时下钻时的_businessId = ', _businessId);
    getKylinResultByAnyData(data, projectId, _businessId).then(res => {
      let myDreamDataSon = this._dealWithKylinResultData(res.data, record.key, record, true);
      let columnNameList = [];
      if (myDreamDataSon.columns) {
        for (let idx in myDreamDataSon.columns) {
          if (myDreamDataSon.columns[idx].dataIndex !== 'dimensionName' && myDreamDataSon.columns[idx].dataIndex) {
            columnNameList.push(myDreamDataSon.columns[idx].dataIndex)
          }
        }
      }
      // 而且需要找到整个链路层的关系，并赋值(record-key)
      let urlKyeList = record.key.split('-');
      urlKyeList.shift();
      let posLen = urlKyeList.length;
      let idx_ = 0;
      this.whereAreYou(dataList, urlKyeList, posLen, myDreamDataSon.dataList, idx_, record.key, columnNameList);
      let newTreeList = this.giveYourBodyAddTag2(dataList, dataList.length);
      console.log('newTreeList -------  = ', newTreeList);
      this.setState({
        dataList: dataList,
        isLoading: false,
        pageOptionsVisible: true,
      })
    }).catch(() => {
      this.setState({
        isLoading: false,
      })
    })
  }
  // 上钻
  getUnDrillDownResult = (expanded, record) => {

  }
  // 每一次下钻或者改变page、size等，全局刷新
  getRefreshResult = (expanded, record) => {
    if (!expanded) return;
    if (!record.level) return;
    let { defQueryContext, projectId, pageOptions } = this.state;
    let curDimensionCondition = {
      level: record.level,
      constraint_members: [[...record.selfUrlKey]]
    }
    for (let i = 0, l = this.recordForDimension.length; i < l; i++) {
      if (this.recordForDimension[i].dimension === `${record.selfAlias}-Hierarchy`) {
        let hasYou = _.findIndex(this.recordForDimension[i].levels, it => {
          // 防止重复点击，重复塞dimension，需要去个重
          return it.level === curDimensionCondition.level && JSON.stringify(it.constraint_members) === JSON.stringify(curDimensionCondition.constraint_members);
        })
        hasYou < 0 && this.recordForDimension[i].levels.push(curDimensionCondition);
        break;
      }
      continue;
    }

    let data = {
      dataset: this.state.tableName,
      rows_axis: {
        limit: +pageOptions.pageSize,
        offset: +pageOptions.offset,
        dimensions: [...this.recordForDimension],
      },
      columns_axis: defQueryContext.columns_axis,
      measures: defQueryContext.measures,
      filters: defQueryContext.filters,
    }
    this.setState({
      isLoading: true,
      defQueryContextForDown: JSON.parse(JSON.stringify(data)),
    })
    /**
     * 继续请求
     */
    let _businessId = this.props.modelId;
    console.log('实时下钻时的_businessId = ', _businessId);
    getKylinResultByAnyData(data, projectId, _businessId).then(res => {
      /**
       * 需要特殊处理的结果--1.对应位置 2.对应子集 3.对应状态
       */
      let myDreamDataSon = this._dealWithKylinResultData(res.data, '0', null, false);
      let columnNameList = [];
      if (myDreamDataSon.columns) {
        for (let idx in myDreamDataSon.columns) {
          if (myDreamDataSon.columns[idx].dataIndex !== 'dimensionName' && myDreamDataSon.columns[idx].dataIndex) {
            columnNameList.push(myDreamDataSon.columns[idx].dataIndex)
          }
        }
      }
      /**
       * 给结果按父子级划分，如果有子集，需要设置expend 为 true
       * this.state.dragListConditions['kylin_dimensions_rows'] 按照维度的选择去分类
       */
      let dataList_finally = this._forReplace(myDreamDataSon.dataList)
      dataList_finally = this.giveYourBodyAddTreeKey(dataList_finally, '0');

      if (res.data?.rows_axis?.size >= this.state.pageOptions.pageSize) {
        pageOptions.hasNext = true;
      } else {
        pageOptions.hasNext = false;
      }
      this.setState({
        dataList: dataList_finally, // myDreamDataSon.dataList,
        isLoading: false,
        pageOptionsVisible: true,
        pageOptions: pageOptions,
      })
    }).catch(() => {
      this.setState({
        isLoading: false,
      })
    })
  }
  // 上钻---即收起来的时候
  getUpDrillResult = (expanded, record) => {
    if (expanded) return;
    if (!record.level) return;
    let { defQueryContext, projectId, pageOptions } = this.state;
    let curDimensionCondition = {
      level: record.level,
      constraint_members: [[...record.selfUrlKey]]
    }
    for (let i = 0, l = this.recordForDimension.length; i < l; i++) {
      if (this.recordForDimension[i].dimension === `${record.selfAlias}-Hierarchy`) {
        let hasYou = _.findIndex(this.recordForDimension[i].levels, it => {
          // 防止重复点击，重复塞dimension，需要去个重
          return it.level === curDimensionCondition.level && JSON.stringify(it.constraint_members) === JSON.stringify(curDimensionCondition.constraint_members);
        })
        // hasYou < 0 && this.recordForDimension[i].levels.push(curDimensionCondition);
        if (hasYou !== -1) {
          let end = this.recordForDimension[i].levels.length - hasYou;
          this.recordForDimension[i].levels.splice(hasYou, end);
          i = i - 1;
          l = l - end;
        }
        break;
      }
      continue;
    }

    let data = {
      dataset: this.state.tableName,
      rows_axis: {
        limit: +pageOptions.pageSize,
        offset: +pageOptions.offset,
        dimensions: [...this.recordForDimension],
      },
      columns_axis: defQueryContext.columns_axis,
      measures: defQueryContext.measures,
      filters: defQueryContext.filters,
    }
    this.setState({
      isLoading: true,
      defQueryContextForDown: JSON.parse(JSON.stringify(data)),
    });
    let _businessId = this.props.modelId;
    console.log('实时下钻时的_businessId = ', _businessId);
    getKylinResultByAnyData(data, projectId, _businessId).then(res => {
      /**
       * 需要特殊处理的结果--1.对应位置 2.对应子集 3.对应状态
       */
      let myDreamDataSon = this._dealWithKylinResultData(res.data, '0', null, false);
      let columnNameList = [];
      if (myDreamDataSon.columns) {
        for (let idx in myDreamDataSon.columns) {
          if (myDreamDataSon.columns[idx].dataIndex !== 'dimensionName' && myDreamDataSon.columns[idx].dataIndex) {
            columnNameList.push(myDreamDataSon.columns[idx].dataIndex)
          }
        }
      }
      /**
       * 给结果按父子级划分，如果有子集，需要设置expend 为 true
       * this.state.dragListConditions['kylin_dimensions_rows'] 按照维度的选择去分类
       */
      let dataList_finally = this._forReplace(myDreamDataSon.dataList)
      dataList_finally = this.giveYourBodyAddTreeKey(dataList_finally, '0');

      if (res.data?.rows_axis?.size >= this.state.pageOptions.pageSize) {
        pageOptions.hasNext = true;
      } else {
        pageOptions.hasNext = false;
      }
      this.setState({
        dataList: dataList_finally, // myDreamDataSon.dataList,
        isLoading: false,
        pageOptionsVisible: true,
        pageOptions: pageOptions,
      })
    }).catch(() => {
      this.setState({
        isLoading: false,
      })
    })
  }
  // 分页查询
  getResultByPageAndSize = (limit, offset) => {
    let { defQueryContext, projectId, pageOptions } = this.state;
    pageOptions.pageSize = limit;
    pageOptions.curPage = offset;
    pageOptions.offset = (+limit) * (+offset);
    let data = {
      dataset: this.props.tableName,
      rows_axis: {
        limit: +pageOptions.pageSize,
        offset: +pageOptions.offset,
        dimensions: [...this.recordForDimension],
      },
      columns_axis: defQueryContext.columns_axis,
      measures: defQueryContext.measures,
      filters: defQueryContext.filters,
    }
    this.setState({
      isLoading: true,
      defQueryContextForDown: JSON.parse(JSON.stringify(data)),
    })
    let _businessId = this.props.modelId;
    console.log('实时下钻时的_businessId = ', _businessId);
    getKylinResultByAnyData(data, projectId, _businessId).then(res => {
      let myDreamDataSon = this._dealWithKylinResultData(res.data, '0', null, false);
      let columnNameList = [];
      if (myDreamDataSon.columns) {
        for (let idx in myDreamDataSon.columns) {
          if (myDreamDataSon.columns[idx].dataIndex !== 'dimensionName' && myDreamDataSon.columns[idx].dataIndex) {
            columnNameList.push(myDreamDataSon.columns[idx].dataIndex)
          }
        }
      }
      // let dataList_finally = this._dealKylinRes(myDreamDataSon.dataList);
      let dataList_finally = this._forReplace(myDreamDataSon.dataList)
      dataList_finally = this.giveYourBodyAddTreeKey(dataList_finally, '0');
      if (res.data?.rows_axis?.size >= this.state.pageOptions.pageSize) {
        pageOptions.hasNext = true;
      } else {
        pageOptions.hasNext = false;
      }
      this.setState({
        dataList: dataList_finally, // myDreamDataSon.dataList,
        isLoading: false,
        pageOptionsVisible: true,
        pageOptions: pageOptions,
      })
    }).catch(() => {
      this.setState({
        isLoading: false,
      })
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
      // tableType: 1,
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
      // 每次保存运行，应该把分页重置！！！！
      this.setState(state => ({
        ...state,
        pageOptions: {
          pageSize: 10,
          curPage: 0,
          offset: 0,
          hasNext: false,
        },
      }), () => {
        let commitParams = this.handleParams();
        commitParams = {
          ...commitParams,
          sliceName: values?.sliceName || this.state.basicInfo?.sliceName,
          description: values.description || this.state.basicInfo?.description || '',
          id: this.state.basicInfo.id || null,
          subjectId: this.state.subjectId,
          projectId: this.state.projectId, // '16154065966473216',
          projectName: this.state.projectName,
        }
        //return
        this.setState({
          exploreLoading: true,
          isLoading: true,
        }, () => {
          saveKylinAnyData(commitParams).then(res => {
            const that = this;
            if (res.msg == 'success') {
              // 需要对麒麟返回的结果进行处理，然后展示在列表中
              // let myDreamData = this._dealWithKylinResultData(res.data.result, '0', null, false);
              // let dataList_finally = this._forReplace(myDreamData.dataList)
              // dataList_finally = this.giveYourBodyAddTreeKey(dataList_finally, '0');
              // let { basicInfo, pageOptions } = this.state;
              // basicInfo.id = res.data.id;
              // if (flag == '') {
              //   basicInfo.sliceName = values.sliceName;
              //   basicInfo.description = values.description;
              // }
              /**
               * res.data.result.rows_axis.offset
               * res.data.result.rows_axis.size
               */
              // if (res.data.result?.rows_axis?.size >= this.state.pageOptions.pageSize) {
              //   pageOptions.hasNext = true;
              // } else {
              //   pageOptions.hasNext = false;
              // }

              runAnalysisTaskForSelfCheckout({sliceId: res.data.id}).then(() => {
                console.log('埋点成功')
              }).catch((err) => {
                console.log('埋点失败')
                message.error(err.msg || '埋点失败')
              })
              this.setState({
                // basicInfo: basicInfo,
                // columns: myDreamData.columns,
                // combinedColumns: myDreamData.combinedColumns,
                // dataList: dataList_finally, // myDreamData.dataList,
                // pageOptionsVisible: true,
                visibleBasicInfo: false,
                exploreLoading: false,
                // isLoading: false,
                // pageOptions: pageOptions,
                // firstSaveSliceId: res.data.id,
              }, () => {
                message.success('运行成功', 2, function () {
                  that.props.onBack();
                })
              })
              // this.props.onResetTabsName(values.sliceName, res.data.id);
            }
          }).catch(err => {
            message.error(err || err.msg);
            this.setState({
              visibleBasicInfo: false,
              exploreLoading: false,
              isLoading: false
            })
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

  getData = async (id) => {
    this.setState({ isLoading: true })
    try {
      let resData = await taskPageResultPage({ id, size: this.state.pageSize, page: this.state.pageNo - 1 });
      let cloumns = resData.data?.data.columns || [],
        tableCloumns = [],
        name = '',
        tempRecords = resData.data?.data.records || [];
      for (let j = 0; j < cloumns.length; j++) {
        name = cloumns[j].show_name;
        tempRecords.forEach(record => {
          record[name] = cloumns[j].columnType === 'INDEX' && cloumns[j].isItThousands == 1 ? numToMoneyField(record[name], cloumns[j].precisions) : record[name];
        })
        const sortableFn = (key, columnType) => {
          return (a, b) => {
            return columnType == 'INDEX' ? (clearComma(a[key]) - clearComma(b[key])) : (a[key].length - b[key].length)
          }
        }
        tableCloumns[j] = {
          title: name,
          dataIndex: name,
          width: 200,
          align: 'left',
          ellipsis: true,
          sorter: sortableFn(name, cloumns[j].columnType)
        }
      }
      const filterOptions = tableCloumns.map(it => ({
        label: it.title,
        value: it.dataIndex
      }))
      const checkedValue = filterOptions.map(it => it.value);
      this.setState({
        columns: tableCloumns,
        defcolumns: tableCloumns,
        filterOptions,
        checkedValue,
        dataList: tempRecords.map((record, index) => {
          return { ...record, key: index }
        }),
        pageNo: resData.data?.data.page + 1,
        total: resData.data?.data.totalCount,
        isLoading: false
      }, () => {
        localStorage.removeItem(getTableKey('analysis'));
        const checkedValue = this.state.checkedValue;
        this.onFilterChange(checkedValue, 'analysis');
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
  // 分页查询
  handleTableChange = (page, size) => {
    this.setState({

    })
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
    //指标必填---0325增加校验
    let isQuotasObj = dragList.find(it => it.label === 'kylin_quotas') || {};
    if (!isQuotasObj?.children.length) {
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
      this.setState({
        isLoading: true,
        templateModalData: {
          ...templateModalData,
          isLoading: true,
        }
      }, () => {
        const paramsObj = this.handleParams()
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

  handleExploreModalShow = () => {
    let { defQueryContextForDown, projectId } = this.state;
    let payload = JSON.parse(JSON.stringify(defQueryContextForDown));
    let _businessId = this.props.modelId;
    delete payload.rows_axis.limit;
    delete payload.rows_axis.offset;
    this.setState(state => ({
      ...state,
      emailModalData: {
        ...state.emailModalData,
        visibleEmailInfo: true,
        downLoadApi: {
          start: getKylinDownLoadStart,
          down: getKylinDownLoadData,
          poll: getKylinDownLoadStatus
        },
        downLoadUrl: `sliceId=${this.props?.sliceId}&businessId=${_businessId}&projectId=${projectId}`,
        downLoadParams: payload,
        isKylin: true
      }
    }))
  }

  handleExploreForDownloadData = (data) => {
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
        let { defQueryContextForDown, projectId } = this.state;
        let email = data.emailStr ?? ''; // this.state.emailModalData.mcdEmail;
        let sliceName = this.state.basicInfo.sliceName;
        let payload = JSON.parse(JSON.stringify(defQueryContextForDown));
        let _businessId = this.props.modelId;
        console.log('导出csv的_businessId = ', _businessId);
        delete payload.rows_axis.limit;
        delete payload.rows_axis.offset;
        getKylinDownLoadData(payload, sliceName, projectId, email, _businessId).then(res => {
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
          err && message.error(err.msg);
          this.setState(state => ({
            ...state,
            isLoading: false,
            emailModalData: {
              ...state.emailModalData,
              isLoading: false,
            }
          }))
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

  repeatCollapse = (list, collapse, indentation, collType) => {
    return list.map(child => {
      if (child.isLeaf && !child.isFolder) {
        return (
          <ReactSortable
            list={[child]}
            setList={(newState) => { }}
            animation={150}
            group={{
              name: "disable-group-name",
              pull: "clone",
              put: false,
            }}
            clone={(item) => ({ ...item })}
            sort={false}
            chosenClass="sortable-drag"
            onStart={(target) =>
              this.setSortStart(collapse.label, target, child)
            }
            onEnd={() =>
              this.setState({
                dragFromClassify: "",
                dragItemId: null,
              })
            }
            key={child.treekey}
          >
            {[child].map((listItem) => {
              return (
                <div
                  className="meta-sortable-box"
                  // key={listItem.treekey}
                  key={`${listItem.dimension_tables_alias}_${listItem.alias}`}
                  data-filterable={listItem?.is_visible}
                  data-groupby={listItem?.is_visible}
                  data-isdrilldown={listItem?.is_drill_down}
                >
                  {listItem?.is_drill_down ? <SvgIcon icon='drill_down' className='normal_dim_icon'></SvgIcon> : <SvgIcon icon='normal_dim' className='normal_dim_icon'></SvgIcon>}
                  <Tooltip
                    title={`${listItem.alias}: ${listItem?.translation}`}
                    trigger="click"
                  >
                    <div className="oap-drag-item ellipsis">
                      {listItem.alias}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </ReactSortable>)
      } else {
        let eleDom = collType === 'activeCollapseForDM' ? <Collapse
          accordion
          expandIconPosition="end"
          ghost
          key={child.treekey}
          activeKey={this.state.activeCollapseForDM[indentation]}
          onChange={(key) => this.openTreekey(key, 'DM', child)}
        >
          <Collapse.Panel
            header={
              <div style={{ marginLeft: `${indentation * 20}px` }}>
                <Tooltip
                  title={child.alias}
                  trigger="click"
                >
                  <SvgIcon icon='folder' className='folder_icon'></SvgIcon>
                  {child.alias}
                </Tooltip>
              </div>
            }
            key={child.treekey}
          >{this.repeatCollapse(child.children, collapse, indentation + 1, 'activeCollapseForDM')}</Collapse.Panel></Collapse> : <Collapse
            accordion
            expandIconPosition="end"
            ghost
            key={child.treekey}
            activeKey={this.state.activeCollapseForQM[indentation]}
            onChange={(key) => this.openTreekey(key, 'QM', child)}
          >
          <Collapse.Panel
            header={
              <div style={{ marginLeft: `${indentation * 20}px` }}>
                <Tooltip
                  title={child.alias}
                  trigger="click"
                >
                  <SvgIcon icon='folder' className='folder_icon'></SvgIcon>
                  {child.alias}
                </Tooltip>
              </div>
            }
            key={child.treekey}
          >{this.repeatCollapse(child.children, collapse, indentation + 1, 'activeCollapseForQM')}</Collapse.Panel></Collapse>
        return eleDom;
      }
    })
  }

  createMetaElement = () => {
    return (this.state.collapseList.map((collapse) => {
      return (
        <div className="oap-Collapse-area" key={collapse.title}>
          <div className="content-title">{collapse.title}</div>
          {collapse.label == "quotas" ? (
            <Collapse
              accordion
              expandIconPosition="end"
              ghost
              activeKey={this.state.activeCollapseForQM[0]}
              onChange={(key) => this.openTreekey(key, 'QM', collapse)}
            >
              {collapse.children.length > 0 && collapse.children.map((child) => {
                return (
                  child.children.length > 0 && <Collapse.Panel
                    header={
                      <div>
                        <Tooltip
                          title={child.alias}
                          trigger="click"
                        >
                          {child.isFolder ? <SvgIcon icon='folder' className='folder_icon'></SvgIcon> : null}
                          {child.alias}
                        </Tooltip>
                      </div>
                    }
                    key={child.treekey}
                  >
                    {
                      child.isLeaf ? <ReactSortable
                        list={child.children}
                        setList={(newState) => { }}
                        animation={150}
                        group={{
                          name: "disable-group-name",
                          pull: "clone",
                          put: false,
                        }}
                        clone={(item) => ({ ...item })}
                        sort={false}
                        chosenClass="sortable-drag"
                        onStart={(target) =>
                          this.setSortStart(collapse.label, target, child)
                        }
                        onEnd={() =>
                          this.setState({
                            dragFromClassify: "",
                            dragItemId: null,
                          })
                        }
                      >
                        {child.children.length > 0 &&
                          child.children.map((listItem) => {
                            return (
                              <div
                                key={listItem.treekey}
                                data-filterable={listItem?.isCalculate}
                                data-groupby={listItem?.isCalculate}
                                data-isdrilldown={false}
                              >
                                <Tooltip
                                  title={`${listItem.alias}: ${listItem?.translation}`}
                                  trigger="click"
                                >
                                  <div className="oap-drag-item ellipsis">
                                    {listItem.alias}
                                  </div>
                                </Tooltip>
                              </div>
                            );
                          })}
                      </ReactSortable> : this.repeatCollapse(child.children, collapse, 1, 'activeCollapseForQM')
                    }
                  </Collapse.Panel>);
              })}
            </Collapse>
          ) : (
            <Collapse
              accordion
              expandIconPosition="end"
              ghost
              activeKey={this.state.activeCollapseForDM[0]}
              onChange={(key) => this.openTreekey(key, 'DM', collapse)}
            >
              {collapse.children_dim.length > 0 && collapse.children_dim.map((child) => {
                return (
                  child.children.length > 0 && <Collapse.Panel
                    header={
                      <div>
                        <Tooltip
                          title={child.alias}
                          trigger="click"
                        >
                          {child.isFolder ? <SvgIcon icon='folder' className='folder_icon'></SvgIcon> : null}
                          {child.alias}
                        </Tooltip>
                      </div>
                    }
                    key={child.treekey}
                  >
                    {
                      child.isLeaf ? <ReactSortable
                        list={child.children}
                        setList={(newState) => { }}
                        animation={150}
                        group={{
                          name: "disable-group-name",
                          pull: "clone",
                          put: false,
                        }}
                        clone={(item) => ({ ...item })}
                        sort={false}
                        chosenClass="sortable-drag"
                        onStart={(target) =>
                          this.setSortStart(collapse.label, target, child)
                        }
                        onEnd={() =>
                          this.setState({
                            dragFromClassify: "",
                            dragItemId: null,
                          })
                        }
                      >
                        {child.children && child.children.map((listItem) => {
                          return (
                            <div
                              className="meta-sortable-box"
                              // key={listItem.treekey}
                              key={`${listItem.dimension_tables_alias}_${listItem.alias}`}
                              data-filterable={listItem?.is_visible}
                              data-groupby={listItem?.is_visible}
                              data-isdrilldown={listItem?.is_drill_down}
                            >
                              {listItem?.is_drill_down ? <SvgIcon icon='drill_down' className='normal_dim_icon'></SvgIcon> : <SvgIcon icon='normal_dim' className='normal_dim_icon'></SvgIcon>}
                              <Tooltip
                                title={`${listItem.alias}: ${listItem?.translation}`}
                                trigger="click"
                              >
                                <div className="oap-drag-item ellipsis">
                                  {listItem.alias}
                                </div>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </ReactSortable> : this.repeatCollapse(child.children, collapse, 1, 'activeCollapseForDM')
                    }
                  </Collapse.Panel>);
              })
              }
            </Collapse>
          )}
        </div>
      );
    }))
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

  render () {
    const { projectName, tableName, projectId, basicInfo, currentModelId } = this.state;
    const businessId = this.props.modelId;
    return (
      <Spin spinning={this.state.isLoading}>
        <div className="oap-container just-for-kylin" style={{ padding: '0 16px 16px' }}>
          <Row id={this.state.bigBoxId} className="oap-row">
            <Col
              id={this.state.leftBoxId}
              className="oap-analysis-col-flex"
              style={{ width: "182px", height: '100vh' }}
            >
              <div className="oap-card">
                <div className="oap-flex-between content-title">
                  <span>数据信息</span>
                  <AutoNotice noticeData={this.state.noticeData} modelId={currentModelId} openChange={this.openChange} />
                </div>
                <div className="oap-update-time">
                  <Tooltip placement="topLeft" title={basicInfo.name}>
                    <p className="title ellipsis">{basicInfo.name || "--"}</p>
                  </Tooltip>
                  {/* <p className="font-gray">
                    数据更新时间:
                  </p> */}
                  <p>{basicInfo.lastModifyAt || "----"}</p>
                  {/* <p>{"----"}</p> */}
                </div>
              </div>
              <SearchInput placeholder="搜索维度/指标" btnWidth={56} onSearch={(str) => this.handleSearch(str)} />
              <div className="oap-card padnone oap-analysis-leftList">
                {this.state.collapseList.length ? (
                  this.createMetaElement()
                ) : (
                  <div className="oap-flex-between">暂无数据</div>
                )}
              </div>
            </Col>
            <Col id={this.state.resizeBox1Id}>
              <div
                style={{ width: "16px", height: "100%", cursor: "ew-resize" }}
                onMouseDown={(e) =>
                  this.darggableWidth(e, this.state.resizeBox1Id)
                }
              ></div>
            </Col>
            <Col
              id={this.state.middleBoxId}
              className="you-fill-item-to-it"
              style={{ width: "182px", overflowY: "auto", height: '100%' }}
            >
              {this.state.dragList.map((dragBox, boxIndex) => {
                return (
                  <div
                    className="oap-card oap-drag-containBox"
                    key={dragBox.title}
                    id={`analysisDrag${boxIndex}`}
                  >
                    <div className="oap-drag-container">
                      <div className="content-title">
                        <img
                          src={require(`@/locales/images/${dragBox.iconName}.png`)}
                          alt="icon"
                          width={20}
                        />
                        <span className="label">{dragBox.title}</span>
                      </div>
                      <ReactSortable
                        list={dragBox.children}
                        setList={(newState) =>
                          this.setSortableList(newState, boxIndex)
                        }
                        animation={150}
                        group={{ name: "disable-group-name", pull: "clone" }}
                        chosenClass="sortable-drag"
                        onStart={(target) =>
                          this.setDragBoxSortStart(boxIndex, target)
                        }
                        className={[
                          "drag-toContent",
                          dragBox.classify.includes(this.state.dragFromClassify)
                            ? "drag-able-content"
                            : "",
                        ].join(" ")}
                      >
                        {dragBox.children.map((child, childIdx) => {
                          return (
                            <div
                              className="oap-flex-between oap-drag-item"
                              key={`${dragBox.label}-${child.alias}`}
                              data-classify={dragBox.flag}
                            >
                              <div className="name ellipsis">
                                {child?.alias}
                              </div>
                              <div className="oap-drag-item-action">
                                {['kylin_filters'].includes(dragBox.label) ? (
                                  <IconEditA
                                    onClick={() =>
                                      this.handleEdit(
                                        dragBox.label,
                                        child.id,
                                        childIdx
                                      )
                                    }
                                  />
                                ) : null}
                                {dragBox.label === "filters" &&
                                  child?.deleteFlag ? null : (
                                  <IconClose
                                    onClick={() =>
                                      this.handleDelete(boxIndex, childIdx)
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </ReactSortable>
                    </div>
                    <div
                      id={`midResizeBox${boxIndex}`}
                      style={{
                        width: "100%",
                        height: "0px",
                        cursor: "ns-resize",
                      }}
                    ></div>
                  </div>
                );
              })}
            </Col>
            <Col id={this.state.resizeBox2Id}>
              <div
                style={{ width: "16px", height: "100%", cursor: "ew-resize" }}
                onMouseDown={(e) =>
                  this.darggableWidth(e, this.state.resizeBox2Id)
                }
              ></div>
            </Col>
            <Col id={this.state.rightBoxId} className="oap-ananlysis-right">
              <div
                className="table-container oap-card oap-analysisList"
                style={{
                  height: "100%",
                }}
              >
                <div className="oap-card-top">
                  <Row className="oap-row" justify="space-between">
                    <Col style={{ minWidth: "452px", width: "62%" }}>
                      {this.state.basicInfo.sliceName ? (
                        <div className="oap-card-top-title">
                          <Tooltip
                            title={this.state.basicInfo.sliceName}
                            className="oap-flex-row oap-flex-row-align"
                          >
                            <div
                              className="title ellipsis"
                              style={{ maxWidth: "90%" }}
                            >
                              <span>{this.state.basicInfo.sliceName}</span>
                            </div>
                            <IconEditA onClick={this.handleAnalysisEdit} />
                          </Tooltip>
                          <Tooltip title={this.state.basicInfo.description}>
                            <div className="ellipsis">
                              {this.state.basicInfo.description}
                            </div>
                          </Tooltip>
                        </div>
                      ) : (
                        ""
                      )}
                    </Col>
                    {checkMyPermission('oap:home:kylinQuery') ? <Col
                      flex={
                        ["edit"].includes(this.props.type) ? "20px" : "80px"
                      }
                    >
                      <Space>
                        <Button
                          type="primary"
                          onClick={this.props.onChooseData}
                        >
                          创建分析
                        </Button>
                        {["edit"].includes(this.props.type) && (
                          <Button onClick={this.handleCopy}>
                            复制查询条件
                          </Button>
                        )}
                      </Space>
                    </Col> : null}
                  </Row>
                </div>
                <ShowCondition title={'筛选'} iconType={'kylin_filters'} showList={this.state.dragListConditions['kylin_filters']} />
                <div className="table-top-wrap i-have-bottom-btn">
                  <div className="table-tops">
                    <Space>
                      {checkMyPermission('oap:home:kylinQuery') ?
                        <Button
                          type="primary"
                          onClick={() => this.handleExplore()}
                          disabled={currentModelId == null}
                          loading={this.state.exploreLoading}
                        >
                          保存并运行
                        </Button> : null}
                      {checkMyPermission('oap:templatemain:save') ? <Button
                        onClick={this.handleTemplate}
                        disabled={currentModelId == null}>保存为模板</Button> : null}
                      {['template'].includes(this.props.type) ? null : <Button
                        disabled={['create', 'copy'].includes(this.props.type) || this.state.dataList.length < 1}
                        onClick={this.handleExploreModalShow}
                      >导出CSV</Button>}
                    </Space>
                  </div>
                  <MergeTable
                    columns={this.state.combinedColumns}
                    dataSource={this.state.dataList}
                    onExpand={(expanded, record) => this.getRefreshResult(expanded, record)}
                    onUpDrill={(expanded, record) => this.getUpDrillResult(expanded, record)}
                  />
                  {this.state.pageOptionsVisible ? <PageJump pageOptions={this.state.pageOptions} ref={this.pagination} onFetchList={(limit, offset) => this.getResultByPageAndSize(limit, offset)} /> : null}
                </div>
              </div>
            </Col>
          </Row>
        </div>
        <SetCondition
          businessId={businessId}
          projectId={projectId}
          projectName={projectName}
          tableName={tableName}
          visible={this.state.visibleConditon}
          title={this.state.titleConditon}
          item={this.state.itemConditon}
          childCondition={this.state.childCondition}
          classify={this.state.classifyConditon}
          currentIndex={this.state.currentConditionIndex}
          changeVisible={this.changeSetConditionVisible}
          completeSet={this.handCompleteSet}></SetCondition>
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
                        {this.state.subjectModel.map(model => {
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
                                return Promise.reject('您输入的全部是空格，请重新输入');
                              } else {
                                return Promise.resolve();
                              }
                            } else {
                              return Promise.reject("请输入查询名称")
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
        <SaveTemplateModal {...this.state.templateModalData} onSaved={this.confirmSaveTemplate} />
        <ExploreEmailModal onExplored={this.handleExploreForDownloadData} {...this.state.emailModalData} />
      </Spin>
    );
  }
}

export default Index;
