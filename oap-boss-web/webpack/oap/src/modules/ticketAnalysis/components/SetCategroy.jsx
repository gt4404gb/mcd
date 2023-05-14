import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
// import { Button,Modal,Tabs,Card,Form,Select,Input,Space,message,Tooltip,Row,Col,Collapse,Popconfirm } from '@mcd/portal-components';
import { Button, Modal, Tabs, Card, Select, Input, Space, message, Tooltip, Row, Col, Collapse, Popconfirm, Form } from '@aurum/pfe-ui';
// import { Form } from '@mcd/portal-components';
import {
  MinusCircleOutlined,
  PlusCircleOutlined,
  CloudUploadOutlined,
  InfoCircleOutlined,
  CaretRightOutlined,
  RightCircleOutlined,
  DeleteOutlined,
  EditOutlined
} from "@ant-design/icons";
import {
  IconAddB,
  IconReduceCircleB,
  IconUpload,
  IconInfoCircle,
  IconOpenA,
  // IconStowA,
  IconEditA,
  IconClearUp
} from '@aurum/icons';
import '@/style/ticket-analysis.less';
import {
  getFieldInfoByIdForTicket
} from '@/api/oap/ticket_analysis.js';
import { getFileContent, uuid } from '@/utils/store/func';
import { getCustomRulesDetailInfo } from '@/api/oap/custom_rule.js';
// 组件
const Index = forwardRef((props, ref) => {
  //console.log('props 2 = ', props);
  const { productData, categoryData } = props;
  // const popConfirmInput = useRef();
  // const popConfirmBtn = useRef();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesModal, setCategoriesModal] = useState([]);
  const [hasInit, setHasInit] = useState(false);

  useImperativeHandle(ref, () => ({
    categories
  }))
  const dealWithEditData = (data = [], product) => {
    let resultList = [];
    if (product.length > 0) {
      let fieldIdObj = _.groupBy(data, 'fieldId');
      let idList = Object.keys(fieldIdObj);
      let uuidList = [];
      console.log('fieldIdObj = ', fieldIdObj);
      console.log('idList = ', idList);
      for (let id in fieldIdObj) {
        let fkey = idList.findIndex(it => it === id);
        if (fkey > -1) {
          uuidList.push({
            uuid: uuid(),
            id: id,
            fieldKey: fkey,
          });
        }
      }
      data.forEach(ele => {
        let temp = _.find(product, p => p.fieldId === ele.fieldId);
        let temp2 = _.find(uuidList, u => u.id === ele.fieldId);
        if (temp && temp2) {
          let key_ = fieldIdObj[temp.fieldId].findIndex(it => it.name === ele.name);
          resultList.push({
            fieldId: temp.fieldId,
            fieldKey: temp2.fieldKey,
            fieldName: temp.showName,
            fieldType: temp.showDataType,
            isProRule: false,
            key: `${temp2.fieldKey}-${key_}`,
            name: ele.name,
            showName: ele.showName,
            uuid: `${temp2.uuid}-${ele.name}`,
            valueList: ele.valuesList,
            forShowList: ele.forShowList,
            isCustom: ele.isCustomDimension,
            isExpired: false,
          })
        } else {
          // let item = ele.forShowList.find(it => it.value === ele.fieldId);
          let key_ = '-1';
          resultList.push({
            fieldId: ele.fieldId,
            fieldKey: temp2.fieldKey,
            fieldName: ele.showName,
            fieldType: ele.showDataType || 'SelectMulti',
            isProRule: false,
            key: `${temp2.fieldKey}-${key_}`,
            name: ele.name,
            showName: ele.showName,
            uuid: `${temp2.uuid}-${ele.name}`,
            valueList: ele.valuesList,
            forShowList: ele.forShowList,
            isCustom: ele.isCustomDimension,
            isExpired: true,
          })
        }
      })
    }
    // resultList.forEach(ele => {
    //   switch(ele.fieldType) {
    //     case 'Upload':
    //       ele.valuesList.join(',');
    //     break;
    //     default: break;
    //   }
    // })
    return resultList;
  }
  const showModal = async () => {
    console.log('出来了~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    let dataList = JSON.parse(JSON.stringify(categories))
    let list = await dealWithCategoriesDataRecovery([...dataList]);
    setCategoriesModal([...list]);
    setIsModalVisible(true);
  }
  const hideModal = (msg) => {
    setIsModalVisible(false);
  }
  const okModal = (list) => {
    console.log(list);
    let dataList = JSON.parse(JSON.stringify(list));
    // let hasExpired = dataList.findIndex(it => it.isExpired);
    // if (hasExpired > -1) {
    //   return message.warning('存在已失效数据，请清除！')
    // }
    let resList = dealWithCategoriesDataForShow(dataList);
    console.log('resList = ', resList);
    if (resList.length < 1) {
      return
    }
    setCategories([...resList]);
    setIsModalVisible(false);
  }
  const dealWithCategoriesDataRecovery = async (data = []) => {
    let resultList = [];
    if (data.length < 1) {
      return [];
    }
    let fieldIdObj = _.groupBy(data, 'fieldId');
    console.log('fieldIdObj = ', fieldIdObj);
    for (let id in fieldIdObj) {
      // 聚合forShowList
      let forShowList_all = [];
      fieldIdObj[id].forEach(it => {
        if (it.forShowList && it.forShowList.length) {
          forShowList_all.push(...it.forShowList);
        }
      })
      forShowList_all = _.uniqWith(forShowList_all, _.isEqual);
      if (fieldIdObj[id][0].isCustom > 0) {
        let res = await getCustomRulesDetailInfo(id);
        resultList.push({
          key: 0,
          fieldKey: 0,
          isListField: true,
          showName: '',
          showDataType: '',
          fieldId: id,
          fieldName: '',
          valuesList: [],
          valuesNameList: [],
          valueListOptions: res.data.params || [],
          valueListLoading: false,
          uuid: '',
          isCustom: fieldIdObj[id][0].isCustom,
          forShowList: forShowList_all, // [],
        })
      } else {
        let res = await getFieldInfoByIdForTicket(id);
        resultList.push({
          key: 0,
          fieldKey: 0,
          isListField: true,
          showName: '',
          showDataType: '',
          fieldId: id,
          fieldName: '',
          valuesList: [],
          valuesNameList: [],
          valueListOptions: res.data.fieldValues || [],
          valueListLoading: false,
          uuid: '',
          isCustom: fieldIdObj[id][0].isCustom,
          forShowList: forShowList_all, // [],
        })
      }
    }
    data.forEach(ele => {
      resultList.forEach(it => {
        if (ele.fieldId === it.fieldId) {
          it.key = ele.fieldKey;
          it.fieldKey = ele.fieldKey;
          it.showName = ele.fieldName;
          it.showDataType = ele.fieldType;
          it.fieldName = ele.fieldName;
          let _valuesList = ele.valueList.map(val => {
            if (ele.isCustom > 0) {
              let hasIt = it.valueListOptions.findIndex(o => o.groupId === val);
              if (hasIt === -1) {
                let n = ele.forShowList.find(k => k.value === val);
                if (n) {
                  val = `(已失效)${n.label}`;
                }
              }
            } else {
              let hasIt = it.valueListOptions.findIndex(o => o.value === val);
              if (hasIt === -1) {
                let n = ele.forShowList.find(k => k.value === val);
                if (n) {
                  val = `(已失效)${n.label}`;
                }
              }
            }
            return val;
          })
          console.log('_valuesList = ', _valuesList);
          it.valuesList.push(..._valuesList);
          // it.valuesList.push(...ele.valueList);
          // it.valuesNameList.push(ele.name);
          it.uuid = ele.uuid.split(`-${ele.name}`)[0];
          it.isCustom = ele.isCustom;
          // it.forShowList = ele.forShowList;
          if (ele.isExpired) {
            let temp = ele.forShowList.find(it => it.value === ele.fieldId);
            if (temp) {
              it.fieldId = `(已失效)${temp.label}`;
            }
          }
          it.isExpired = ele.isExpired;
        }
      })
    })
    resultList.forEach(ele => {
      switch (ele.showDataType) {
        case 'Upload':
          ele.valuesList = ele.valuesList.join(',');
          break;
        default: break;
      }
    })
    console.log('复原的数据 = ', resultList);
    return resultList;
  }
  const dealWithCategoriesDataForShow = (data = []) => {
    let resultList = [];
    data.forEach(ele => {
      let name_ = '', gItem = {};
      switch (ele.showDataType) {
        case 'Select':
          // value为字符串
          if (typeof ele.valuesList === 'string') {
            if (ele.isCustom > 0) {
              gItem = ele.valueListOptions.find(it => it.groupId === ele.valuesList);
              name_ = gItem.groupName;
            } else {
              name_ = ele.valueList;
            }
            resultList.push({
              fieldId: ele.fieldId,
              fieldName: ele.showName,
              fieldType: ele.showDataType,
              fieldKey: ele.fieldKey,
              uuid: ele.uuid,
              key: ele.key,
              isProRule: false,
              valueList: [ele.valuesList],
              showName: name_, // ele.valuesList,
              name: name_, // ele.valuesList,
              isCustom: ele.isCustom,
              forShowList: ele.forShowList
            })
          }
          break;
        case 'SelectMulti':
          // value为数组
          if (ele.valuesList instanceof Array) {
            ele.valuesList.forEach((value, idx) => {
              if (ele.isCustom > 0) {
                gItem = ele.valueListOptions.find(it => it.groupId === value);
                name_ = gItem.groupName;
              } else {
                // gItem = ele.valueListOptions.find(it => it.value === value);
                // name_ = gItem.name;
                name_ = value;
              }
              let forShowList_self = ele.forShowList.filter(it => {
                if (it.value === ele.fieldId) {
                  return it;
                }
                if (it.value === value) {
                  return it;
                }
              })
              resultList.push({
                fieldId: ele.fieldId,
                fieldName: ele.showName,
                fieldType: ele.showDataType,
                fieldKey: ele.fieldKey,
                uuid: `${ele.uuid}-${value}`,
                key: `${ele.key}-${idx}`,
                isProRule: false,
                valueList: [value],
                showName: name_, // value,
                name: name_,
                isCustom: ele.isCustom,
                forShowList: forShowList_self, // ele.forShowList
              })
            })
          }
          break;
        case 'Upload':
          if (typeof ele.valuesList === 'string') {
            ele.valuesList.split(',').forEach((csv, idx) => {
              let forShowList_self = ele.forShowList.filter(it => {
                if (it.value === ele.fieldId) {
                  return it;
                }
                if (it.value === csv) {
                  return it;
                }
              })
              resultList.push({
                fieldId: ele.fieldId,
                fieldName: ele.showName,
                fieldType: ele.showDataType,
                fieldKey: ele.fieldKey,
                uuid: `${ele.uuid}-${csv}`,
                key: `${ele.key}-${idx}`,
                isProRule: false,
                valueList: [csv],
                showName: csv,
                name: csv,
                isCustom: ele.isCustom,
                forShowList: forShowList_self, // ele.forShowList
              })
            })
          }
          break;
        default: break;
      }
    })
    console.log('resultList = ', resultList);
    return resultList;
  }
  const confirmShowItem = () => { }
  const cancelShowItem = () => { }
  // useEffect(() => {
  //   console.log('props useEffect', props);
  // }, [])
  const handleClick = (val) => {
    console.log('val = ', val);
  }
  const showItemChange = (msg, index) => {
    console.log('msg = ', msg);
    console.log('index = ', index);
    categories.splice(index, 1, msg);
    setCategories([...categories]);
  }
  const showItemDelete = (index) => {
    categories.splice(index, 1);
    setCategories([...categories]);
  }

  if (['edit', 'copy'].includes(props.type) && categoryData.length > 0 && !hasInit) {
    // setCategories([...productData]);
    let categoryDataCopy = JSON.parse(JSON.stringify(categoryData));
    console.log('categoryDataCopy = ', categoryDataCopy);
    console.log('productData = ', productData);
    // categoryDataCopy.forEach(cate => {
    //   // let temp = _.find(productData, it => it.fieldId === cate.fieldId);
    //   // if (temp) {
    //   //   cate.fieldName = temp.showName;
    //   // }
    let list = dealWithEditData(categoryDataCopy, productData);
    console.log('list = ', list);
    setHasInit(true);
    setCategories([...list]);
  }

  return (<div className="category_item_inline">
    <div className="category_item_title">
      <span className="category_item_text">{props.title}</span>
    </div>
    <Button className="small_special_btn" size="small" onClick={() => showModal()}>选择产品</Button>
    <div className="category_item_content">
      <div className={`choose_product_content just_for_${props.isBase ? 'base' : 'attached'}`}>
        {props.isBase ? (categories.length > 0 ? categories.map((cate, index) => (
          <ShowItem key={cate.uuid} data={cate} onChangeName={(msg) => showItemChange(msg, index)} onDeleteName={() => showItemDelete(index)} />
        )) : null) : (categories.length > 0 ? categories.map((cate, index) => (
          <ShowItem key={cate.uuid} data={cate} onChangeName={(msg) => showItemChange(msg, index)} onDeleteName={() => showItemDelete(index)} />
        )) : 'All')}
        {/* <Popconfirm
          title={() => (
            <Input ref={popConfirmInput} width={100}/>
          )}
          onConfirm={confirmShowItem}
          onCancel={cancelShowItem}
          okText="修改"
          cancelText="取消"
          
        >
          <EditOutlined ref={popConfirmBtn} onClick={(val) => handleClick(val)} style={{display: 'none'}} />
        </Popconfirm> */}
      </div>
    </div>
    <ProductModal
      title={props.title}
      isModalVisible={isModalVisible}
      productData={productData}
      formData={categoriesModal}
      onOk={(list) => okModal(list)}
      onCancel={hideModal} />
  </div>)
})
// 选择组件
const SelectItem = forwardRef((props, ref) => {
  const { initValue } = props;
  const _crateRule = (key) => {
    return {
      key: key,
      fieldKey: key,
      isListField: true,
      showName: '',
      showDataType: '',
      fieldId: '',
      fieldName: '',
      valuesList: [],
      valuesNameList: [],
      valueListOptions: [],
      valueListLoading: false,
      forShowList: [],
      uuid: uuid(),
      isCustom: 0,
    }
  }
  useImperativeHandle(ref, () => ({
    onFinishForm,
    resetFormData,
  }))
  const fileInput = useRef();
  const [conditionForm] = Form.useForm();
  // const conditionForm1 = useRef();
  const defaultRule = _crateRule(0);
  const [formData, setFormData] = useState({ ruleListAll: [defaultRule] })
  const [hasInit, setHasInit] = useState(false);
  // const formData = {
  //   ruleListAll: [_crateRule(0)]
  // }

  // useEffect(() => {
  //   if (initValue.length > 0 && !hasInit) {
  //     let initValueCopy = JSON.parse(JSON.stringify(initValue));
  //     setFormData({
  //       ruleListAll: [...initValueCopy]
  //     })
  //     setHasInit(true);
  //   }
  // }, [hasInit])
  useEffect(() => {
    if (props?.initValue.length > 0) {
      console.log('props.initValue = ', props.initValue);
      let newItem = JSON.parse(JSON.stringify(props.initValue));
      let formData_ = { ruleListAll: newItem };
      setFormData(formData_);
      conditionForm.resetFields();
      conditionForm.setFieldsValue(formData_);
    } else {
      const defaultRule = _crateRule(0);
      let formData_ = { ruleListAll: [defaultRule] };
      setFormData(formData_);
      conditionForm.resetFields();
      conditionForm.setFieldsValue(formData_);
    }
  }, [props.initValue])
  const onFinish = (values) => {
    console.log('values = ', values);
  }
  const resetFormData = () => {
    conditionForm.resetFields();
  }
  const onFinishForm = () => {
    return conditionForm.validateFields().then((values) => {
      conditionForm.resetFields();
      let list = [...values.ruleListAll];
      return list
    }).catch((info) => {
      console.log('Validate Failed:', info);
      return []
    });
  }
  const { data } = props;
  // const dataCopy = JSON.parse(JSON.stringify(data))
  // dataCopy.forEach(item => {
  //   item.disabled = true;
  // })
  // console.log('dataCopy = ', dataCopy);
  const [fieldIdChoose, setFieldIdChoose] = useState([]);

  const disabledChoose = (item) => {
    let result = false;
    let list = conditionForm.getFieldValue('ruleListAll');
    let temp = _.find(list, it => it.fieldId === item.id);
    if (temp) {
      result = true;
    }
    return result;
  }
  const handleSelectFile = (index) => {
    fileInput.current.value = null;
    fileInput.current.click(index);
  }
  //上传
  const handleFileChange = (ev, index) => {
    const formData_ = conditionForm.getFieldsValue(); //!!!
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
        // let tempItemCodeList = content.split('\r\n');
        // let tempItemCodeList = content.replace(/[\r\n]/g, ',').replace(/^(\s|,)+|(\s|,)+$/g, '').split(',');
        let regExp = /\r\n|\r|\n/g;
        let newContent = content.replace(regExp, ',');
        let tempItemCodeList = newContent.split(',');
        tempItemCodeList = tempItemCodeList.filter((item) => {
          return !['item_code', 'item code', 'uscode'].includes(item.toLowerCase()) && item !== '';
        });
        if (tempItemCodeList.length > 0) {
          formData_.ruleListAll[index].valuesList = tempItemCodeList.join(',');
          console.log('formData_ = ', formData_);
          conditionForm.setFieldsValue({ ...formData_ }); //!!!改变表单值
        }
      }
    }).catch((error) => {
      message.error(error || '无法读取文件内容');
    });
  }
  const handleFieldshowDataType = async (value, index) => {
    console.log('conditionForm = ', conditionForm);
    // console.log('conditionForm1 = ', conditionForm1.current);
    let ruleListAll = conditionForm.getFieldValue('ruleListAll');
    let tempRuleList = [...ruleListAll];
    let selectId = [];
    tempRuleList.forEach(temp => {
      temp.fieldId && selectId.push(temp.fieldId);
    })
    setFieldIdChoose([...selectId]);
    let field = tempRuleList[index];
    field.valueListLoading = true;
    field.valueList = [];
    field.valuesList = [];
    try {
      console.log('field = ', field);
      let item = _.find(data, it => it.fieldId === value);
      field.showDataType = item.showDataType;
      field.fieldName = item.showName;
      field.showName = item.showName;
      field.fieldId = item.fieldId;
      // 要判断当前选中的产品是否是自定义规则的
      if (item.isCustomDimension > 0) {
        let res = await getCustomRulesDetailInfo(value);
        console.log('res = ', res);
        field.valueListLoading = false;
        field.valueListOptions = res.data?.params || [];
        field.isCustom = 1;
      } else {
        let res = await getFieldInfoByIdForTicket(value);
        console.log('枚举值 = ', res.data.fieldValues);
        field.valueListLoading = false;
        field.valueListOptions = res.data?.fieldValues || [];
      }
    } catch (err) {
      message.error(err || '出错了！');
    } finally {
      field.valueListLoading = false;
      console.log('最后~', tempRuleList)
      console.log('最后~', field)
      conditionForm.resetFields();
      let formData = { ruleListAll: tempRuleList };
      console.log('formData = ', formData);
      conditionForm.setFieldsValue(formData);
    }
  }
  const handleFieldEnum = (value) => {

  }
  const handleChange = (value, options, isCustom, index) => {
    console.log('选择的枚举值 = ', value);
    console.log('options = ', options);
    const formData_ = conditionForm.getFieldsValue();
    // let ruleListAll = conditionForm.getFieldValue('ruleListAll');
    if (isCustom > 0) {
      if (typeof value === 'string') {
        let gItem = options.find(it => it.groupId === value);
        formData_.ruleListAll[index].forShowList = [{
          label: gItem.groupName,
          value: gItem.groupId,
        }]
      }
      if (value instanceof Array) {
        let gList = options.filter(it => value.includes(it.groupId));
        let showList = [];
        gList.forEach(g => {
          showList.push({
            label: g.groupName,
            value: g.groupId
          })
        })
        formData_.ruleListAll[index].forShowList = [...showList];
      }
    } else {
      if (typeof value === 'string') {
        let vItem = options.find(it => it.value === value);
        formData_.ruleListAll[index].forShowList = [{
          label: vItem.name,
          value: vItem.value,
        }]
      }
      if (value instanceof Array) {
        let vList = options.filter(it => value.includes(it.value));
        let showList = [];
        vList.forEach(v => {
          showList.push({
            label: v.name,
            value: v.value
          })
        })
        formData_.ruleListAll[index].forShowList = [...showList];
      }
    }
    formData_.ruleListAll[index].forShowList.push({
      label: formData_.ruleListAll[index].fieldName,
      value: formData_.ruleListAll[index].fieldId,
    })
    conditionForm.setFieldsValue({ ...formData_ });
  }
  const renderFormItem = (item, field, index) => {
    if (item?.fieldId) {
      let itemElement = null;
      // 如果是自定义规则，需展示对应分组枚举选项
      let valueOptions = item.isCustom == 0 ? item.valueListOptions.map(d => <Select.Option key={d.value} value={d.value}>{d.name}</Select.Option>) : item.valueListOptions.map(d => <Select.Option key={d.groupId} value={d.groupId}>{d.groupName}</Select.Option>);
      let rules = [{ required: true, message: '请选择' }]
      switch (item.showDataType) {
        case 'Select':
          rules.push({
            validator: (rule, value, callback) => {
              let isJudge = value.includes('(已失效)');
              if (isJudge) {
                return Promise.reject('请先去除已失效的自定义规则分组');
              } else {
                return Promise.resolve();
              }
            }
          })
          itemElement = <Form.Item
            {...field}
            name={[field.name, 'valuesList']}
            fieldKey={[field.fieldKey, 'valuesList']}
            // rules={[{ required: true, message: '请选择值' }]}
            rules={rules}
          >
            <Select
              allowClear
              onChange={(value) => handleChange(value, item.valueListOptions, item.isCustom, index)}
              key={field.fieldKey}
              style={{ width: 300 }}>
              {valueOptions}
            </Select>
          </Form.Item>
          break;
        case 'SelectMulti':
          rules.push({
            validator: (rule, value, callback) => {
              let isJudge = value.some(it => it.includes('(已失效)'));
              if (isJudge) {
                return Promise.reject('请先去除已失效的自定义规则分组');
              } else {
                return Promise.resolve();
              }
            }
          })
          itemElement = <Form.Item
            {...field}
            name={[field.name, 'valuesList']}
            fieldKey={[field.fieldKey, 'valuesList']}
            // rules={[{ required: true, message:'请选择'}]}
            rules={rules}
          >
            <Select
              mode="multiple"
              allowClear
              onChange={(value) => handleChange(value, item.valueListOptions, item.isCustom, index)}
              key={field.fieldKey}
              style={{ width: 300 }}>
              {valueOptions}
            </Select>
          </Form.Item>
          break;
        case 'Upload':
          itemElement = <Row gutter={12}>
            <Col flex="1">
              <Form.Item
                {...field}
                name={[field.name, 'valuesList']}
                fieldKey={[field.fieldKey, 'valuesList']}
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input style={{ width: 300 }} allowClear />
              </Form.Item>
            </Col>
            <Col>
              {/* <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => handleSelectFile(index,item?.flag || '')}>上传文件</Button> */}
              <Button type="primary" icon={<IconUpload />} onClick={() => handleSelectFile(index, item?.flag || '')}>上传文件</Button>
              <input type="file" style={{ display: 'none' }} ref={fileInput} onChange={(ev) => handleFileChange(ev, index)} />
            </Col>
            <Col>
              <Tooltip title='支持.csv导入'>
                {/* <InfoCircleOutlined style={{fontSize:'14px',lineHeight:'40px'}}/> */}
                <IconInfoCircle />
              </Tooltip>
            </Col>
          </Row>
          break;
        default:
          itemElement = <></>
          break;
      }
      return (itemElement);
    } else {
      return (<></>)
    }
  }
  const removeItem = (add, remove, index, fields) => {
    remove(index);
    if (fields.length <= 1) {
      add(_crateRule(0))
    }
    let ruleListAll = conditionForm.getFieldValue('ruleListAll');
    let tempRuleList = [...ruleListAll];
    let selectId = [];
    tempRuleList.forEach(temp => {
      temp.fieldId && selectId.push(temp.fieldId);
    })
    setFieldIdChoose([...selectId]);
  }
  if (initValue.length > 0 && !hasInit) {
    let initValueCopy = JSON.parse(JSON.stringify(initValue));
    setFormData({
      ruleListAll: [...initValueCopy]
    })
    let fieldIdChoose = [];
    initValueCopy.forEach(val => {
      fieldIdChoose.push(val.fieldId);
    })
    setFieldIdChoose(fieldIdChoose);
    setHasInit(true);
  }
  const options = data && data.map((d) => <Select.Option key={d.fieldId} value={d.fieldId} disabled={fieldIdChoose.includes(d.fieldId) ? true : false}>{d.showName}</Select.Option>);
  let rules = [{ required: true, message: '请选择' }]
  // 自定义规则
  rules.push({
    validator: (rule, value, callback) => {
      let isJudge = value.includes('(已失效)');
      if (isJudge) {
        return Promise.reject('请先去除已失效的自定义规则');
      } else {
        return Promise.resolve();
      }
    }
  })
  return (
    <div className="product_rule_content">
      <Card className="product_rule_group">
        <Form
          form={conditionForm}
          name="ruleForm"
          // onFinish={onFinish}
          autoComplete="off"
          size="middle"
          initialValues={formData}
        >
          <Form.List
            name='ruleListAll'
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            {(fields, { add, remove }) => (<>
              {fields.map((field, index) => (
                <Space
                  key={field.key}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    key={field.fieldKey}
                    {...field.restField}
                    name={[field.name, 'fieldId']}
                    fieldKey={[field.fieldKey, 'fieldId']}
                    rules={rules}
                  >
                    {/* rules={[{
                      required: true,
                      message: '请选择产品'
                    }]}
                  > */}
                    <Select
                      className="choosedMustBeDisabled"
                      key={index}
                      style={{ width: 200 }}
                      onChange={(value) => { handleFieldshowDataType(value, index) }}>
                      {options}
                    </Select>
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate style={{ marginBottom: 0 }}>
                    {
                      ({ getFieldValue }) => {
                        return (renderFormItem(getFieldValue('ruleListAll')[index], field, index));
                      }
                    }
                  </Form.Item>
                  {/* <MinusCircleOutlined onClick={() => remove(index)} /> */}
                  {/* <MinusCircleOutlined onClick={() => removeItem(add, remove, index, fields)} /> */}
                  <IconReduceCircleB onClick={() => removeItem(add, remove, index, fields)} />
                  {/* {index < 1 ? <PlusCircleOutlined onClick={() => add(_crateRule(fields.length))} />: null} */}
                  {index < 1 ? <IconAddB onClick={() => add(_crateRule(fields.length))} /> : null}
                </Space>
              ))}
              {/* <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusCircleOutlined />}>Add Produce</Button>
              </Form.Item> */}
            </>)}
          </Form.List>
          {/* <Form.Item>
            <Button type="primary" htmlType="submit">添加</Button>
          </Form.Item> */}
        </Form>
        {/* <input type="file" style={{display:'none'}} ref={fileInput} onChange={(ev) => handleFileChange(ev)} />  */}
      </Card>
    </div>
  )
})
// 展示组件
function ShowItem (props) {
  console.log('showItem = ', props);
  const popConfirmInput = useRef();
  const myData = JSON.parse(JSON.stringify(props.data));
  const [popVisible, setPopVisible] = useState(false);
  const confirm = (e) => {
    let newShowName = popConfirmInput.current.input.value.trim();
    if (!newShowName) {
      return message.warning('请填写名称')
    } else {
      myData.showName = newShowName;
      props.onChangeName({ ...myData });
      setPopVisible(false);
    }
  }
  const cancel = (e) => {
    setPopVisible(false);
  }
  const visibleChange = (visible) => {
    console.log('visible = ', visible);
    setPopVisible(visible)
  }
  const handleEditShowName = () => {
    console.log('show出来吧！！！！！！！！！！！！！！！！！！1')
    setPopVisible(true);
  }
  const handleDeleteShowName = () => {
    console.log('hide出来吧！！！！！！！！！！！！！！！！！！1')
    props.onDeleteName();
  }
  return (
    <div className="choose_product_content_item">
      {/* <Card>
        展示你选的
      </Card> */}
      {/* <div className="choose_product_item_head"></div>
      <div className="choose_product_item_child"></div> */}
      <Collapse
        key={myData.key}
        bordered={false}
        // expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        // expandIcon={({ isActive }) => <RightCircleOutlined rotate={isActive ? 90 : 0} />}
        // expandIcon={({isActive}) => (isActive ? <MinusCircleOutlined />: <PlusCircleOutlined />)}
        // expandIcon={({ isActive }) => isActive ? <IconStowA />:<IconOpenA />}
        expandIcon={({ isActive }) => <IconOpenA style={{ transform: isActive ? 'rotate(0deg)' : 'rotate(-90deg)' }} />}
        defaultActiveKey={['1']}
        ghost
      >
        <Collapse.Panel header={<div>
          <span className="item_head_name" style={{ marginRight: '10px' }}>{myData.showName}</span>
          <span onClick={(e) => {
            e.stopPropagation();
          }}>
            <Popconfirm
              title={() => (
                <Input ref={popConfirmInput} width={100} defaultValue={myData.showName} />
              )}
              icon={<></>}
              onOpenChange={visibleChange}
              onConfirm={(e) => confirm(e)}
              onCancel={cancel}
              okText="修改"
              cancelText="取消"
              visible={popVisible}
            >
              {/* <EditOutlined onClick={handleEditShowName}/> */}
              <IconEditA onClick={handleEditShowName} />
            </Popconfirm>
            {/* <EditOutlined onClick={handleEditShowName} /> */}
            {/* <DeleteOutlined onClick={handleDeleteShowName} style={{marginLeft: '10px'}}/> */}
            <IconClearUp onClick={handleDeleteShowName} style={{ marginLeft: '10px' }} />
          </span>
        </div>
        } key="1" className="no_padding_panel">
          {
            myData.isProRule ? <></> : <span>{`${myData.fieldName} - ${myData.name}`}</span>
          }
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}
// 选择产品组件
function ProductModal (props) {
  //console.log('props = ', props);
  const { isModalVisible } = props;
  const { formData } = props;

  const myProduct = useRef();
  const showModal = () => {
    // setIsModalVisible(true);
  }
  const handleOk = async () => {
    let obj = await myProduct.current.onFinishForm();
    console.log('obj = ', obj);
    props.onOk(obj);
  }
  const handleCancel = () => {
    myProduct.current.resetFormData();
    props.onCancel(false);
  }
  const { productData } = props || [];
  return (<Modal
    title={`请选择产品-for-${props.title}`}
    visible={isModalVisible}
    onOk={() => handleOk()}
    onCancel={handleCancel}
    width={800}>
    <Tabs
      type="editable-card"
      hideAdd
    >
      <Tabs.TabPane tab="Full Menu" key="full_menu" closable={false}>
        <SelectItem
          data={productData}
          initValue={formData}
          ref={myProduct}
        >
        </SelectItem>
      </Tabs.TabPane>
    </Tabs>
  </Modal>)
}
export default Index;