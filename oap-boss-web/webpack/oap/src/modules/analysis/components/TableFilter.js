import React from 'react';
import { Modal, Row, Col, Button, Input, Select, DatePicker, Spin, Empty, message } from '@aurum/pfe-ui';
import { Form } from 'antd'; //form的tooltip 属性在boss里不生效
import { IconAddA, IconClearUp, IconLoadingFill } from '@aurum/icons';
import moment from 'moment';
import { getTableFilterSelectByCk, getTableFilterSelectByTrino } from '@/api/oap/self_analysis.js';
import { TABLE_TYPE } from '@/constants/index';
import '@/style/condition.less';

export default class TableFilter extends React.Component {
  constructor(props) {
    super(props);
    this.formTableFilterRef = React.createRef()
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
      spinLoading: false,
      initialValues: {},
      columns: [],
      operates: [],
      selectInputVoList: [],
      selectInputLoading: false,
      oapTableFilterInfo: [],
      pageSize: 1000,
      pageNo: 1,
      pageCount: null, //总页数
      uniqueKey: '',
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.visible && !this.props.visible) {
      this.setState({
        selectInputVoList: [],
        pageSize: 1000,
        pageNo: 1,
        pageCount: null
      }, () => {
        this.getCloumns(nextProps)
      })
    }
  }

  getCloumns = async (props) => {
    let oapTableFilterInfoArr = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapTableFilterInfo'))) || [];
    let oapTableFilterInfo = {}, { record } = props, curInfo, filters, uniqueKey = 'id';
    if (oapTableFilterInfoArr.length) {
      oapTableFilterInfo = oapTableFilterInfoArr.find(itm => itm.sliceId == props.sliceId)?.tableFilter || [];
      console.log('getCloumns oapTableFilter', oapTableFilterInfo, props)
      if (oapTableFilterInfo.length) {
        if (props.record.isTag == 1) uniqueKey = 'tagId';
        curInfo = oapTableFilterInfo.find(itm => itm[uniqueKey] == props.record[uniqueKey]);
        filters = oapTableFilterInfo.filter(itm => itm[uniqueKey] != props.record[uniqueKey]);
      }
    }
    console.log('getCloumns', oapTableFilterInfoArr)
    let initValue = curInfo ? curInfo.condition.map(value => {
      let tempComparator = []
      if (['time'].includes(props.filterType)) {
        if (value?.compareOperator.toLowerCase() == 'between') {
          tempComparator = value.comparator.map(comparatorItem => moment(Number(comparatorItem)))
        } else {
          tempComparator = moment(Number(value.comparator[0]))
        }
      } else if (['numerical'].includes(props.filterType)) {
        value.comparatorStart = value.comparator[0];
        if (value.compareOperator.toLowerCase() == 'between') { //between
          value.comparatorEnd = value.comparator[1];
        }
        tempComparator = [...value.comparator]
      } else {
        tempComparator = [...value.comparator]
      }
      return { ...value, comparator: tempComparator }
    }) : [{
      compareOperator: '', //比较操作符
      comparator: ['time'].includes(props.filterType) ? null : [],//比较值
      logicalOperator: 'AND', //逻辑运算符 And / or
    }]
    let columns = [
      {
        label: '字段名',
        key: 'showName',
        initValue: record.showName,
        disabled: true
      },
      {
        label: '条件格式',
        key: 'condition',
        element: 'list',
        initValue,
        logicalOptions: this.logicalOptions
      }
    ], formObj = {}, operates = [];
    //条件符
    switch (props.filterType) {
      case 'text':
        operates = [
          { label: 'in', value: 'in' },
          { label: 'not in', value: 'not in' }
        ];
        this.handleSelectOptions(props, filters)
        break;
      case 'time':
        operates = [
          { label: '<', value: '<' },
          { label: '>', value: '>' },
          { label: '<=', value: '<=' },
          { label: '>=', value: '>=' },
          { label: '!=', value: '!=' },
          { label: 'between', value: 'between' }
        ];
        break;
      case 'numerical':
        operates = [
          { label: '<', value: '<' },
          { label: '>', value: '>' },
          { label: '<=', value: '<=' },
          { label: '>=', value: '>=' },
          { label: '!=', value: '!=' },
          { label: 'between', value: 'between' }
        ];
        break;
    }
    columns.forEach(column => {
      if (!formObj[column.key]) formObj[column.key] = column.initValue || []
    })
    this.setState({
      columns,
      initialValues: formObj,
      operates,
      oapTableFilterInfo,
      uniqueKey
    }, () => {
      this.formTableFilterRef.current?.setFieldsValue(formObj)
    })
  }

  //获取枚举值
  handleSelectOptions = async (props, filters) => {
    this.setState({ selectInputLoading: true });
    try {
      let resData, params = {
        filters,
        queryField: {
          id: props.record?.id,
          likeName: '',
          isTag: props.record.isTag,
          tagId: props.record?.tagId
        },
        sliceId: props.sliceId,
      }
      console.log(2, params, props)
      //return;
      if (props.tableType == TABLE_TYPE.ck) {
        resData = await getTableFilterSelectByCk(params, { size: this.state.pageSize, page: this.state.pageNo - 1 })
      } else if (props.tableType == TABLE_TYPE.trino) {
        resData = await getTableFilterSelectByTrino(params, { size: this.state.pageSize, page: this.state.pageNo - 1 })
      }
      this.setState({
        selectInputVoList: [...this.state.selectInputVoList, ...resData.data?.items || []],
        selectInputLoading: false,
        pageCount: resData.data?.pageCount
      })
    } catch (err) {
      err.msg && message.error(err.msg);
      this.setState({
        selectInputLoading: false
      })
    }
  }

  //判断滑动到底部
  handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    return scrollHeight - scrollTop === clientHeight
  }

  //触发懒加载    
  lazyLoad = (e) => {
    if (this.handleScroll(e)) {
      const filters = this.state.oapTableFilterInfo.filter(itm => itm.id != this.props.record?.id);
      this.setState({
        pageNo: this.state.pageNo + 1
      }, () => {
        if (this.state.pageNo <= this.state.pageCount) {
          this.handleSelectOptions(this.props, filters)
        }
      })
    }
  }

  //处理请求参数
  formatRequestParams = (scope) => {
    let formData = this.formTableFilterRef.current.getFieldsValue();
    let resultArr = formData.condition || [];
    let resultArrFormat = resultArr.map(value => {
      let comparator, comparatorTypeOf = Object.prototype.toString.call(value.comparator);
      switch (this.props.filterType) {
        case 'text':
          comparator = [...value.comparator];
          break;
        case 'time':
          if (value.compareOperator.toLowerCase() == 'between') { //between
            comparator = value.comparator.map(comparatorItem => moment(Number(comparatorItem)).format('x'));
          } else {
            comparator = [moment(Number(value.comparator)).format('x')];
          }
          break;
        case 'numerical':
          if (value.compareOperator.toLowerCase() == 'between') { //between
            comparator = [value.comparatorStart, value.comparatorEnd];
          } else {
            if (comparatorTypeOf === '[object String]') {
              comparator = [value.comparator];
            } else {
              comparator = value.comparator;
            }
          }
          break;
      }
      return { ...value, comparator }
    })
    return {
      ...this.props.record,
      condition: resultArrFormat
    }
  }

  //选择比较符
  handleOperatorChange = (value, index) => {
    let conditionValues = this.formTableFilterRef.current?.getFieldValue('condition');
    let tempConditionValues = [...conditionValues];
    console.log('handleOperatorChange', conditionValues, value, index)
    if (this.props.filterType == 'time') {
      if (conditionValues[index].compareOperator.toLowerCase() == 'between') {
        tempConditionValues[index].comparator = [];
      } else {
        tempConditionValues[index].comparator = null;
      }
      this.formTableFilterRef.current?.setFieldsValue({ condition: tempConditionValues });
    }
  }

  cancelModal = (action) => {
    if (action == 'ok') {
      this.formTableFilterRef.current.validateFields().then(formData => {
        let params = this.formatRequestParams(), dupoOapTableFilterInfo = [];
        if (Object.keys(this.state.oapTableFilterInfo).length) {
          dupoOapTableFilterInfo = this.state.oapTableFilterInfo.filter(itm => itm[this.state.uniqueKey] != this.props.record[this.state.uniqueKey]);
        }
        let oapTableFilterInfoArr = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapTableFilterInfo'))) || [];
        let hasIndex = oapTableFilterInfoArr.findIndex(it => it.sliceId == this.props?.sliceId);
        if (hasIndex != -1) {
          oapTableFilterInfoArr[hasIndex] = { sliceId: this.props?.sliceId, tableFilter: [...dupoOapTableFilterInfo, params] }
        } else {
          oapTableFilterInfoArr.push({ sliceId: this.props?.sliceId, tableFilter: [...dupoOapTableFilterInfo, params] })
        }
        console.log('cancelModal', oapTableFilterInfoArr)
        //return;
        sessionStorage.setItem('oapTableFilterInfo', encodeURIComponent(JSON.stringify(oapTableFilterInfoArr)));
        this.props.changeVisible({ action, taskResultCondition: [...dupoOapTableFilterInfo, params] })
      }).catch(errorInfo => {
        console.log('errorInfo', errorInfo)
      })
    } else {
      this.props.changeVisible({ action })
    }
  }

  renderFormItem = (item) => {
    if (!this.props.visible) return
    let itemElement, that = this;
    switch (item.element) {
      case 'select':
        itemElement = <Select options={item.options}></Select>
        break;
      case 'list':
        itemElement = <Form.List name={item.key}>
          {(fields, { add, remove }) => {
            return <>
              {fields.map((field, index) => {
                return <Row gutter={6} key={field.key}>
                  <Col flex="76px">
                    {index != 0 ? <Form.Item
                      {...field}
                      name={[field.name, 'logicalOperator']}
                      fieldKey={[field.fieldKey, 'logicalOperator']}
                      rules={[{ required: true, message: '请选择' }]}>
                      <Select options={item.logicalOptions}></Select>
                    </Form.Item> : <div style={{ padding: '0 0px' }}></div>}
                  </Col>
                  <Form.Item shouldUpdate noStyle>
                    <Col flex="100px">
                      <Form.Item
                        {...field}
                        name={[field.name, 'compareOperator']}
                        fieldKey={[field.fieldKey, 'compareOperator']}
                        rules={[{ required: true, message: '请选择' }]}>
                        <Select options={this.state.operates} onChange={(value) => this.handleOperatorChange(value, index)}></Select>
                      </Form.Item>
                    </Col>
                  </Form.Item>
                  <Col flex="1">
                    <Form.Item shouldUpdate noStyle>
                      {({ getFieldValue }) => {
                        const filterType = that.props.filterType;
                        let formItemElement;
                        switch (filterType) {
                          case 'text':
                            formItemElement = <Form.Item
                              {...field}
                              name={[field.name, 'comparator']}
                              fieldKey={[field.fieldKey, 'comparator']}
                              rules={[{ required: true, message: '请选择' }]}>
                              <Select
                                mode="multiple"
                                allowClear
                                loading={this.state.selectInputLoading}
                                notFoundContent={this.state.selectInputLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                                options={this.state.selectInputVoList}
                                maxTagTextLength={8}
                                onPopupScroll={this.lazyLoad}//滚动时触发 
                              >
                              </Select>
                            </Form.Item>;
                            break;
                          case 'time':
                            {
                              formItemElement = getFieldValue(item.key)[index]?.compareOperator.toLowerCase() == 'between' ? <Form.Item
                                {...field}
                                name={[field.name, 'comparator']}
                                fieldKey={[field.fieldKey, 'comparator']}
                                rules={[{ required: true, message: '请输入' }]}>
                                <DatePicker.RangePicker showTime allowClear={false} />
                              </Form.Item> : <Form.Item
                                {...field}
                                name={[field.name, 'comparator']}
                                fieldKey={[field.fieldKey, 'comparator']}
                                rules={[{ required: true, message: '请输入' }]}>
                                <DatePicker showTime allowClear={false} />
                              </Form.Item>
                            }
                            break;
                          case 'numerical':
                            {
                              formItemElement = getFieldValue(item.key)[index]?.compareOperator.toLowerCase() == 'between' ? <Col flex="1">
                                <Row>
                                  <Col flex="11">
                                    <Form.Item
                                      {...field}
                                      name={[field.name, 'comparatorStart']}
                                      fieldKey={[field.fieldKey, 'comparatorStart']}
                                      rules={[
                                        {
                                          validator: (rule, value, callback) => {
                                            if ((value ?? '') !== '') {
                                              console.lo
                                              if (/[\d|.]{1,20}/.test(value)) {
                                                callback()
                                              } else {
                                                callback('只能输入数字和小数点')
                                              }
                                            } else {
                                              callback('请输入')
                                            }
                                          }
                                        }
                                      ]}>
                                      <Input allowClear maxLength={20} />
                                    </Form.Item>
                                  </Col>
                                  <Col flex="1">
                                    <span style={{
                                      lineHeight: '40px',
                                      display: 'inline-block',
                                      marginLeft: 6,
                                      marginRight: 6
                                    }}>至</span>
                                  </Col>
                                  <Col flex="11">
                                    <Form.Item
                                      {...field}
                                      name={[field.name, 'comparatorEnd']}
                                      fieldKey={[field.fieldKey, 'comparatorEnd']}
                                      rules={[
                                        {
                                          validator: (rule, value, callback) => {
                                            if ((value ?? '') !== '') {
                                              if (/[\d|.]{1,20}/.test(value)) {
                                                callback()
                                              } else {
                                                callback('只能输入数字和小数点')
                                              }
                                            } else {
                                              callback('请输入')
                                            }
                                          }
                                        }
                                      ]}>
                                      <Input allowClear maxLength={20} />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </Col> : <Col flex="1">
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'comparator']}
                                  fieldKey={[field.fieldKey, 'comparator']}
                                  rules={[
                                    {
                                      validator: (rule, value, callback) => {
                                        if ((value ?? '') !== '') {
                                          if (/[\d|.]{1,20}/.test(value)) {
                                            callback()
                                          } else {
                                            callback('只能输入数字和小数点')
                                          }
                                        } else {
                                          callback('请输入')
                                        }
                                      }
                                    }
                                  ]}>
                                  <Input allowClear maxLength={20} />
                                </Form.Item>
                              </Col>
                            }
                            break;
                        }
                        return formItemElement;
                      }
                      }
                    </Form.Item>
                  </Col>
                  {that.props.filterType == 'text' ? null : <>
                    <Col flex="30px">
                      {index == (fields.length - 1) ?
                        <IconAddA className="common-icon-style" onClick={() =>
                          add({
                            'logicalOperator': 'AND',
                            'compareOperator': '',
                            'comparator': ['time'].includes(that.props.filterType) ? null : [],
                          })
                        } /> : ''}
                    </Col>
                    <Col flex="30px">
                      {fields.length == 1 ? '' : <IconClearUp className="common-icon-style" onClick={() => { remove(index) }} />}
                    </Col>
                  </>}
                </Row>
              })}
            </>
          }}
        </Form.List>
        break;
      default:
        itemElement = <Input disabled={item.disabled} />
    }
    return itemElement;
  }

  render () {
    return <Modal
      className="oap-conditionModal"
      width={720}
      title="设置条件"
      visible={this.props.visible}
      onCancel={() => this.cancelModal('cancel')}
      footer={[
        <div key="center">
          <Button key="cancel" onClick={() => this.cancelModal('cancel')}>取消</Button>
          <Button key="ok" type="primary" disabled={this.state.spinLoading} onClick={() => this.cancelModal('ok')}>确定</Button>
        </div>
      ]}
      bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 20px 0' }}>
      <Spin spinning={this.state.spinLoading}>
        <div className="common-edit">
          <Form
            labelCol={{ flex: '72px' }}
            layout="horizontal"
            className="edit-form"
            ref={this.formTableFilterRef}
            initialValues={this.state.initialValues}
            size="middle">
            {this.state.columns.map(column => {
              return <Form.Item
                name={column.key}
                label={`${column.label}`}
                tooltip={column?.tooltip}
                key={column.key}
                rules={column?.rules}>
                {this.renderFormItem(column)}
              </Form.Item>
            })}
          </Form>
        </div>
      </Spin>
    </Modal>
  }
}