import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Spin, Button, Form, Table, Modal, message, Select, Row, Col, Space, Empty, Alert, Input, Radio } from '@aurum/pfe-ui';
import { IconLoadingFill } from '@aurum/icons';
import { McdWorkflow } from '@mcdboss/business-components';
import querystring from "query-string";
import { APPLY_TYPE, APPLY_MAINDATA, READ_WRITE_PERMISSION, APPLY_STATUS, APPLICANT_TYPE, APPLY_STATUS_LIST } from '@/constants';
import { getWorkflowId, getApplyOwner } from '@/api/oap/apply_form';
import { queryUserInfo } from '@/api/oap/commonApi';
import {
  getDatabaseOptions,
  getDatasheetOptions,
  saveDatabaseApplyInfos,
  updateDatabaseApplyInfos,
  getDatabaseApplyDetails,
  changeDatabaseApplyStatus,
} from '@/api/oap/database';
import { optionFilterProp } from "@/utils/store/func";
import { OAP_VERSION } from '@/constants';

const applyForm = forwardRef((props, ref) => {
  const ApplyFormDomRef = useRef();
  const [locationSearch, setLocationSearch] = useState(() => {
    return querystring.parse(props.location.search);
  })
  const [isLoading, setLoading] = useState(false);
  const [editAbleArr, setEditAble] = useState([APPLY_STATUS.stateless, APPLY_STATUS.back, APPLY_STATUS.withdrawn]);
  const [fieldInfo, setFieldInfo] = useState({});
  const [workflowId, setWorkflowId] = useState();// 工作流类型id
  const [requestId, setRequestId] = useState();
  const [disabled, setDisabled] = useState(true);
  const [visible, setVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState(<>
    <div>code:</div>
    <div>errMsg:</div>
  </>)
  const [emptyTips, setEmptyTips] = useState();
  const [buttonDisabled, setButtonDisabled] = useState(false);
  let config = {
    title: '申请数仓权限',
    eid: '', // 当前用户的eid
    systemName: 'NoB',
    buttonText: {
      'submit': !disabled ? '提交申请' : '同意',
    },
  }, userInfoLocal = {};
  const userInfo = localStorage.getItem('USER_INFO');
  if (userInfo) {
    config = { ...config, eid: JSON.parse(userInfo)?.employeeNumber }
    userInfoLocal = JSON.parse(userInfo);
  }

  useEffect(() => {
    _initAsync();
  }, [])

  const _initAsync = async () => {
    setLoading(true);
    try {
      let promiseAllRequest = [getWorkflowId(APPLY_TYPE['database'])];
      if (locationSearch.id) {
        promiseAllRequest.push(getDatabaseApplyDetails({ id: locationSearch?.id }))
      }
      const res = await Promise.all(promiseAllRequest);
      if (res[1] && res[1].data) {
        let applyInfoTable = res[1].data.applyInfoTable;
        applyInfoTable.databases.forEach(itt => {
          itt.value = itt.id;
          itt.label = itt.name;
        })
        applyInfoTable.tables = applyInfoTable.tables ? applyInfoTable.tables.map(it => {
          return { ...it, value: it.id, label: it.name }
        }) : []
        setFieldInfo({
          ...res[1].data,
          applyInfoTable
        })
        setLocationSearch({
          ...locationSearch,
          ...{ isOthers: res[1].data.applyEmployeeType == APPLICANT_TYPE.others }
        })
        if ((res[1].data.requestId ?? '') !== '') {
          setRequestId(() => (res[1].data.requestId))
          handleDiabled(res[1].data?.applyStatus, '' + res[1].data?.applyEmployeeNumber);
        } else {
          //setButtonDisabled(true)
          setDisabled(false)
        }
      }
      if (promiseAllRequest.length == 1) {
        const applyInfoTable = { type: 'DATABASE', operation: 'select', databases: [], tables: [] }; //初始值
        setFieldInfo({
          ...fieldInfo,
          applyAdid: userInfoLocal.adid,
          applyEmployeeNumber: userInfoLocal.employeeNumber,
          applyType: APPLY_TYPE['database'],
          applyEmployeeType: locationSearch?.isOthers ? APPLICANT_TYPE.others : APPLICANT_TYPE.self, //1：本人申请，2：为供应商申请
          authAccounts: locationSearch?.isOthers ? [] : [{
            employeeNumber: userInfoLocal.employeeNumber,
            adid: userInfoLocal?.adid || '',
            eid: userInfoLocal?.eid || '',
            chineseName: userInfoLocal?.chineseName || '',
            email: userInfoLocal?.email || ''
          }],
          applyInfoTable
        })
        setDisabled(false)
      }
      if (res[0].data) {
        setWorkflowId(res[0].data?.value)
      }
      setLoading(false)
    } catch (errInfo) {
      setEmptyTips(errInfo && errInfo.msg)
      setLoading(false)
    }
  }

  const onAction = async ({ type, next, update }) => {
    const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
    let dataNext = {};
    console.log('type:', type, formData)
    switch (type) {
      // 保存
      case 'submit':
        //如果是流程发起人
        if (!disabled) {
          ApplyFormDomRef.current.getForm()?.validateFields().then(async (values) => {
            try {
              const commitParams = {
                applyEmployeeType: formData.applyEmployeeType,
                authAccounts: [
                  {
                    employeeNumber: ApplyFormDomRef.current.getSupplier()[0]?.employeeNumber,
                    adid: ApplyFormDomRef.current.getSupplier()[0]?.adid || '',
                    eid: ApplyFormDomRef.current.getSupplier()[0]?.eid || '',
                    chineseName: ApplyFormDomRef.current.getSupplier()[0]?.chineseName || '',
                    email: ApplyFormDomRef.current.getSupplier()[0]?.email || ''
                  }
                ],
                applyType: formData.applyType,//申请类型
                applyInfoTable: values.applyInfoTable,
                applyReason: values.applyReason,
              }
              dataNext = formatMainData();
              let resApplyId;
              if (!formData.id) {
                setLoading(true)
                resApplyId = await saveDatabaseApplyInfos(commitParams);//保存申请信息
                if (resApplyId.data) {
                  setFieldInfo(() => ({ ...fieldInfo, id: resApplyId.data }));
                  ApplyFormDomRef.current.getForm().setFieldsValue({ id: resApplyId.data });
                  dataNext = {
                    ...dataNext,
                    url: {
                      mobile: `https://${window.location.host}/data-h5/#/database?id=${resApplyId.data}&${OAP_VERSION}`,
                      pc: window.location.origin + `/oap/database/apply-form?id=${resApplyId.data}&${OAP_VERSION}`, // 填入真实流程地址
                    }
                  }
                  dataNext.mainData.forEach(mainItem => {
                    if (mainItem.fieldName == 'applyId') {
                      mainItem.fieldValue = '' + resApplyId.data
                    }
                  })
                }
              }
              await _getApplyOwner(dataNext);  //获取审批人
              //return;
              setLoading(true)
              next(dataNext).then(resNxt => {
                if (resNxt.success) {
                  //主键id 即流程编号存在时，需要更新form数据
                  if (formData.id) {
                    updateApply({ ...commitParams, id: formData.id }, () => {
                      new Promise(async (resolve) => {
                        await update();
                        resolve()
                      }).then(() => {
                        setDisabled(true)
                        setLoading(false)
                        if (!requestId) goBack();
                      })
                    });
                  } else {
                    message.success("提交申请成功");
                    goBack()
                  }
                } else {
                  setAlertMsg(<>
                    <div>code: {resNxt?.originalRes.code}</div>
                    <div>msgType: {resNxt?.originalRes.reqFailMsg.msgType}</div>
                  </>)
                  setVisible(true)
                  setLoading(false)
                }
              }).catch(err => {
                message.error(err?.msg || '流程中心接口错误');
                setLoading(false);
              })
            } catch (errInfo) {
              errInfo.msg && message.error(errInfo.msg);
              setLoading(false)
            }
          }).catch(err => {
            console.log('表单校验失败')
          })
        } else {
          dataNext = formatMainData();
          await _getApplyOwner(dataNext);
          setLoading(true);
          next(dataNext).then(res => {
            if (res.success) {
              new Promise(async (resolve) => {
                await update();
                resolve()
              }).then(() => {
                setLoading(false);
              })
            } else {
              setAlertMsg(<>
                <div>code: {res?.originalRes.code}</div>
                <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
              </>)
              setVisible(true)
              setLoading(false)
            }
          }).catch(err => {
            message.error(err?.msg || '流程中心接口错误');
            setLoading(false);
          })
        }
        break;
      // 退回
      case 'back':
        dataNext = formatMainData();
        setLoading(true)
        next(dataNext).then((res) => {
          if (res.success) {
            reEditStatus(formData.id, APPLY_STATUS.back, update);
          } else {
            setAlertMsg(<>
              <div>code: {res?.originalRes.code}</div>
              <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
            </>)
            setVisible(true)
            setLoading(false)
          }
        }).catch(err => {
          message.error(err || err?.msg || '流程中心接口错误');
          setLoading(false)
        })
        break;
      //撤回
      case 'withdraw':
        dataNext = formatMainData();
        Modal.confirm({
          title: "撤回流程",
          content: (<>是否撤回流程？<br />撤回后可重新发起</>),
          cancelText: "取消",
          okText: "撤回",
          onOk: () => {
            setLoading(true)
            next(dataNext).then((res) => {
              if (res.success) {
                reEditStatus(formData.id, APPLY_STATUS.withdrawn, update);
              } else {
                setAlertMsg(<>
                  <div>code: {res?.originalRes.code}</div>
                  <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
                </>)
                setVisible(true)
                setLoading(false)
              }
            }).catch(err => {
              message.error(err || err?.msg || '流程中心接口错误');
              setLoading(false)
            })
          },
          onCancel: () => {
            setLoading(false)
          }
        })
        break;
    }
  }

  const formatMainData = () => {
    const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
    let data = {
      url: {
        mobile: `https://${window.location.host}/data-h5/#/database?id=${formData?.id}&${OAP_VERSION}`,
        pc: window.location.origin + `/oap/database/apply-form?id=${formData?.id}&${OAP_VERSION}`, // 填入真实流程地址
      },
      mainData: APPLY_MAINDATA['database'].map(itm => {
        let transformValue = '';
        if (itm.needTransform) {
          if (itm.fieldName == 'authAdid') {
            if (locationSearch?.isOthers) {
              transformValue = formData[itm.fieldValue].map(valueItm => valueItm[itm.labelKey]).join(',')
            } else {
              transformValue = '';
            }
          } else {
            transformValue = formData.applyInfoTable[itm.fieldValue].map(valueItm => valueItm[itm.labelKey]).join(',')
          }
        }
        return {
          "fieldName": itm.fieldName,
          "fieldValue": itm.needTransform ? transformValue : (itm.needFilterProp ? optionFilterProp(itm.list, itm.labelKey, formData.applyInfoTable[itm.fieldValue])?.label : formData[itm.fieldValue])
        }
      })
    }
    return data;
  }

  //获取审批人
  const _getApplyOwner = async (dataNext) => {
    try {
      const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
      let applyInfo = [];
      if (formData.applyInfoTable.type == 'TABLE') {
        applyInfo = formData.applyInfoTable['tables'].map(it => {
          return { id: it.value, type: APPLY_TYPE.database }
        })
      } else if (formData.applyInfoTable.type == 'DATABASE') {
        applyInfo = formData.applyInfoTable['databases'].map(it => {
          return { id: it.value, type: APPLY_TYPE.database }
        })
      }
      const resApplyOwner = await getApplyOwner({
        applyInfo,
        applyType: APPLY_TYPE.database
      })
      if (resApplyOwner.data) dataNext.mainData.push({ fieldName: 'ownerEmplNumber', fieldValue: resApplyOwner.data })
    } catch (err) {
      console.log('err = ', err);
      message.warning(err.msg || '流程失败！');
      setLoading(false);
    }
  }

  const updateApply = (params, callBack) => {
    updateDatabaseApplyInfos(params).then(res => {
      if (res.msg == 'success') {
        message.success('申请成功');
        callBack && callBack();
      }
    }).catch(err => {
      err.msg && message.error(err.msg);
    })
  }

  const handleDiabled = (applyStatus, applyEmployeeNumber) => {
    if (editAbleArr.includes(Number(applyStatus)) && isOriginator(applyEmployeeNumber)) {
      setDisabled(false)
    }
  }

  //判断是否是流程发起人
  const isOriginator = (applyEmployeeNumber) => {
    let result = true;
    if (applyEmployeeNumber !== userInfoLocal?.employeeNumber) {
      result = false;
    }
    return result;
  }

  const reEditStatus = async (id, backStatus, callback) => {
    setLoading(true);
    const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
    try {
      const res = await changeDatabaseApplyStatus({ id, applyStatus: backStatus });
      if (res.msg == 'success') {
        message.success(optionFilterProp(APPLY_STATUS_LIST, 'value', backStatus)?.label + '成功');
        new Promise(async (resolve) => {
          await callback && callback();
          resolve()
        }).then(() => {
          handleDiabled(backStatus, '' + formData.applyEmployeeNumber);
          setLoading(false)
        })
      }
    } catch (errInfo) {
      setAlertMsg(<>
        <div>接口:/apply/hive/change</div>
        <div>code: {errInfo.code}</div>
        <div>msgType: {errInfo.msg}</div>
      </>)
      setVisible(true)
      setLoading(false)
    }
  }

  const goBack = () => {
    console.log('history = ', history);
    props.history.go(-1)
  }

  const renderWorkflow = () => {
    if ((workflowId ?? '') === '') {
      return <Empty ><div>{emptyTips}</div></Empty>
    } else if (!requestId) {
      return <McdWorkflow
        workflowId={workflowId}
        {...config}
        onAction={onAction}
        buttonVisible={{ 'save': false, 'back': false, 'withdraw': false }}
        buttonDisabled={buttonDisabled}
        footerRightSlot={<Button onClick={goBack}>返回</Button>}
        className="oap-McdWorkflow">
        <ApplyFormDom
          ref={ApplyFormDomRef}
          setLoading={setLoading}
          locationSearch={locationSearch}
          fieldInfo={fieldInfo}
          disabled={disabled} />
      </McdWorkflow>
    } else {
      return <McdWorkflow
        workflowId={workflowId}
        {...config}
        requestId={requestId}
        onAction={onAction}
        buttonVisible={{ 'save': false }}
        footerRightSlot={<Button onClick={goBack}>返回</Button>}
        className="oap-McdWorkflow">
        <ApplyFormDom
          ref={ApplyFormDomRef}
          setLoading={setLoading}
          locationSearch={locationSearch}
          fieldInfo={fieldInfo}
          disabled={disabled} />
      </McdWorkflow>
    }
  }

  return <Spin spinning={isLoading}>
    {buttonDisabled && !requestId ? <Alert message="流程异常，请联系OAP管理员" type="error" /> : null}
    {visible ? (
      <Alert message="数仓目录审批流程" description={alertMsg} type="error" closable />
    ) : null}
    {renderWorkflow()}
  </Spin>
})

const ApplyFormDom = forwardRef((props, ref) => {
  const { locationSearch, setLoading, fieldInfo, disabled } = props;
  const [formApply] = Form.useForm();
  const formApplyRef = useRef();
  const [columns, setColumns] = useState([
    { title: "账号", dataIndex: 'adid' },
    { title: "eid", dataIndex: 'eid' },
    { title: "姓名", dataIndex: 'chineseName' },
    { title: "邮箱", dataIndex: 'email' },
  ]);
  const [supplierDataList, setSupplierDataList] = useState(fieldInfo.authAccounts || []);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRow, setSelectedRow] = useState(fieldInfo.authAccounts || []);
  const [showDatasheet, setShowDatasheet] = useState(!!fieldInfo.applyInfoTable.tables.length);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [databaseList, setDatabaseList] = useState([]);
  const [isLoadingDatasheet, setIsLoadingDatasheet] = useState(false);
  const [datasheetList, setDatasheetList] = useState([]);

  // 暴露组件的方法
  useImperativeHandle(ref, () => ({
    getForm: () => {
      return formApply
    },
    getSupplier: () => {
      return selectedRow
    }
  }))

  useEffect(() => {
    if (fieldInfo.authAccounts && fieldInfo.authAccounts[0]) {
      setSelectedRowKeys([fieldInfo.authAccounts[0].employeeNumber])
    }
  }, [])

  //查询供应商
  const handleSupplier = async () => {
    const formSupplier = formApplyRef.current.getFieldValue('supplier') || {};
    const formData = formApplyRef.current.getFieldsValue(true);
    if (!Object.keys(formSupplier).length) {
      message.warning('请输入要查询的供应商信息')
      return;
    }
    setLoading(true)
    setSupplierDataList([])
    setSelectedRowKeys([])
    setSelectedRow([])
    formApplyRef.current.setFieldsValue({
      applyInfoTable: { ...formData.applyInfoTable, tables: [], databases: [] }
    })
    try {
      const res = await queryUserInfo({ ...formSupplier, userType: 2 });
      if (res.data.length) {
        setSupplierDataList([...res.data])
      }
      //  else {
      //   message.warning('无法查询到匹配的供应商信息')
      // }
      setLoading(false)
    } catch (errInfo) {
      errInfo.msg && message.error(errInfo.msg);
      setLoading(false)
    }
  }

  const resetSearch = () => {
    formApplyRef.current.setFieldsValue({ 'supplier': undefined })
  }

  //选中供应商
  const onSelectChange = (selectedRowKeys, selectedRow) => {
    setSelectedRowKeys(selectedRowKeys);
    setSelectedRow(selectedRow);
    let formData = formApplyRef.current.getFieldsValue(true), applyInfoTable = { ...formData.applyInfoTable };
    if (!selectedRowKeys.length) {
      applyInfoTable = { ...applyInfoTable, tables: [], databases: [] }
    }
    formApplyRef.current.setFieldsValue({
      authAccounts: [...selectedRow],
      applyInfoTable
    })
  }

  //选择申请对象
  const handleApplyType = (event) => {
    if (event.target.value == 'TABLE') {
      setShowDatasheet(true)
    } else {
      setShowDatasheet(false)
    }
  }

  //选择申请权限类型
  const handleApplyOperation = (event) => {
    const formData = formApplyRef.current.getFieldsValue(true);
    const applyInfoTable = { ...formData.applyInfoTable, tables: [], databases: [] }
    formApplyRef.current.setFieldsValue({ applyInfoTable })
  }

  //库下拉列表
  const initDatabasesList = async (open) => {
    if (open) {
      if (locationSearch.isOthers && !selectedRow.length) {
        message.warning('请先选择供应商账号')
        return;
      }
      setIsLoadingDatabases(true)
      setDatabaseList([])
      try {
        const formData = formApplyRef.current?.getFieldsValue(true);
        let params = {
          employeeNumber: locationSearch?.isOthers ? selectedRow[0].employeeNumber : formData.applyEmployeeNumber,
          adId: locationSearch?.isOthers ? selectedRow[0].adid : formData.applyAdid,
          operation: formData.applyInfoTable.operation
        }
        let res = await getDatabaseOptions(params)
        //列表数据回填
        setDatabaseList(() => {
          const mapRes = new Map();
          let applyInfoTable = [];
          const resData = res.data.map(itm => {
            return { ...itm, value: itm.id, label: itm.databaseName, name: itm.databaseName, comment: itm.databaseComment }
          })
          console.log(1212, formData)
          if (formData.applyInfoTable?.databases && formData.applyInfoTable?.databases.length) {
            applyInfoTable = formData.applyInfoTable.databases.map(itm => {
              return { ...itm, databaseComment: itm.comment, databaseName: itm.name }
            })
          }
          return [...resData, ...applyInfoTable].filter(itm => {
            return !mapRes.has(itm['id']) && mapRes.set(itm['id'], 1)
          })
        })
        setIsLoadingDatabases(false)
      } catch (errInfo) {
        setIsLoadingDatabases(false)
      }
    }
  }

  //选中库
  const handleChangeDatabase = (value, option) => {
    const databases = option.map(item => ({ id: item?.id, name: item?.databaseName, comment: item?.databaseComment, value: item?.id, label: item?.databaseName }))
    const formData = formApplyRef.current.getFieldsValue(true);
    const applyInfoTable = { ...formData.applyInfoTable, tables: [], databases }
    formApplyRef.current.setFieldsValue({ applyInfoTable })
  }

  //表下拉列表
  const initDatasheetList = async (open) => {
    if (open) {
      const formData = formApplyRef.current.getFieldsValue(true);
      if (locationSearch.isOthers && !selectedRow.length) {
        message.warning('请先选择供应商账号')
        return;
      }
      if (!formData.applyInfoTable.databases.length) {
        message.warning('请先选择数据库')
        return;
      }
      setIsLoadingDatasheet(true)
      setDatasheetList([])
      try {
        let params = {
          employeeNumber: locationSearch?.isOthers ? selectedRow[0].employeeNumber : formData.applyEmployeeNumber,
          adId: locationSearch?.isOthers ? selectedRow[0].adid : formData.applyAdid,
          operation: formData.applyInfoTable.operation,
          databaseNames: formData.applyInfoTable.databases.map(item => item.name)
        }
        let res = await getDatasheetOptions(params)
        //列表数据回填
        setDatasheetList(() => {
          const mapRes = new Map();
          let applyInfoTable = [];
          const resData = res.data.map(itm => {
            return { ...itm, value: itm.id, label: itm.tableName, name: itm.tableName, comment: itm.tableComment }
          })
          if (formData.applyInfoTable?.tables && formData.applyInfoTable?.tables.length) {
            applyInfoTable = formData.applyInfoTable.tables.map(itm => {
              return { ...itm, tableComment: itm.comment, tableName: itm.name }
            })
          }
          return [...resData, ...applyInfoTable].filter(itm => {
            return !mapRes.has(itm['id']) && mapRes.set(itm['id'], 1)
          })
        })
        setIsLoadingDatasheet(false)
      } catch (errInfo) {
        setIsLoadingDatasheet(false)
      }
    }
  }

  //选中表
  const handleChangeDatasheet = (value, option) => {
    const tables = option.map(item => ({ id: item?.id, name: item?.tableName, comment: item?.tableComment, databaseName: item?.databaseName, value: item?.id, label: item?.tableName }))
    const formData = formApplyRef.current.getFieldsValue(true);
    const applyInfoTable = { ...formData.applyInfoTable, tables }
    formApplyRef.current.setFieldsValue({ applyInfoTable })
  }

  let rowSelection = {
    type: 'radio',
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: disabled,
    }),
  };

  useEffect(() => {
    console.log('useEffect child', disabled)
  }, [disabled])

  return <div style={{ background: '#fff', padding: ' 0 16px' }}>
    <div className='oap-mcd-workflow-box-title'>申请信息</div>
    <Form
      form={formApply}
      ref={formApplyRef}
      initialValues={fieldInfo}
      labelCol={{ flex: '86px' }}
      className='oap-form-labelBold'>
      {fieldInfo.id && <Row>
        <Col flex="500px"><Form.Item label="流程编号" style={{ marginBottom: '0' }}>
          <span className="ant-form-text">{fieldInfo?.id}</span>
        </Form.Item></Col>
      </Row>}
      <Row>
        <Col flex="772px">
          <Form.Item label="申请账号" style={{ marginBottom: '6px' }}>
            <span className="ant-form-text">{fieldInfo?.applyAdid}</span>
          </Form.Item>
        </Col>
      </Row>
      {locationSearch?.isOthers && <Row>
        <Col flex="772px">
          <Form.Item label="供应商账号:" style={{ marginBottom: '0' }}>
            <Row gutter={8}>
              <Col>
                <Form.Item layout="vertical" className='oap-form-supplier' >
                  <Row gutter={8}>
                    <Col span={3}>
                      <Form.Item label="账号" name={['supplier', 'adid']}>
                        <Input disabled={disabled} allowClear placeholder='请输入' />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="eid" name={['supplier', 'eidCode']}>
                        <Input disabled={disabled} allowClear placeholder='请输入' />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="姓名" name={['supplier', 'cnName']}>
                        <Input disabled={disabled} allowClear placeholder='请输入' />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="邮箱" name={['supplier', 'email']}>
                        <Input disabled={disabled} allowClear placeholder='请输入' />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={8} style={{ marginTop: '24px' }}>
                    <Col flex="80px">
                      <Button type="primary" disabled={disabled} onClick={handleSupplier}>查询</Button>
                    </Col>
                    <Col flex="80px">
                      <Button disabled={disabled} onClick={resetSearch}>重置</Button>
                    </Col>
                  </Row>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="authAccounts"
              rules={[{
                validator: (rule, value, callback) => {
                  if (!rowSelection.selectedRowKeys.length) {
                    callback('请选择供应商账号')
                  } else {
                    callback()
                  }
                }
              }]}>
              <Table
                rowKey="employeeNumber"
                pagination={{ position: ["none"] }}
                rowSelection={rowSelection}
                columns={columns}
                dataSource={supplierDataList}
                style={{ marginTop: '16px' }} />
            </Form.Item>
          </Form.Item>
        </Col>
      </Row>}
      <Row>
        <Col flex="772px">
          <Form.Item label="申请对象" name={['applyInfoTable', 'type']}>
            <Radio.Group disabled={disabled} onChange={handleApplyType}>
              <Radio value="DATABASE">数据库</Radio>
              <Radio value="TABLE">数据表</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col flex="772px">
          <Form.Item label="申请权限类型" name={['applyInfoTable', 'operation']}>
            <Radio.Group disabled={disabled} onChange={handleApplyOperation}>
              {READ_WRITE_PERMISSION.map(model => {
                return <Radio value={model.value} key={model.value}>{model.label}</Radio>
              })}
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        {showDatasheet ? <Col>
          <Form.Item label="申请表" required>
            <Space>
              <Form.Item name={['applyInfoTable', 'databases']} rules={[{ required: true, message: '请选择库' }]} noStyle>
                <Select
                  placeholder="请选择库"
                  mode="multiple"
                  allowClear
                  showSearch
                  option-filter-prop="options"
                  filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                  disabled={disabled}
                  notFoundContent={isLoadingDatabases ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                  fieldNames={{ label: 'databaseName', value: 'id', options: 'children' }}
                  options={databaseList}
                  labelInValue
                  onDropdownVisibleChange={initDatabasesList}
                  onChange={handleChangeDatabase}
                  style={{ width: '280px' }}>
                </Select>
              </Form.Item>
              <Form.Item name={['applyInfoTable', 'tables']} rules={[{ required: true, message: '请选择表' }]} noStyle>
                <Select
                  placeholder="请选择表"
                  allowClear
                  mode="multiple"
                  showSearch
                  option-filter-prop="options"
                  filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                  disabled={disabled}
                  notFoundContent={isLoadingDatasheet ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                  fieldNames={{ label: 'tableName', value: 'id', options: 'options' }}
                  options={datasheetList}
                  labelInValue
                  onDropdownVisibleChange={initDatasheetList}
                  onChange={handleChangeDatasheet}
                  style={{ width: '394px' }}>
                </Select>
              </Form.Item>
            </Space>
          </Form.Item>
        </Col> : <Col flex="772px">
          <Form.Item label="申请库" name={['applyInfoTable', 'databases']} rules={[{ required: true, message: '请选择库' }]}>
            <Select
              placeholder="请选择库"
              mode="multiple"
              allowClear
              showSearch
              option-filter-prop="options"
              filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
              disabled={disabled}
              notFoundContent={isLoadingDatabases ? <IconLoadingFill spin /> : (<Empty></Empty>)}
              fieldNames={{ label: 'databaseName', value: 'id', options: 'options' }}
              options={databaseList}
              labelInValue
              onDropdownVisibleChange={initDatabasesList}
              onChange={handleChangeDatabase}>
            </Select>
          </Form.Item>
        </Col>}
      </Row>
      <Row>
        <Col flex="772px">
          <Form.Item label="申请原因" name="applyReason" rules={[{ required: true, message: '请输入长文本' }]}>
            <Input.TextArea rows={4} placeholder="请输入长文本" maxLength={500} showCount disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </div >
})

export default applyForm;