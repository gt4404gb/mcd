import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
/* @ts-ignore */
import _ from 'lodash';
import { Form, Radio, Row, Col, message, Button, Upload, Space } from '@aurum/pfe-ui';
import * as apis from '@/common/net/apis_activity';
import * as activityActions from '@/redux/actions/activityActions';
import constants from '@/common/constants';
import { ab2str } from '@/common/helper';
/* @ts-ignore */
import GoodList from './GoodList';
/* @ts-ignore */
import NewGood from './NewGood';
/* @ts-ignore */
import PmtList from './PmtList';
/* @ts-ignore */
import NewPmt from './NewPmt';

import '@/assets/styles/activity/prolist.less';

const initialActivityReward: any = {
  activId: '', // 活动id不能为空
  spuList: [],
  pmtList: [],
};

const mapStateToProps = (state: any) => {
  return {
    executeAction: state.activity.executeAction,
    currentStep: state.activity.currentStep,
    rewardDependedFields: state.activity.rewardDependedFields,
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  refreshPrizeLists: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_PRIZE_LISTS,
    payload
  }),
  resetExecuteAction: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_EXECUTE_ACTION,
    payload
  }),
  gotoNexStep: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_NEXT_STEP,
    payload
  }),
});
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ currentStep, onActionCompleted, rewardDependedFields, history, executeAction, resetExecuteAction, gotoNexStep, refreshPrizeLists }: any) => {
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const { activityId, isShow }: any = useParams();
  let selectedRowsData = useRef([]);

  const [activityReward, setActivityReward] = useState(JSON.parse(JSON.stringify(initialActivityReward)));
  const [canOnlyView, setCanOnlyView]: any = useState(false);
  const [spuRefresh, setSpuRefresh] = useState(false);
  const [pmtRefresh, setPmtRefresh] = useState(false);
  const [showSpuModalm, setShowSpuModal]: any = useState({ scene: 5, show: false })
  const [showPmtModalm, setShowPmtModal]: any = useState({ scene: 5, show: false })
  const [activType, setActivType]: any = useState(1)
  const [fileCDN, setFileCDN]: any = useState(null);
  const [fileSend, setFileSend]: any = useState(null);

  useEffect(() => {
    return () => {
      updateActivityGoodList({ ...initialActivityReward });
      updateActivityPmtList({ ...initialActivityReward });
      gotoNexStep(-1);
    }
  }, []);

  useEffect(() => {
    if (isShow === 'isShow' || rewardDependedFields.state === constants.activity.STATE_CODE.READY_ONLINE || rewardDependedFields.state === constants.activity.STATE_CODE.OVER) {
      setCanOnlyView(true);
    } else {
      setCanOnlyView(false);
    }
  }, [rewardDependedFields.state]);

  useEffect(() => {
    if (activityId) {
      (async () => {
        let _activityReward: any = activityReward;
        try {
          const { data: rewardObj } = await apis.getActivityService().bindList({ activId: activityId })
          if (rewardObj?.poaBindGoodsList?.length) {
            rewardObj.poaBindGoodsList.forEach((item: any) => {
              if (item.operationList?.length) {
                let result = item.operationList.findIndex((v: any) => {
                  return v.code == 'edit';
                })
                if (result < 0) {
                  item.notEdit = true;
                }
              } else {
                item.notEdit = true;
              }
            })
            _activityReward.spuList = rewardObj.poaBindGoodsList;
          } else {
            _activityReward.spuList = [];
          }
        } catch { }
        if (_activityReward) {
          updateActivityGoodList(_activityReward);
          let data = activityReward.spuList.filter((item: any) => {
            return !item.auctionStatus || item.auctionStatus < 2;
          })
          refreshPrizeLists(data);
        }
      })();
    }
  }, [activityId, spuRefresh]);

  useEffect(() => {
    if (activityId) {
      (async () => {
        let _activityReward: any = activityReward;
        // 请求预付券接口，https://api-docs.mcd.com.cn/project/1052/interface/api/109211，预付费券使用 partyOffAboveRewardList 字段
        try {
          const { data: rewardObj } = await apis.getActivityService().rewardList({ activId: activityId })
          if (rewardObj?.partyOffAboveRewardList?.length) {
            rewardObj.partyOffAboveRewardList.forEach((item: any) => {
              if (item.operationList?.length) {
                let result = item.operationList.findIndex((v: any) => {
                  return v.code == 'edit';
                })
                if (result < 0) {
                  item.notEdit = true;
                }
              } else {
                item.notEdit = true;
              }
            })
            _activityReward.pmtList = rewardObj.partyOffAboveRewardList;
          } else {
            _activityReward.pmtList = [];
          }
        } catch { }
        if (_activityReward) {
          updateActivityPmtList(_activityReward);
          let data = activityReward.pmtList.filter((item: any) => {
            return !item.auctionStatus || item.auctionStatus < 2;
          })
          refreshPrizeLists(data);
        }
      })();
    }
  }, [activityId, pmtRefresh]);

  useEffect(() => {
    if (activityId) {
      (async () => {
        try {
          apis.getActivityService().searchExcel(activityId).then((resp) => {
            if(resp?.success){
              if(resp?.data?.excelUrl) setFileCDN(resp?.data?.excelUrl)
              setActivType(resp?.data?.activType)
              form.setFieldsValue({
                activType: resp?.data?.activType
              })
            }}).catch(() => {
              setFileCDN(null)
              setActivType(1)
            });
        } catch { }
      })();
    }
  }, [activityId]);

  useEffect(() => {
    if (executeAction && currentStep === 1) {
      resetExecuteAction(false);
      if (!canOnlyView) {
        form.submit();
      } else {
        history.push('/ecs/activities');
      }
    }
  }, [executeAction])

  function updateActivityGoodList(activityReward: any) {
    activityReward.spuList = [...activityReward.spuList];
    setActivityReward({ ...activityReward});
  }

  function updateActivityPmtList(activityReward: any) {
    activityReward.pmtList = [...activityReward.pmtList];
    setActivityReward({ ...activityReward});
  }

  const showGoodsList = (scene: any) => {
    setShowSpuModal({
      scene: scene,
      show: true,
    })
  }

  const showPmtList = (scene: any) => {
    setShowPmtModal({
      scene: scene,
      show: true,
    })
  }

  const SetSpuRefresh = () => {
    setSpuRefresh(spuRefresh => !spuRefresh);
  }

  const SetPmtRefresh = () => {
    setPmtRefresh(pmtRefresh => !pmtRefresh);
  }

  const onRadioChange = (e: any) => {
    setActivType(e.target.value)
  }

  function updateFile(file: any) {
    setFileSend(file);
  }

  const preValid = async (values: any) => {
    if(values?.activType == 2){
      // 选择自定义，没有上传过file
      if (fileSend == null && fileCDN == null) {
        message.error('请导入城市和门店！')
        return;
      } else if(fileCDN && fileSend == null) {
        // 上传过文件，并且没有更改
        message.success('活动保存成功')
        history.push('/ecs/activities');
        return
      } 
      // 重新上传文件 || 上传文件
      upDateExcel(values)
      return
    } else {
      upDateExcel(values)
    }
  }

  const upDateExcel = async(values: any) => {
    try {
      const abType: any = 1
      const formData = new FormData();
      formData.append('file', fileSend);
      // formData.set('abType', abType);
      formData.append('abType', abType);
      formData.append('activType', values?.activType);
      formData.append('activityId', activityId);
      const buffResp: any = await apis.getActivityService().uploadExcel(formData);
      ab2str(buffResp, (resp: any) => {
        if (!resp.success && resp.message) {
          message.error(resp.message);
        } else {
          message.success('活动保存成功')
          history.push('/ecs/activities');
        }
      });
    }
    catch {
    }
  }

  return (
    <div className={currentStep === 1 ? 'edit-reward' : 'hide'}>
      <Form.Provider>
        <Form
          layout="vertical"
          ref={formEl}
          name="basicForm"
          initialValues={{...activityReward, activType: showSpuModalm, file: fileCDN}}
          scrollToFirstError={true}
          form={form}
          onFinishFailed={(values) => {
            onActionCompleted(false);
          }}
          onFinish={(values) => {
            if (!activityReward?.spuList || !activityReward?.spuList.length) {
              message.error('请关联一个商品！');
              return;
            }
            if (!activityReward?.pmtList || !activityReward?.pmtList.length) {
              message.error('请关联一个促销预付券！');
              return;
            }
            if (values.activType === 2 && (fileSend === null && fileCDN === null)) {
              message.error('请导入城市和门店！');
              return;
            }
            preValid(values)
          }}
          onValuesChange={(values: any) => {
            if (!values.spuList) return;
            activityReward.spuList = _.merge(activityReward.spuList, values.spuList);
            form.setFieldsValue({
              spuList: activityReward.spuList
            });
          }}
        >
          <Row className="form-block">
            <Col className='acc-mess'>
              <div className='acc-tit'><b></b>活动商品<span className='acc-tip'>最多添加1个商品</span></div>
              <Button
                disabled={canOnlyView}
                onClick={() => {
                  showGoodsList(5)
                }}
                type="primary" size={'small'} className='acc-btn'>选择商品</Button>
            </Col>
            <Col span={12}>
              <Form.Item>
                <GoodList
                  field='spuList'
                  canOnlyView={canOnlyView}
                  activityReward={activityReward}
                  activityId={activityId}
                  SetRefresh={SetSpuRefresh}
                  SetPmtRefresh={SetPmtRefresh}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row className="form-block">
            <Col className='acc-mess'>
              <div className='acc-tit'><b></b>促销预付券<span className='acc-tip'>最多添加1个预付券</span></div>
              <Button
                disabled={activityReward?.spuList?.length == 0 || canOnlyView}
                onClick={() => {
                  showPmtList(5)
                }}
                type="primary" size={'small'} className='acc-btn'>选择预付券</Button>
            </Col>
            <Col span={12}>
              <Form.Item>
                <PmtList
                  field='pmtList'
                  canOnlyView={canOnlyView}
                  activityReward={activityReward}
                  activityId={activityId}
                  SetRefresh={SetPmtRefresh}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row className="form-block">
            <Col span={12}>
              <Form.Item name='activType' label='活动范围' rules={[{ required: true, message: '请选择活动范围' }]}>
                <Radio.Group onChange={onRadioChange} disabled={canOnlyView} defaultValue={activType}>
                  <Radio value={1}>全部</Radio>
                  <Radio value={2}>自定义</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          {activType === 2 && <Row className="form-block">
            <Col span={12}>
              <Form.Item name='file'>
                <Upload
                  disabled={canOnlyView}
                  maxCount={1}
                  className='export-btn'
                  accept={'.xlsx'}
                  onChange={(info: any) => {
                    if (info.fileList.length === 0) {
                      updateFile(null);
                    } else {
                      updateFile(info.file);
                    }
                  }}
                  beforeUpload={(file: any) => {
                    return false;
                  }}>
                  <Space align="center" size={'xs'}>
                    <Button type='primary' size='middle' disabled={canOnlyView}>导入城市和门店</Button>
                    {fileCDN !== null && <a href={fileCDN} onClick={(e: any) => { e.stopPropagation(); }}>{fileCDN}</a>}
                    {(fileCDN === null && fileSend === null) && <a href="https://cdn-test.mcdchina.net/activ_admin/主题活动立减导入模板.xlsx" onClick={(e: any) => { e.stopPropagation(); }}>下载模板</a>}
                  </Space>
                </Upload>
              </Form.Item>
            </Col>
          </Row>}
        </Form>
      </Form.Provider>
      <NewGood
        activityReward={activityReward}
        SetRefresh={SetSpuRefresh}
        activityId={activityId}
        scene={showSpuModalm.scene}
        showVisible={showSpuModalm.show}
        onClose={() => {
          setShowSpuModal({
            scene: 5,
            show: false,
          })
        }}
      />
      <NewPmt
        activityReward={activityReward}
        SetRefresh={SetPmtRefresh}
        activityId={activityId}
        scene={showPmtModalm.scene}
        showVisible={showPmtModalm.show}
        onClose={() => {
          setShowPmtModal({
            scene: 5,
            show: false,
          })
        }}
      />
    </div>
  )
}));