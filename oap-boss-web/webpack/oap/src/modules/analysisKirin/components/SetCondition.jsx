import React from 'react';
// import { Modal, Form, Row, Col, Button, Input, Select, DatePicker, Spin, Empty, Tooltip, message } from '@mcd/portal-components';
// import { PlusOutlined, DeleteOutlined, LoadingOutlined, CloudUploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Space, Modal, Row, Col, Button, Input, Select, Spin, Tooltip, message, Popconfirm } from '@aurum/pfe-ui';
import { TreeSelect, Form } from 'antd';
import { IconAddB, IconAddA, IconReduceCircleB, IconClearUp, IconUpload, IconInfoCircle } from '@aurum/icons';
import { getConditionConfig, queryCascadeFieldInfoList, queryFieldCascadeList, getKylinResultByAnyData } from '@/api/oap/self_analysis.js';
import { getFileContent, uuid } from '@/utils/store/func';
import _ from 'lodash';
//import '@/style/data.less';
/**
 * 筛选条件拼接规则
 * filters: [
 *  {
 *    dimension_table: 'Base Product Menu Item',
 *    dimension: 'Base Menu Item Code',
 *    operator: 'IN',
 *    filter_members: ['100001', '10002']
 *  },
 * ]
 */
/**
 * 2022-07-13改kylin
 * filters: [
 *  {
 *    dimension_table: 'xxx',
 *    dimension: 'xxx',
 *    by_dimension_grouped: [
 *      [
 *        {
 *          operator: 'IN',
 *          filter_members: [
 *            [202201],
 *            [202202]
 *          ]
 *        }
 *      ],
 *      [
 *        {
 *          operator: 'BETWEEN',
 *          level: 'YEAR',
 *          value: '1',
 *          comparator_equals: false,
 *          second_value: '3',
 *          second_comparator_equals: true,
 *        }
 *      ],
 *      [
 *        {
 *          operator: 'LESS_THAN',
 *          level: '',
 *          value: '',
 *          comparator_equals: false,
 *        }
 *      ]
 *    ]
 *  }
 * ]
 */
export default class SetCondition extends React.Component {
  constructor(props) {
    super(props);
    // console.log('set condition 的 props = ', props);
    // console.log('props = ', props);
    console.log('我刚刚改了，这是新代码！')
    this.formRef = React.createRef()
    this.fileInput = React.createRef()
    this.treeSelectRef = React.createRef();
    this.treeSelectRefSingle = React.createRef();
    this.treeSelectRefSingle1 = React.createRef();
    this.treeSelectRefSingle2 = React.createRef();
    this.flag = '';
    this.canLoad = false;
    this.logicalOptions = [
      {
        label: 'AND',
        value: 'AND'
      },
      {
        label: 'OR',
        value: 'OR'
      }
    ]
    this.state = {
      columns: [],
      form: {},
      spinLoading: false,
      fieldCascadeList: [],
      operates: [
        { label: 'in', value: 'IN' },
        { label: 'not in', value: 'NOT_IN' },
        // {label: '>', value: 'GREATER_THAN'},
        // {label: '>=', value: 'GREATER_THAN_EQUAL'},
        // {label: '<', value: 'LESS_THAN'},
        // {label: '<=', value: 'LESS_THAN_EQUAL'},
        { label: '>', value: '>' },
        { label: '>=', value: '>=' },
        { label: '<', value: '<' },
        { label: '<=', value: '<=' },
        { label: 'between', value: 'BETWEEN' },
      ], //逻辑关系列表
      selectInputVoList: [], //枚举值列表
      uploadIndex: null,
      addONSelectInputVoList: {},//addON的枚举值
      dimValueTree: [
        {
          caption: '',
          dimension: '',
          dimension_table: '',
          id: '0-0',
          pId: '0',
          child: [],
          // key: 'All',
          label: 'All',
          // value: ['All'],
          // value: 'All',
          // key: '0-0',
          // value: '0-0',
          key: 'all--root',
          value: 'all--root',
          title: 'All',
          isLeaf: false,
          preString: '',
        }
      ], // 枚举值树
      checkboxValueList: [],
      treeSearchValue: '',
      dimValueTreeSingle: [],
      treeExpandedKeys: [],
      showCurValue: '',
      showCurPop: false,
      curPropType: '',
    }
  }
  // componentDidMount() {
  //   this.setState({
  //     curPropType: this.props.item.desc.type || ''
  //   })
  // }
  componentWillUnmount () {
    this.setState = () => false;
  }
  componentWillReceiveProps (nextProps) {
    console.log('nextProps = ', nextProps);
    if (nextProps.visible && !this.props.visible) this.getCloumns(nextProps)
  }

  getCloumns = (props) => {
    const { classify, item } = props
    const columnName = {
      label: '维度字段',
      key: 'show_name',
      initValue: item.alias || '',
      disabled: true
    }
    let columns = [], formObj = {};
    this.handleConfig(item); // 获取维度枚举值
    // let nodeItem = this.state.dimValueTree[0];
    // this.onLoadData(nodeItem);
    // switch (classify) {
    //   case 'filters':
    //     let initValue = (item.filter_values && item.filter_values.length) ? item.filter_values.map(member => {
    //       return {
    //         ...member
    //       }
    //     }) : [{
    //       operator: 'IN',
    //       filter_members: [],
    //     }]
    //     columns = [
    //       columnName,
    //       {
    //         label: '字段枚举值',
    //         key: 'filter_values',
    //         element: 'selectMulti',
    //         initValue,
    //       }
    //     ]
    //     columns.forEach(column => {
    //       if (!formObj[column.key]) formObj[column.key] = column.initValue || []
    //     })
    //     break;
    // }
    if (['kylin_filters', 'kylin_dimensions_rows', 'kylin_dimensions_columns'].includes(classify)) {
      let initValue = (item.filter_values && item.filter_values.length) ? item.filter_values.map(member => {
        return {
          ...member,
          treeRef: React.createRef(),
          uuid: uuid(),
          logicalOperator: 'OR',
        }
      }) : [{
        operator: 'IN',
        disabled: true,
        filter_members: ['all--root'],
        filter_members_arr: [],
        filter_members_name: [],
        level: '',
        value: '', // [],
        comparator_equals: false,
        second_value: '', // [],
        second_comparator_equals: false,
        second_level: '',
        treeSearchValue: '',
        treeRef: React.createRef(),
        uuid: uuid(),
        logicalOperator: 'OR',
        negative: false,
      }];
      let elementType = 'selectMulti';
      if (['kylin_filters'].includes(classify)) {
        elementType = 'between';
        initValue[0].disabled = false;
      }
      columns = [
        columnName,
        // {
        //   label: '字段枚举值',
        //   key: 'filter_values',
        //   element: 'selectMulti',
        //   initValue,
        // },
        {
          label: '字段枚举值',
          key: 'filter_values',
          element: elementType,
          initValue,
        },
      ]
      columns.forEach(column => {
        if (!formObj[column.key]) formObj[column.key] = column.initValue || []
      })
    }
    console.log('formObj =', formObj);
    this.setState({
      columns,
      form: formObj,
      dimValueTree: [
        {
          caption: '',
          dimension: '',
          dimension_table: '',
          id: '0-0',
          pId: '0',
          child: [],
          // key: 'All',
          label: 'All',
          // value: 'All',
          // value: ['All'],
          // key: '0-0',
          // value: '0-0',
          key: 'all--root',
          value: 'all--root',
          title: 'All',
          isLeaf: false,
          preString: '',
        }
      ],
      dimValueTreeSingle: [],
      curPropType: props.item.desc.type || '',
    })
  }

  cancelModal = (type) => {
    if (type == 'ok') {
      this.setFormValueForArr();
      this.formRef.current.validateFields().then(formData => {
        let tempFormData = formData;
        let isEqualLevel = true;
        for (let i = 0, l = formData.filter_values.length; i < l; i++) {
          let cur = formData.filter_values[i]
          if (cur.operator.includes('BETWEEN')) {
            if (cur.value.split('--').pop() !== cur.second_value.split('--').pop()) {
              isEqualLevel = false;
              break;
            }
            continue;
          }
        }
        if (!isEqualLevel) {
          return message.warning('请选择相同的级联！')
        }
        this.props.completeSet({ form: { ...tempFormData, id: this.props.item.alias, name: this.props.item.name, show_data_type: 'SelectMulti' }, classify: this.props.classify })
        this.props.changeVisible(false)
      }).catch(errorInfo => {
        console.log('errorInfo', errorInfo)
      })
    } else {
      this.props.changeVisible(false)
    }
  };

  //获取逻辑关系、枚举值等相关配置
  handleConfig = async (obj) => {
    this.setState({
      spinLoading: true,
      selectInputVoList: [],
    })
    try {
      // console.log('obj1111111111111 =', obj);
      let dimensions = [];
      if (obj.is_drill_down) { // 下钻维度
        obj.dim_cols_alias[0] && dimensions.push({
          dimension: `${obj.alias}-Hierarchy`,
          dimension_table: obj.dimension_tables_alias,
          levels: [
            {
              level: obj.dim_cols_alias[0]
            }
          ]
        })
        console.log('下钻的 constraint_members 的 level = ',  obj.dim_cols_alias[0]);
      } else {
        obj.alias && dimensions.push({
          dimension: obj.alias,
          dimension_table: obj.dimension_tables_alias,
          levels: [
            {
              level: obj.alias,
            }
          ]
        })
        console.log('constraint_members 的 level = ',  obj.alias);
      }
      const data = {
        dataset: this.props.tableName,// 'PMIX_SET_HF',
        rows_axis: {
          dimensions: dimensions,
        }
      }
      await getKylinResultByAnyData(data, this.props.projectId, this.props.businessId).then(res => {
        let isLeaf = this.props.item?.is_drill_down ? false : true;
        let { dimValueTree, dimValueTreeSingle } = this.state;
        let dimValueTreeChild = this.dealWithEnumTreeList(res.data?.rows_axis?.tuples, isLeaf, '0-0', ['All']);
        dimValueTree[0].child = [...dimValueTreeChild];
        let dimValueTreeSingleChild = this.dealWithEnumTreeList(res.data?.rows_axis?.tuples, isLeaf, '0-0', ['All']);
        dimValueTreeSingle = [...dimValueTreeSingleChild];
        this.setState({
          dimValueTree: [...dimValueTree, ...dimValueTreeChild],
          dimValueTreeSingle: [...dimValueTreeSingle],
        })
      })
      this.setState(state => ({
        ...state,
        spinLoading: false,
      }), () => { })
    } catch (err) {
      err.msg && message.error(err.msg);
      this.setState({
        spinLoading: false
      })
    }
  }
  dealWithEnumTreeList = (list, isLeaf, preKey, preString, preVal) => {
    let flattened = list.reduce((pre, cur, index) => {
      cur.forEach((it, idx) => {
        pre.push({
          ...it,
          label: `${it.caption || '空'}`,
          // value: [...preVal, it.caption],
          // key: `${preKey}-${index}`,
          // value: `${preKey}-${index}`,
          key: `${it.caption}--${it.level}`,
          value: `${it.caption}--${it.level}`,
          // key: `${it.caption || '空'}`,
          // value: `${it.caption || '空'}`,
          // label: it.caption,
          // value: it.caption,
          // key: it.caption,
          isLeaf: isLeaf,
          // children: [],
          child: [],
          // checkable: true,
          id: `${preKey}-${index}`,
          pId: `${preKey}`,
          title: it.caption,
          preString: `${preString ? preString + ',' : ''}${it.caption}`,
        })
      })
      return pre;
    }, [])
    console.log('flattened = ', flattened);
    return flattened;
  }
  getParentMembers = (list, posIdx, positionList) => {
    return list.reduce((pre, cur, index) => {
      if (index === +positionList[posIdx]) {
        pre.push(cur.caption);
        posIdx += 1;
        if (positionList.length > posIdx) {
          let child = this.getParentMembers(cur.child, posIdx, positionList);
          if (child && child.length > 0) pre.push(...child)
        }
        return pre;
      }
      return pre;
    }, [])
  }
  onLoadData = (nodeItem) => {
    if (nodeItem.isLeaf || !this.canLoad) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 100)
      })
    }
    const { item } = this.props;
    if (nodeItem.id) {
      // console.log('nodeItem = ' ,nodeItem);
      let positionList = nodeItem.pos.split('-');
      positionList.shift();
      let posLen = positionList.length;
      let curLevel = posLen - 1 >= 0 ? posLen - 1 : 0;
      let nextLevel = curLevel + 1;
      let dimensions = [];
      if (curLevel < 1) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, 100)
        })
      }
      // 要根据pos去查找所有父级别的value
      let posIdx = 0;
      let { dimValueTree } = this.state;
      if (nodeItem.pId !== '0' && curLevel > 0) {
        // posIdx+=1;
        // let members = dimValueTree[0].child.reduce((pre,cur,index) => {
        //   if(index === +positionList[posIdx]) {
        //     pre.push(cur.caption)
        //     posIdx+=1;
        //     if (positionList.length > posIdx) {
        //       let child = this.getParentMembers(cur.child, posIdx, positionList);
        //       if (child && child.length > 0) pre.push(...child)
        //     }
        //     return pre;
        //   }
        //   return pre;
        // }, [])
        posIdx += 1;
        let members = this.getParentMembers(dimValueTree[0].child, posIdx, positionList);
        console.log('members =', members);
        console.log('`${item.dim_cols_alias[nextLevel - 1]} = `', `${item.dim_cols_alias[nextLevel - 1]}`);
        members = members.filter(it => it != '');
        item.dim_cols_alias[nextLevel - 1] && dimensions.push({
          dimension: `${nodeItem.dimension}`,
          dimension_table: `${nodeItem.dimension_table}`,
          levels: [
            {
              level: `${item.dim_cols_alias[nextLevel - 1]}`,
              constraint_members: [members],
            }
          ]
        })
        // } else { // All下面的第一层
        //   if (item.is_drill_down) { // 下钻维度
        //     dimensions.push({
        //       dimension: `${item.alias}-Hierarchy`,
        //       dimension_table: item.dimension_tables_alias,
        //       levels: [
        //         {
        //           level: item.dim_cols_alias[0]
        //         }
        //       ]
        //     })
        //   } else {
        //     dimensions.push({
        //       dimension: item.alias,
        //       dimension_table: item.dimension_tables_alias,
        //       levels: [
        //         {
        //           level: item.alias,
        //         }
        //       ]
        //     })
        //   }
      }
      const data = {
        dataset: this.props.tableName,// 'PMIX_SET_HF',
        rows_axis: {
          dimensions: dimensions,
        }
      }
      console.log('外面的 `${item.dim_cols_alias[nextLevel - 1]} = `', `${item.dim_cols_alias[nextLevel - 1]}`);
      // 'Pmix_MDS'
      return getKylinResultByAnyData(data, this.props.projectId, this.props.businessId).then(res => {
        let isLeaf = item.dim_cols.length > posLen ? false : true;
        let preKey = nodeItem.id; // nodeItem.pos;
        let dimValueTreeChild = this.dealWithEnumTreeList(res.data?.rows_axis?.tuples, isLeaf, preKey, nodeItem.preString, nodeItem.value);
        let { dimValueTree } = this.state;
        let idx_ = 1;
        for (let i = 0; i < dimValueTree[0].child.length; i++) {
          if (i === +positionList[idx_]) {
            if (idx_ === posLen - 1) {
              dimValueTree[0].child[i].child = [...dimValueTreeChild];
              break;
            } else {
              idx_ += 1;
              this.whereAreYou(dimValueTree[0].child[i].child, positionList, posLen, dimValueTreeChild, idx_);
              break;
            }
          }
          continue
        }
        console.log('dimValueTree = ', dimValueTree);

        this.setState(state => ({
          ...state,
          dimValueTree: [...dimValueTree, ...dimValueTreeChild],
        }), () => {
        })

      }).catch(() => {

      })
    } else {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 100)
      })
    }
  }
  onLoadDataSingle = (nodeItem) => {
    /**
     * 单选的情况和多选不一样，单选不存在all的概念
     * 所以点选的level要从0开始
     */
    if (nodeItem.isLeaf || nodeItem.child.length > 0 || !this.canLoad) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 100)
      })
    }
    const { item } = this.props;
    if (nodeItem.id) {
      // let position = '';
      // if (nodeItem.key) {
      //   let keyList = nodeItem.key.split('-');
      //   keyList.shift();
      //   position = keyList.join('-');
      // }
      let positionList = nodeItem.pos.split('-');
      positionList.shift();
      let posLen = positionList.length;
      let curLevel = posLen - 1 >= 0 ? posLen - 1 : 0;
      let nextLevel = curLevel + 1;
      let dimensions = [];

      // 如果是单选的话，不需要all这一层级
      // if (curLevel < 1) {
      //   return new Promise(resolve => {
      //     setTimeout(() => {
      //       resolve();
      //     }, 100)
      //   })
      // }

      // 要根据pos去查找所有父级别的value
      let posIdx = 0;
      let { dimValueTreeSingle } = this.state;
      if (nodeItem.pId !== '0' && curLevel >= 0) {
        // posIdx+=1;
        let members = this.getParentMembers(dimValueTreeSingle, posIdx, positionList);
        console.log('members =', members);
        console.log('`${item.dim_cols_alias[nextLevel]}` = ', `${item.dim_cols_alias[nextLevel]}`);
        members = members.filter(it => it != '');
        item.dim_cols_alias[nextLevel] && dimensions.push({
          dimension: `${nodeItem.dimension}`,
          dimension_table: `${nodeItem.dimension_table}`,
          levels: [
            {
              level: `${item.dim_cols_alias[nextLevel]}`,
              constraint_members: [members],
            }
          ]
        })
      }
      const data = {
        dataset: this.props.tableName,// 'PMIX_SET_HF',
        rows_axis: {
          dimensions: dimensions,
        }
      }
      
      // 'Pmix_MDS'
      return getKylinResultByAnyData(data, this.props.projectId, this.props.businessId).then(res => {
        let isLeaf = item.dim_cols.length > posLen + 1 ? false : true;
        let preKey = nodeItem.id; // nodeItem.pos;
        let dimValueTreeSingleChild = this.dealWithEnumTreeList(res.data?.rows_axis?.tuples, isLeaf, preKey, nodeItem.preString, nodeItem.value);
        let { dimValueTreeSingle } = this.state;
        let idx_ = 0;
        for (let i = 0; i < dimValueTreeSingle.length; i++) {
          if (i === +positionList[idx_]) {
            if (idx_ === posLen - 1) {
              dimValueTreeSingle[i].child = [...dimValueTreeSingleChild];
              break;
            } else {
              idx_ += 1;
              this.whereAreYou(dimValueTreeSingle[i].child, positionList, posLen, dimValueTreeSingleChild, idx_);
              break;
            }
          }
          continue
        }
        console.log('dimValueTreeSingle = ', dimValueTreeSingle);

        this.setState(state => ({
          ...state,
          dimValueTreeSingle: [...dimValueTreeSingle, ...dimValueTreeSingleChild],
        }), () => {
          // this.canLoad = false;
        })

      }).catch(() => {

      })
    } else {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 100)
      })
    }
  }
  onChangeTreeData = (val, label, extra, index, type) => {
    // let newVal = val.slice(-1);
    // if (!val.includes(extra.triggerValue)) {
    //   newVal = [extra.triggerValue];
    // }
    // if (val.length < 1) {
    //   newVal = [];
    // }
    // let formRef = this.formRef.current;
    // let formData = formRef.getFieldsValue();
    // if (type === 'THEN_PRE') {
    //   formData.filter_values[index].value = newVal;
    // } else if (type === 'THEN_NEXT') {
    //   formData.filter_values[index].second_value = newVal;
    // }
    // console.log('newVal = ', newVal);
    // formRef.setFieldsValue(formData);
  }
  whereAreYou = (treeList, posList, posLen, itemList, idx_) => {
    for (let i = 0; i < treeList.length; i++) {
      if (i === +posList[idx_]) {
        if (idx_ === posLen - 1) {
          return treeList[i].child = [...itemList];
        } else {
          idx_ += 1;
          return this.whereAreYou(treeList[i].child, posList, posLen, itemList, idx_);
        }
      }
      continue
    }
  }
  haveAllChildNeedShowParent = (filter_members) => {
    let levelObj = {};
    filter_members.forEach(mem => {
      let level = mem.split('--').pop();
      if (levelObj[level]) {
        levelObj[level] += 1;
      } else {
        levelObj[level] = 1;
      }
    })
    console.log('levelObj = ', levelObj);
    Object.keys(levelObj).forEach(level => {
      let samLevel = this.state.dimValueTree.filter(dim => dim.value.includes(`--${level}`));
      if (samLevel.length === levelObj[level]) {
        let idList = samLevel[0].id.split('-');
        idList.splice(-1);
        let parentId = idList.join('-');
        let itemParent = this.state.dimValueTree.find(it_ => it_.id === parentId);
        if (itemParent) {
          let first_idx = _.findIndex(filter_members, function (value) {
            return value.includes(`--${level}`)
          })
          filter_members.splice(first_idx, 1, itemParent.value);
          _.remove(filter_members, function (value) {
            return value.includes(`--${level}`)
          })
        }
      }
    })
    return filter_members;
  }
  onPressEnter = (e, type, index) => {
    console.log('你按键了！ = ', e);
    if (e.keyCode === 13) {
      this.canLoad = false;
      console.log('这个键是回车键！ = ');
      let filterList = [];
      if (type === 'IN') {
        filterList = this.state.dimValueTree.filter(dim => {
          return dim.label.trim().toUpperCase().includes(this.state.treeSearchValue.trim().toUpperCase())
        }) || [];
        // let filterList = this.state.dimValueTree.filter(dim => {
        //   return dim.label.trim().toUpperCase().includes(this.state.treeSearchValue.trim().toUpperCase())
        // }) || [];
        if (filterList.length > 0) {
          let filter_members = [], filter_members_arr = [], filter_members_name = [];
          filterList.forEach(ele => {
            filter_members.push(ele.value);
            filter_members_arr.push(ele.preString);
            filter_members_name.push(ele.label);
          })
          let formRef = this.formRef.current;
          let formData = formRef.getFieldsValue();
          if (!formData.filter_values[index].filter_members.includes('all--root')) {
            filter_members = _.uniq([...formData.filter_values[index].filter_members, ...filter_members]);
            filter_members = this.haveAllChildNeedShowParent(filter_members);
            filter_members_arr = _.uniq([...formData.filter_values[index].filter_members_arr, ...filter_members_arr])
            filter_members_name = _.uniq([...formData.filter_values[index].filter_members_name, ...filter_members_name])
            console.log('filter_members = ', filter_members);
            // let levelObj = this.haveAllChildNeedShowParent(filter_members);
            // console.log('levelObj = ', levelObj);
            // 对处理后的filter_members还要做整合处理

            // let obj = {
            //   filter_values: [{
            //     filter_members: filter_members,
            //     filter_members_arr: filter_members_arr,
            //     filter_members_name: filter_members_name,
            //     operator: formData.filter_values[0].operator,
            //     level: '',
            //     value: '',
            //     comparator_equals: false,
            //     second_value: '',
            //     second_comparator_equals: false,
            //     second_level: '',
            //   }],
            //   show_name: formData.show_name
            // }

            /**
             * 
            let cObj = {
              filter_members: filter_members,
              filter_members_arr: filter_members_arr,
              filter_members_name: filter_members_name,
              operator: formData.filter_values[index].operator,
            }
            let fObj = formData.filter_values[index];
  
            fObj = Object.assign({}, fObj, cObj);
            
            let obj = {
              filter_values: [fObj],
              show_name: formData.show_name
            }
            obj = Object.assign({}, formData, obj);
            formRef.setFieldsValue(obj);
            */
            formData.filter_values[index].filter_members = filter_members;
            formData.filter_values[index].filter_members_arr = filter_members_arr;
            formData.filter_values[index].filter_members_name = filter_members_name;
            // formRef.resetFields();
            formRef.setFieldsValue(formData);
            // formRef.setFields([{error: null}]);
          }
          // this.setState({
          //   treeSearchValue: '',
          // })
        }
      } else if (type === 'THEN_PRE') {
        filterList = this.state.dimValueTreeSingle.filter(dim => {
          return dim.label.trim().toUpperCase().includes(this.state.treeSearchValue.trim().toUpperCase())
        }) || [];
        if (filterList.length > 0) {
          let filter_members = filterList[0].value;
          let level_ = filterList[0].value.split('--').pop();
          let formRef = this.formRef.current;
          let formData = formRef.getFieldsValue();

          // let cObj = {
          //   operator: formData.filter_values[index].operator,
          //   level: level_,
          //   value: filter_members,
          //   comparator_equals: false,
          // }
          // let fObj = formData.filter_values[index];

          // fObj = Object.assign({}, fObj, cObj);

          // let obj = {
          //   filter_values: [fObj],
          //   show_name: formData.show_name
          // }

          // obj = Object.assign({}, formData, obj);
          // console.log('obj 后 = ', obj);
          // formRef.setFieldsValue(obj);
          formData.filter_values[index].level = level_;
          formData.filter_values[index].value = filter_members;
          // formRef.resetFields();
          formRef.setFieldsValue(formData);
          // this.setState({
          //   treeSearchValue: '',
          // })
        }
      } else if (type === 'THEN_NEXT') {
        filterList = this.state.dimValueTreeSingle.filter(dim => {
          return dim.label.trim().toUpperCase().includes(this.state.treeSearchValue.trim().toUpperCase())
        }) || [];
        if (filterList.length > 0) {
          let filter_members = filterList[0].value;
          let level_ = filterList[0].value.split('--').pop();
          let formRef = this.formRef.current;
          let formData = formRef.getFieldsValue();
          /**
           * 
          let cObj = {
            // filter_members: filter_members,
            // filter_members_arr: filter_members_arr,
            // filter_members_name: filter_members_name,
            operator: formData.filter_values[index].operator,
            // level: level_,
            // value: filter_members,
            // comparator_equals: false,
            second_value: filter_members,
            second_comparator_equals: false,
            second_level: level_,
          }
          let fObj = formData.filter_values[index];

          fObj = Object.assign({}, fObj, cObj);
          
          let obj = {
            // filter_values: [{
            //   filter_members: filter_members,
            //   filter_members_arr: filter_members_arr,
            //   filter_members_name: filter_members_name,
            //   operator: formData.filter_values[0].operator,
            //   // level: level_,
            //   // value: filter_members,
            //   // comparator_equals: false,
            //   second_value: filter_members,
            //   second_comparator_equals: false,
            //   second_level: level_,
            // }],
            filter_values: [fObj],
            show_name: formData.show_name
          }

          obj = Object.assign({}, formData, obj);
          console.log('obj 后 = ', obj);
          formRef.setFieldsValue(obj);
          */
          formData.filter_values[index].level = level_;
          formData.filter_values[index].second_value = filter_members;
          // formRef.resetFields();
          formRef.setFieldsValue(formData);
          // this.setState({
          //   treeSearchValue: '',
          // })
        }
      }
    }
  }
  onPressEnterSearch = (val, index) => {
    this.setState({
      treeSearchValue: val
    })
  }
  textareaChange = (e) => {
    this.setState({
      showCurValue: e.currentTarget.value,
    })
  }
  onShowCurPopconfirm = (index) => {
    let defVal = ''; // this.formRef.current.getFieldsValue().filter_values[index].filter_members.join('\n');
    let defValList = [];
    this.formRef.current.getFieldsValue().filter_values[index].filter_members.forEach(m => {
      defVal += `${m.split('--').shift()}\n`;
      defValList.push(m.split('--').shift());
    })
    console.log('defVal = ', defVal);
    console.log('2 = ', defValList.join('\n'))
    this.setState({
      showCurPop: true,
      showCurValue: defVal,
    })
  }
  popVisibleChange = (visible) => {
    if (visible) {
      this.setState({
        showCurPop: visible,
      })
    } else {
      this.setState({
        showCurPop: visible,
        showCurValue: '',
      })
    }
  }
  calculateShowValue = () => {

  }
  confirmPop = (index) => {
    const { showCurValue } = this.state;
    let valList = showCurValue.split('\n');
    let resList = [];
    valList = _.compact(valList);
    valList.forEach(val => {
      let key = `${val.trim()}--${this.props.item.alias}`;
      let index = _.findIndex(this.state.dimValueTreeSingle, it => it.value === key);
      index > -1 && resList.push(key);
    })

    let formData = this.formRef.current.getFieldsValue();
    formData.filter_values[index].filter_members = [...resList];
    this.formRef.current.setFieldsValue(formData);
  }
  handleSelectFile = (index, flag) => {
    this.fileInput.current.value = null;
    this.fileInput.current.click();
    this.flag = flag;
    this.setState({ uploadIndex: index });
  }
  //上传
  handleFileChange = (ev, index) => {
    const formData = this.formRef.current?.getFieldsValue(); //!!!
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (!fileTypes.includes(file.type)) {
      message.warning('暂不支持解析' + file.type + '类型的文件');
      return false;
    }

    getFileContent(file).then((content) => {
      if (content) {
        let tempItemCodeList = content.replace(/[\r\n]/g, ',').split(',').map(str => {
          return str.trim();
        });
        if (tempItemCodeList.length < 1) {
          message.warning('无匹配结果');
          return false;
        }
        let resList = [];
        _.compact(tempItemCodeList).forEach(val => {
          let key = `${val.trim()}--${this.props.item.alias}`;
          let index = _.findIndex(this.state.dimValueTreeSingle, it => it.value === key);
          index > -1 && resList.push(key);
        })
        formData.filter_values[index].filter_members = [...resList];
        this.formRef.current.resetFields();
        this.formRef.current.setFieldsValue(formData);
      }
    }).catch((error) => {
      message.error(error || '无法读取文件内容');
    });
  }
  renderFormItem = (item) => {
    if (!this.props.visible) return
    let itemElement;
    switch (item.element) {
      case 'selectMulti':
        itemElement = (<Form.List name={item.key}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                return <Row gutter={12} key={field.key}>
                  <Col flex="100px">
                    <Form.Item
                      {...field}
                      name={[field.name, 'operator']}
                      fieldKey={[field.fieldKey, 'operator']}
                      rules={[{ required: true, message: '请选择' }]}
                    >
                      <Select
                        disabled={item.initValue[index].disabled}
                        options={this.state.operates}
                      >
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col flex="1" style={{ width: 'calc(100% - 200px)' }}>
                    {/* {this.props.item.desc?.type === 'text' ? */}
                    {this.state.curPropType === 'text' ?
                      <Form.Item
                        className='special-form-item-style'
                        style={{
                          display: 'inline-block',
                          width: '100%',
                          marginBottom: 0
                        }}
                      >
                        <Form.Item
                          {...field}
                          name={[field.name, 'filter_members']}
                          fieldKey={[field.fieldKey, 'filter_members']}
                          rules={[{ required: true, message: '请输入' }]}
                          style={{
                            display: 'inline-block',
                            width: index < fields.length - 1 ? 'calc(100% - 248px)' : 'calc(100% - 244px)',
                            marginRight: 10,
                            marginBottom: 0
                          }}
                        >
                          {/* className='oap-select-tree-forKylin' */}
                          {/* onSelect={this.handleOnSelectDimTree} */}
                          {/* value={field.name} */}
                          {/* showSearch */}
                          {/* onSearch={this.onSearchTreeData} */}
                          {/* onTreeExpand={this.handleTreeExpand} */}
                          <TreeSelect
                            autoClearSearchValue={false}
                            ref={field.treeRef}
                            allowClear
                            showSearch
                            treeCheckable
                            treeDataSimpleMode
                            treeNodeFilterProp="label"
                            placeholder={'请选择枚举值'}
                            showCheckedStrategy="SHOW_PARENT"
                            value={field.name}
                            // searchValue={this.state.treeSearchValue}
                            // searchValue={field.treeSearchValue}
                            treeData={this.state.dimValueTree}
                            loadData={this.onLoadData}
                            onInputKeyDown={(e) => this.onPressEnter(e, 'IN', index)}
                            onSearch={(val) => this.onPressEnterSearch(val, index)}
                            // onChange={this.handleOnChangeDimTree}
                            onTreeExpand={this.handleTreeExpand}
                          />
                          {/* <Button >批量填写</Button>
                        <Button >上传文件</Button> */}
                        </Form.Item>
                        {/* <Button type="primary" style={{width: 80, marginRight: '10px'}}>批量填写</Button> */}
                        <Popconfirm
                          destroyOnClose
                          title={() => (
                            <div style={{ position: 'relative', left: '-10px' }}>
                              <h5>批量填写，每一行代表一个值</h5>
                              <Input.TextArea rows="6" width={160} value={this.state.showCurValue} onChange={this.textareaChange} />
                            </div>
                          )}
                          icon={<></>}
                          onVisibleChange={this.popVisibleChange}
                          onConfirm={() => this.confirmPop(index)}
                          onCancel={() => this.setState({ showCurPop: false })}
                          okText="确定"
                          cancelText="取消"
                          placement="top"
                        >
                          <Button type="primary" onClick={() => this.onShowCurPopconfirm(index)} style={{ width: 100, marginRight: '10px' }}>批量填写</Button>
                        </Popconfirm>
                        <div style={{ display: 'flex' }}>
                          <Button type="primary" icon={<IconUpload />} onClick={() => this.handleSelectFile(index, item?.flag || '')} style={{ width: 100, marginRight: '10px' }}>上传文件</Button>
                          <input type="file" style={{ display: 'none' }} ref={this.fileInput} onChange={(ev) => this.handleFileChange(ev, index)} />
                          <Tooltip title='支持.csv导入'>
                            <IconInfoCircle className='common-icon-style' />
                          </Tooltip>
                        </div>
                        {/* <Button type="primary" style={{width: 80}}>上传文件</Button> */}

                      </Form.Item> : <Form.Item
                        {...field}
                        name={[field.name, 'filter_members']}
                        fieldKey={[field.fieldKey, 'filter_members']}
                        rules={[{ required: true, message: '请输入' }]}
                      >
                        {/* className='oap-select-tree-forKylin' */}
                        {/* onSelect={this.handleOnSelectDimTree} */}
                        {/* value={field.name} */}
                        {/* showSearch */}
                        {/* onSearch={this.onSearchTreeData} */}
                        {/* onTreeExpand={this.handleTreeExpand} */}
                        <TreeSelect
                          autoClearSearchValue={false}
                          ref={field.treeRef}
                          allowClear
                          showSearch
                          treeCheckable
                          treeDataSimpleMode
                          treeNodeFilterProp="label"
                          placeholder={'请选择枚举值'}
                          showCheckedStrategy="SHOW_PARENT"
                          value={field.name}
                          // searchValue={this.state.treeSearchValue}
                          // searchValue={field.treeSearchValue}
                          treeData={this.state.dimValueTree}
                          loadData={this.onLoadData}
                          onInputKeyDown={(e) => this.onPressEnter(e, 'IN', index)}
                          onSearch={(val) => this.onPressEnterSearch(val, index)}
                          // onChange={this.handleOnChangeDimTree}
                          onTreeExpand={this.handleTreeExpand}
                        />
                      </Form.Item>
                    }
                  </Col>
                </Row>
              })}
            </>
          )}
        </Form.List>)
        break;
      case 'between': itemElement = (<Form.List name={item.key}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => (<Row gutter={12} key={field.key} style={{ position: 'relative' }}>
              {/* {index > 0 ? <span style={{position: 'absolute', top: '7px', left: '-18px'}}>OR</span>:null} */}
              <Col flex="82px" style={{ position: 'absolute', top: '0px', left: '-66px' }}>
                {index != 0 ?
                  <Form.Item
                    {...field}
                    name={[field.name, 'logicalOperator']}
                    fieldKey={[field.fieldKey, 'logicalOperator']}
                    rules={[{ required: true, message: '请选择' }]}>
                    <Select options={this.logicalOptions} disabled={true}></Select>
                  </Form.Item> :
                  <div style={{ padding: '0 0px' }}></div>
                }
              </Col>
              <Col flex="100px">
                <Form.Item
                  {...field}
                  name={[field.name, 'operator']}
                  fieldKey={[field.fieldKey, 'operator']}
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <Select
                    disabled={field.disabled}
                    options={this.state.operates}
                  >
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="1" style={{ width: 'calc(100% - 200px)' }}>
                <Form.Item noStyle>
                  <Form.Item
                    shouldUpdate
                    noStyle
                  >
                    {({ getFieldValue }) => {
                      let operator_val = getFieldValue(item.key)[index]?.operator;
                      let ele = null;
                      switch (operator_val) {
                        // case 'IN': ele = (this.props.item.desc?.type === 'text' ?
                        case 'IN': ele = (this.state.curPropType === 'text' ?
                          <Form.Item style={{
                            display: 'inline-block',
                            width: '100%',
                            marginBottom: 0
                          }}
                          >
                            <div style={{ display: 'flex' }}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'filter_members']}
                                fieldKey={[field.fieldKey, 'filter_members']}
                                rules={[{ required: true, message: '请输入' }]}
                                style={{
                                  display: 'inline-block',
                                  width: index < fields.length - 1 ? 'calc(100% - 248px)' : 'calc(100% - 244px)',
                                  marginRight: 10,
                                  marginBottom: 0
                                }}
                              >
                                {/* className='oap-select-tree-forKylin' */}
                                {/* onSelect={this.handleOnSelectDimTree} */}
                                {/* value={field.name} */}
                                {/* showSearch */}
                                {/* onSearch={this.onSearchTreeData} */}
                                {/* onTreeExpand={this.handleTreeExpand} */}
                                <TreeSelect
                                  autoClearSearchValue={false}
                                  ref={field.treeRef}
                                  allowClear
                                  showSearch
                                  treeCheckable
                                  treeDataSimpleMode
                                  treeNodeFilterProp="label"
                                  placeholder={'请选择枚举值'}
                                  showCheckedStrategy="SHOW_PARENT"
                                  value={field.name}
                                  // searchValue={this.state.treeSearchValue}
                                  // searchValue={field.treeSearchValue}
                                  treeData={this.state.dimValueTree}
                                  loadData={this.onLoadData}
                                  onInputKeyDown={(e) => this.onPressEnter(e, 'IN', index)}
                                  onSearch={(val) => this.onPressEnterSearch(val, index)}
                                  // onChange={this.handleOnChangeDimTree}
                                  onTreeExpand={this.handleTreeExpand}
                                />
                                {/* <Button >批量填写</Button>
                              <Button >上传文件</Button> */}
                              </Form.Item>
                              {/* <Button type="primary" style={{width: 80, marginRight: '10px'}}>批量填写</Button> */}
                              <Popconfirm
                                destroyOnClose
                                title={() => (
                                  <div style={{ position: 'relative', left: '-10px' }}>
                                    <h5>批量填写，每一行代表一个值</h5>
                                    <Input.TextArea rows="6" width={160} value={this.state.showCurValue} onChange={this.textareaChange} />
                                  </div>
                                )}
                                icon={<></>}
                                onVisibleChange={this.popVisibleChange}
                                onConfirm={() => this.confirmPop(index)}
                                onCancel={() => this.setState({ showCurPop: false })}
                                okText="确定"
                                cancelText="取消"
                                placement="top"
                              >
                                <Button type="primary" onClick={() => this.onShowCurPopconfirm(index)} style={{ width: 100, marginRight: '10px' }}>批量填写</Button>
                              </Popconfirm>
                              <div style={{ display: 'flex' }}>
                                <Button type="primary" icon={<IconUpload />} onClick={() => this.handleSelectFile(index, item?.flag || '')} style={{ width: 100, marginRight: '10px' }}>上传文件</Button>
                                <input type="file" style={{ display: 'none' }} ref={this.fileInput} onChange={(ev) => this.handleFileChange(ev, index)} />
                                <Tooltip title='支持.csv导入'>
                                  <IconInfoCircle className='common-icon-style' />
                                </Tooltip>
                              </div>
                              {/* <Button type="primary" style={{width: 80}}>上传文件</Button> */}
                            </div>
                          </Form.Item> : <Form.Item style={{
                            display: 'inline-block',
                            width: '100%',
                            marginBottom: 0
                          }}
                          >
                            <Form.Item
                              {...field}
                              name={[field.name, 'filter_members']}
                              fieldKey={[field.fieldKey, 'filter_members']}
                              rules={[{ required: true, message: '请输入' }]}
                              style={{
                                display: 'inline-block',
                                width: index < fields.length - 1 ? 'calc(100% - 4px)' : '100%',
                                marginRight: 10,
                                marginBottom: 0
                              }}
                            >
                              <TreeSelect
                                autoClearSearchValue={false}
                                ref={field.treeRef}
                                allowClear
                                showSearch
                                treeCheckable
                                treeDataSimpleMode
                                treeNodeFilterProp="label"
                                placeholder={'请选择枚举值'}
                                showCheckedStrategy="SHOW_PARENT"
                                value={field.name}
                                treeData={this.state.dimValueTree}
                                loadData={this.onLoadData}
                                onInputKeyDown={(e) => this.onPressEnter(e, 'IN', index)}
                                onSearch={(val) => this.onPressEnterSearch(val, index)}
                                onTreeExpand={this.handleTreeExpand}
                              />
                            </Form.Item>
                          </Form.Item>
                        ); break;
                        // case 'NOT_IN':ele = (this.props.item.desc?.type === 'text' ?
                        case 'NOT_IN': ele = (this.state.curPropType === 'text' ?
                          <Form.Item style={{
                            display: 'inline-block',
                            width: '100%',
                            marginBottom: 0
                          }}
                          >
                            <div style={{ display: 'flex' }}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'filter_members']}
                                fieldKey={[field.fieldKey, 'filter_members']}
                                rules={[{ required: true, message: '请输入' }]}
                                style={{
                                  display: 'inline-block',
                                  width: index < fields.length - 1 ? 'calc(100% - 248px)' : 'calc(100% - 244px)',
                                  marginRight: 10,
                                  marginBottom: 0
                                }}
                              >
                                {/* className='oap-select-tree-forKylin' */}
                                {/* onSelect={this.handleOnSelectDimTree} */}
                                {/* value={field.name} */}
                                {/* showSearch */}
                                {/* onSearch={this.onSearchTreeData} */}
                                {/* onTreeExpand={this.handleTreeExpand} */}
                                <TreeSelect
                                  autoClearSearchValue={false}
                                  ref={field.treeRef}
                                  allowClear
                                  showSearch
                                  treeCheckable
                                  treeDataSimpleMode
                                  treeNodeFilterProp="label"
                                  placeholder={'请选择枚举值'}
                                  showCheckedStrategy="SHOW_PARENT"
                                  value={field.name}
                                  // searchValue={this.state.treeSearchValue}
                                  // searchValue={field.treeSearchValue}
                                  treeData={this.state.dimValueTree}
                                  loadData={this.onLoadData}
                                  onInputKeyDown={(e) => this.onPressEnter(e, 'IN', index)}
                                  onSearch={(val) => this.onPressEnterSearch(val, index)}
                                  // onChange={this.handleOnChangeDimTree}
                                  onTreeExpand={this.handleTreeExpand}
                                />
                                {/* <Button >批量填写</Button>
                              <Button >上传文件</Button> */}
                              </Form.Item>
                              {/* <Button type="primary" style={{width: 80, marginRight: '10px'}}>批量填写</Button> */}
                              <Popconfirm
                                destroyOnClose
                                title={() => (
                                  <div style={{ position: 'relative', left: '-10px' }}>
                                    <h5>批量填写，每一行代表一个值</h5>
                                    <Input.TextArea rows="6" width={160} value={this.state.showCurValue} onChange={this.textareaChange} />
                                  </div>
                                )}
                                icon={<></>}
                                onVisibleChange={this.popVisibleChange}
                                onConfirm={() => this.confirmPop(index)}
                                onCancel={() => this.setState({ showCurPop: false })}
                                okText="确定"
                                cancelText="取消"
                                placement="top"
                              >
                                <Button type="primary" onClick={() => this.onShowCurPopconfirm(index)} style={{ width: 100, marginRight: '10px' }}>批量填写</Button>
                              </Popconfirm>
                              <div style={{ display: 'flex' }}>
                                <Button type="primary" icon={<IconUpload />} onClick={() => this.handleSelectFile(index, item?.flag || '')} style={{ width: 100, marginRight: '10px' }}>上传文件</Button>
                                <input type="file" style={{ display: 'none' }} ref={this.fileInput} onChange={(ev) => this.handleFileChange(ev, index)} />
                                <Tooltip title='支持.csv导入'>
                                  <IconInfoCircle className='common-icon-style' />
                                </Tooltip>
                              </div>
                              {/* <Button type="primary" style={{width: 80}}>上传文件</Button> */}
                            </div>
                          </Form.Item> : <Form.Item style={{
                            display: 'inline-block',
                            width: '100%',
                            marginBottom: 0
                          }}
                          >
                            <Form.Item
                              {...field}
                              name={[field.name, 'filter_members']}
                              fieldKey={[field.fieldKey, 'filter_members']}
                              rules={[{ required: true, message: '请输入' }]}
                              style={{
                                display: 'inline-block',
                                width: index < fields.length - 1 ? 'calc(100% - 4px)' : '100%',
                                marginRight: 10,
                                marginBottom: 0
                              }}
                            >
                              <TreeSelect
                                autoClearSearchValue={false}
                                ref={field.treeRef}
                                allowClear
                                showSearch
                                treeCheckable
                                treeDataSimpleMode
                                treeNodeFilterProp="label"
                                placeholder={'请选择枚举值'}
                                showCheckedStrategy="SHOW_PARENT"
                                value={field.name}
                                treeData={this.state.dimValueTree}
                                loadData={this.onLoadData}
                                onInputKeyDown={(e) => this.onPressEnter(e, 'IN', index)}
                                onSearch={(val) => this.onPressEnterSearch(val, index)}
                                onTreeExpand={this.handleTreeExpand}
                              />
                            </Form.Item>
                          </Form.Item>
                        ); break;
                        case 'BETWEEN': ele = (
                          // <Form.Item>
                          <Form.Item style={{
                            display: 'inline-block',
                            width: 'calc(50% - 12px)',
                            marginBottom: 0
                          }}
                          >
                            <Form.Item
                              {...field}
                              name={[field.name, 'value']}
                              fieldKey={[field.fieldKey, 'value']}
                              rules={[{ required: true, message: '请输入' }]}

                            >
                              <TreeSelect
                                autoClearSearchValue={false}
                                ref={field.treeRef}
                                allowClear
                                showSearch
                                treeDataSimpleMode
                                treeNodeFilterProp="label"
                                placeholder={'请选择枚举值'}
                                showCheckedStrategy="SHOW_PARENT"
                                // searchValue={this.state.treeSearchValue}
                                treeData={this.state.dimValueTreeSingle}
                                loadData={this.onLoadDataSingle}
                                value={field.name}
                                onInputKeyDown={(e) => this.onPressEnter(e, 'THEN_PRE', index)}
                                onSearch={(val) => this.onPressEnterSearch(val, index)}
                                // onChange={(val,label,extra) => this.onChangeTreeData(val,label,extra,index,'THEN_PRE')}
                                // onTreeExpand={(e) => this.onLoadDataSingle(e)}
                                // treeExpandedKeys={this.state.treeExpandedKeys}
                                onTreeExpand={this.handleTreeExpand}
                              />
                            </Form.Item>
                            {/* <span
                              style={{
                                display: 'inline-block',
                                width: '24px',
                                lineHeight: '32px',
                                textAlign: 'center',
                              }}
                            >
                              -
                            </span>
                            <Form.Item
                              {...field}
                              name={[field.name, 'second_value']}
                              fieldKey={[field.fieldKey, 'second_value']}
                              rules={[{ required: true, message:'请输入'}]}
                              style={{
                                display: 'inline-block',
                                width: 'calc(50% - 12px)',
                              }}
                            >
                              <TreeSelect 
                                ref={this.treeSelectRefSingle2}
                                allowClear
                                showSearch
                                treeDataSimpleMode
                                treeNodeFilterProp="label"
                                placeholder={'请选择枚举值'}
                                showCheckedStrategy="SHOW_PARENT"
                                searchValue={this.state.treeSearchValue}
                                treeData={this.state.dimValueTree}
                                loadData={this.onLoadData}
                                value={field.name}
                                onInputKeyDown={(e) => this.onPressEnter(e)}
                                onSearch={this.onPressEnterSearch}
                              />
                            </Form.Item> */}
                          </Form.Item>
                        ); break;
                        default: ele = (
                          <Form.Item style={{ marginBottom: 0 }}>
                            <Form.Item
                              {...field}
                              name={[field.name, 'value']}
                              fieldKey={[field.fieldKey, 'value']}
                              rules={[{ required: true, message: '请输入' }]}
                              style={{
                                display: 'inline-block',
                                width: 'calc(50% - 12px)',
                                marginBottom: 0
                              }}
                            >
                              <TreeSelect
                                autoClearSearchValue={false}
                                ref={field.treeRef}
                                allowClear
                                showSearch
                                treeDataSimpleMode
                                treeNodeFilterProp="label"
                                placeholder={'请选择枚举值'}
                                showCheckedStrategy="SHOW_PARENT"
                                // searchValue={this.state.treeSearchValue}
                                treeData={this.state.dimValueTreeSingle}
                                loadData={this.onLoadDataSingle}
                                value={field.name}
                                onInputKeyDown={(e) => this.onPressEnter(e, 'THEN_PRE', index)}
                                onSearch={(val) => this.onPressEnterSearch(val, index)}
                                // onChange={(val,label,extra) => this.onChangeTreeData(val,label,extra,index,'THEN_PRE')}
                                // onTreeExpand={(e) => this.onLoadDataSingle(e)}
                                // treeExpandedKeys={this.state.treeExpandedKeys}
                                // filterTreeNode={false}
                                onTreeExpand={this.handleTreeExpand}
                              />
                            </Form.Item>
                          </Form.Item>
                        ); break;
                      }
                      return ele;
                    }}
                  </Form.Item>
                  <Form.Item
                    shouldUpdate
                    noStyle
                  >
                    {({ getFieldValue }) => {
                      let operator_val = getFieldValue(item.key)[index]?.operator;
                      let ele = null;
                      switch (operator_val) {
                        case 'BETWEEN': ele = (
                          <Form.Item
                            style={{
                              display: 'inline-block',
                              width: 'calc(50% + 12px)',
                              marginBottom: 0
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                width: '24px',
                                lineHeight: '32px',
                                textAlign: 'center',
                              }}
                            >
                              -
                            </span>
                            <Form.Item
                              {...field}
                              name={[field.name, 'second_value']}
                              fieldKey={[field.fieldKey, 'second_value']}
                              rules={[{ required: true, message: '请输入' }]}
                              style={{
                                display: 'inline-block',
                                width: 'calc(100% - 24px)',
                              }}
                            >
                              <TreeSelect
                                autoClearSearchValue={false}
                                ref={field.treeRef}
                                allowClear
                                showSearch
                                treeDataSimpleMode
                                treeNodeFilterProp="label"
                                placeholder={'请选择枚举值'}
                                showCheckedStrategy="SHOW_PARENT"
                                // searchValue={this.state.treeSearchValue}
                                treeData={this.state.dimValueTreeSingle}
                                loadData={this.onLoadDataSingle}
                                value={field.name}
                                onInputKeyDown={(e) => this.onPressEnter(e, 'THEN_NEXT', index)}
                                onSearch={(val) => this.onPressEnterSearch(val, index)}
                                // onChange={(val,label,extra) => this.onChangeTreeData(val,label,extra,index,'THEN_NEXT')}
                                // onChange={this.onChangeTreeData}
                                // onTreeExpand={(e) => this.onLoadDataSingle(e)}
                                onTreeExpand={this.handleTreeExpand}
                              />
                            </Form.Item>
                          </Form.Item>
                        ); break;
                        default: ele = null; break;
                      }
                      return ele;
                    }}
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col flex="40px">
                {index == (fields.length - 1) ?
                  // <Button style={{height: 32, position: 'relative', top: 2}} type="primary" shape="circle" icon={<PlusOutlined />} onClick={() =>
                  <IconAddA className="common-icon-style" onClick={() =>
                    add({
                      operator: 'IN',
                      disabled: true,
                      filter_members: ['all--root'],
                      filter_members_arr: [],
                      filter_members_name: [],
                      level: '',
                      value: '', // [],
                      comparator_equals: false,
                      second_value: '', // [],
                      second_comparator_equals: false,
                      second_level: '',
                      treeSearchValue: '',
                      treeRef: React.createRef(),
                      uuid: uuid(),
                      logicalOperator: 'OR',
                      negative: false,
                    })
                  } /> : null}
              </Col>
              <Col flex="40px">
                {/* {fields.length == 1 ? '':<Button style={{height: 32, position: 'relative', top: 2}} type="primary" shape="circle" icon={<DeleteOutlined />} onClick={() => {remove(index)}}/>} */}
                {fields.length == 1 ? '' : <IconClearUp className="common-icon-style" onClick={() => { remove(index) }} />}
              </Col>
            </Row>)
            )}
          </>
        )}
      </Form.List>)
        break;
      default:
        itemElement = <Input disabled={item.disabled} />
        break;
    }
    return itemElement;
  }
  handleOnChangeDimTree = (value, label, extra) => {
    console.log('label =', label);
  }
  handleOnSelectDimTree = (value, node, extra) => {
    // let formRef = this.formRef.current;
    // console.log('form = ', formRef);
    // let temp = this.state.dimValueTree.find(it => it.id === node.id)
    // if (temp) {
    //   console.log('temp = ',temp)
    //   let stringList = node.preString.split(',');
    //   console.log('stringList = ', stringList);
    //   let obj = this.formRef.current.getFieldsValue();
    //   const obj_ = {
    //     filter_values: [{
    //       filter_members_arr: stringList
    //     }]
    //   }
    //   obj.filter_values[0].filter_members_arr = [...stringList];
    //   // obj = Object.assign({}, obj, obj_);
    //   this.formRef.current.setFieldsValue(obj)
    // }
    let formRef = this.formRef.current;
    let formData = formRef.getFieldsValue();
    let stringList = [];
    formData.filter_values[0].filter_members.forEach(value => {
      let temp = this.state.dimValueTree.find(it => it.value === value);
      if (temp) {
        let preString = temp.preString.replace('All,', '');
        stringList.push(preString);
      }
    })
    formData.filter_values[0].filter_members_arr = [...stringList];
    console.log('formData 处理后 = ', formData);
    this.formRef.current.setFieldsValue(formData);
  }
  setFormValueForArr = () => {
    let formRef = this.formRef.current;
    let formData = formRef.getFieldsValue();

    // 默认选择了All，如果是All的话，需要添加所有子集到filter_members里面
    formData.filter_values.forEach((fv) => {
      let stringList = [];
      let nameList = [];
      switch (fv.operator) {
        case 'IN':
          if (fv.filter_members.join('') === 'all--root') {
            // if (this.props.classify === 'kylin_filters') {
            let allSon = this.state.dimValueTree.filter(it => it.pId === '0-0');
            console.log('allSon = ', allSon);
            allSon.forEach(son => {
              let preString = son.preString.replace('All,', '');
              stringList.push(preString)
            })
            nameList = ['All'];
            // }
          } else {
            fv.filter_members.forEach(value => {
              let temp = this.state.dimValueTree.find(it => it.value === value);
              if (temp) {
                let preString = temp.preString.replace('All,', '');
                stringList.push(preString);
                nameList.push(temp.label);
              }
            })
          }
          break;
        case 'NOT_IN':
          if (fv.filter_members.join('') === 'all--root') {
            // if (this.props.classify === 'kylin_filters') {
            let allSon = this.state.dimValueTree.filter(it => it.pId === '0-0');
            console.log('allSon = ', allSon);
            allSon.forEach(son => {
              let preString = son.preString.replace('All,', '');
              stringList.push(preString)
            })
            nameList = ['All'];
            // }
          } else {
            fv.filter_members.forEach(value => {
              let temp = this.state.dimValueTree.find(it => it.value === value);
              if (temp) {
                let preString = temp.preString.replace('All,', '');
                stringList.push(preString);
                nameList.push(temp.label);
              }
            })
          }
          break;
        case 'BETWEEN':
          let bPre = this.state.dimValueTree.find(it => it.value === fv.value);
          let bNext = this.state.dimValueTree.find(it => it.value === fv.second_value);
          if (bPre) {
            let preString = bPre.preString.replace('All,', '');
            stringList.push(preString);
            nameList.push(bPre.label);
          }
          if (bNext) {
            let preString = bNext.preString.replace('All,', '');
            stringList.push(preString);
            nameList.push(bNext.label);
          }
          break;
        default:
          let cVal = this.state.dimValueTree.find(it => it.value === fv.value);
          if (cVal) {
            let preString = cVal.preString.replace('All,', '');
            stringList.push(preString);
            nameList.push(cVal.label);
          }
          break;
      }
      fv.filter_members_arr = [...stringList];
      fv.filter_members_name = [...nameList];
    })
    console.log('formData 处理后 = ', formData);
    this.formRef.current.setFieldsValue(formData);
  }
  onSearchTreeData = (value) => {
    console.log('value = ', value);
  }
  handleTreeExpand = (keys) => {
    console.log('keys = ', keys);
    this.canLoad = true;
  }
  render () {
    const { title, visible, item } = this.props
    const layout = {
      labelCol: { span: item.isCascade ? 2 : 1.5 },
      wrapperCol: { span: item.isCascade ? 10 : 10.5 }
    }
    return <Modal
      destroyOnClose
      className="data-container oap-conditionModal-forKylin"
      width={860}
      title={title}
      visible={visible}
      cancelText="取消"
      okText="确定"
      onCancel={() => this.cancelModal('cancel')}
      onOk={() => this.cancelModal('ok')}
      okButtonProps={{ disabled: this.state.spinLoading }}>
      <Spin spinning={this.state.spinLoading}>
        <div className="common-edit">
          <Form
            {...layout}
            className="edit-form"
            ref={this.formRef}
            initialValues={this.state.form || {}}
            size="middle">
            {this.state.columns.map(column => {
              return <Form.Item
                name={column.key}
                label={`${column.label}:`}
                key={column.key}
                // initialValue={column.initValue}
                rules={column?.rules}>
                {this.renderFormItem(column)}
              </Form.Item>
            })}
          </Form>
        </div>
        {/* <div style={{fontSize: 18, color: 'red'}}>
          {this.state.curPropType}
        </div> */}
      </Spin>
    </Modal>
  }
}