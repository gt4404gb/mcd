import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { Form, Select, Table, Row, Col, Input, Button, message, Modal, TreeSelect, IconFont, Cascader } from '@aurum/pfe-ui';
import * as commonApis from '@/common/net/apis';
import * as apis from '@/common/net/apis_activity';
import '@/assets/styles/activity/list.less';
import { Space } from '@aurum/pfe-ui';
import ModalFormNew from './ModalFormNew';
import { getChannelsName, getSubCategoriesFirstChild } from '@/common/helper';
const { Option } = Select;
const mapStateToProps = (state: any) => {
  return {
  }
}

const mapDispatchToProps = (dispatch: any) => ({

});

const initSearchObj: any = {
  activId: '', // 活动编号（精准查询）
  spuIds: [],//商品ID
  catRuleIds: [],
  name: '',//商品名称
  cityCode: [],//可售卖城市code
  channels: [],//可售渠道
  shopIds: [],
  activType: 1,
  pageNo: 1,
  pageSize: 200,
  source: 'ECS_BOSS',
  status: [2, 5]
}

export default connect(mapStateToProps, mapDispatchToProps)(({ activityReward, canOnlyView = false, showVisible, scene, onClose, SetRefresh, RefreshRewardList }: any) => {
  const { activityId }: any = useParams();
  const [activityRows, setActivityRows]: any = useState([]);
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj, activId: activityId, shopIds:scene === 3?[]:[1] });
  const [selectedRowKeys1, setSelectedRowKeys1]: any = useState([]);
  const [selectedRows, setSelectedRows]: any = useState([]);
  const [typeItemOptions, setTypeItemOptions]: any = useState([]);
  const [value, setValue]: any = useState([]);
  const [shopSOptions, setShopSOptions]: any = useState([]);

  let defaultColumns: any = [
    {
      title: '商品编号',
      dataIndex: 'spuId',
      key: 'shopId',
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '售卖渠道',
      dataIndex: 'channels',
      key: 'channels',
      render: (text: any, record: any) => {
        return getChannelsName(record.channels)
      }
    },
    {
      title: '店铺',
      dataIndex: 'shopName',
      key: 'shopName'
    },
    {
      title: '可用库存',
      dataIndex: 'stock',
      key: 'stock'
    },
    {
      title: '售卖开始时间',
      dataIndex: 'upTime',
      key: 'upTime'
    },
    {
      title: '售卖结束时间',
      dataIndex: 'downTime',
      key: 'downTime'
    }
  ];
  const [form] = Form.useForm();


  const rowSelection = {
    selectedRowKeys: selectedRowKeys1,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      if (!canOnlyView) {
        setSelectedRowKeys1(selectedRowKeys)
        setSelectedRows(selectedRows);
        console.log('selectedRows', selectedRows)
      } else {
        message.error('当前活动状态不可编辑！')
      }
    }
  };

  const modifyCategoriesData = async (data: any) => {
    if (data && data.length > 0) {
      data.map((item: any) => {
        item.key = item.ruleId;
        if(scene===4) {
          item.value = item.ruleId;
        } else {
          item.value = item.subRuleIds.toString();
        }
        item.label = item.name;
        if (item.subCategories && item.subCategories.length > 0) {
          modifyCategoriesData(item.subCategories);
          item.children = item.subCategories
        }
      });
    }
  };

  useEffect(() => {
    if (!activityId || !showVisible) return;
    setSelectedRowKeys1([]);
    setSelectedRows([]);
    form.resetFields();
    (async () => {
      const { data: filterObj } = await apis.getActivityService().filterNew({ scene: scene });
      if (filterObj && filterObj.categories && filterObj.categories.length > 0) {
        modifyCategoriesData(filterObj.categories);
        setTypeItemOptions(filterObj.categories);
        let defaultRuleId = getSubCategoriesFirstChild(filterObj.categories);
        setSearchObj({ ...searchObj, catRuleIds: defaultRuleId });
        setValue(defaultRuleId);
      }
      if(filterObj && filterObj.shopTypes && filterObj.shopTypes.length > 0) {
        let values:any = [];
        filterObj.shopTypes.map((item: any, index: any) => {
          if (item) {
            item.value = Object.keys(item)[0];
            item.label = item[item.value];
            values.push(item.value)
          }
        })
        filterObj.shopTypes.unshift({
          label: '不限',
          value: ''
        })
        setShopSOptions(filterObj.shopTypes);
      }
    })()
  }, [showVisible]);

  useEffect(() => {
    if (!activityId || !showVisible) return;
    form.resetFields();
    (async () => {
      const searchConds = { ...searchObj, activId: activityId };
      if( scene===3 &&  searchConds.shopIds.length === 0) {
        searchConds.shopIds = [1,4]
      }
      if( scene===3 && isString(searchConds.shopIds)) {
        searchConds.shopIds = [searchConds.shopIds]
      }
      if(scene===4) {
        searchConds.shopIds = [1]
      }
      const { data: resultObj } = await apis.getProService().activListSearch(searchConds);
      if (resultObj && resultObj.lists) {
        resultObj.lists = resultObj.lists.map((item: any) => {
          item.key = item.spuId;
          return item;
        });
        setActivityRows(resultObj.lists);
      }
    })()
  }, [searchObj]);

  const close = (arr: any) => {
    onClose();
  }

  const isString = (str: any) => {
    return (typeof str == 'string') && str.constructor == String;
  }

  const toBind = () => {
    if (!selectedRows.length) {
      message.error('请选择商品');
      return;
    }
    if (scene === 3) {
      let spuIds: any = [], bindSpuIds: any = [], glbalSpuIds = [], paramsLists: any = [];
      selectedRows.forEach((item: any, index: any) => {
        spuIds.push(item.spuId);
        paramsLists.push({
          ...item,
          categoryId: item.catId,
          categoryRuleId: item.catRuleId
        })
      })

      activityReward.spuList.forEach((item: any) => {
        bindSpuIds.push(item.spuId)
      })
      glbalSpuIds = spuIds.filter((item: any) => bindSpuIds.indexOf(item) > -1)
      if (glbalSpuIds.length > 0) {
        message.error('有已绑定过的商品，不可重复绑定')
        return;
      }
      (async function () {
        if (!canOnlyView) {
          let list: any = {};
          list.activId = activityId;
          list.spuList = paramsLists;
          const resp = await apis.getActivityService().createStep2(list);
          if (!resp.success) {
            message.error(resp.message);
          } else {
            SetRefresh()
            message.success('活动关联商品成功');
            onClose();
          }
        }
      })();
    } else {
      form.submit();
    }
  }

  const toSearch = () => {
    let values = form.getFieldsValue(searchObj);
    if(value && value.length && value[0].includes(',')) {
      values.catRuleIds = value[0].split(',');
    } else {
      values.catRuleIds = value;
    }
    const narrowSearchObj: any = {};
    Object.keys(values).map((key) => {
      narrowSearchObj[key] = values[key];
      if (key === 'spuIds') {
        if (values[key].length > 0) {
          if (isString(values[key])) {
            narrowSearchObj[key] = values[key].split(',');
          }
        } else {
          narrowSearchObj[key] = [];
        }
      }
    });
    setSearchObj({ ...searchObj, ...narrowSearchObj });
  }

  const delSelectedRows = ((spuId: any) => {
    let arr = [...selectedRows], newArr: any = [], newSelectedRowKeys1: any = [];
    arr.forEach((item: any, index: any) => {
      if (item.spuId !== spuId) {
        newArr.push(item);
        newSelectedRowKeys1.push(item.spuId)
      }
    })
    setSelectedRows(newArr);
    setSelectedRowKeys1(newSelectedRowKeys1)
  })

  const onChange = (newValue: string[]) => {
    console.log('newValue', newValue)
    if(scene == 3) {
      setValue(newValue);
    } 
  }

  return (
    <Modal width={900} visible={showVisible} onCancel={() => { close([]) }}
      bodyStyle={{ paddingTop: '0' }}
      title={scene == 3 ? "选择主商品" : "选择赠品"}
      footer={[
        <Button key="cancel" onClick={() => { close([]) }}>取消</Button>,
        <Button key="confirm" type="primary" onClick={() => { toBind() }} >确定</Button>,
      ]}
    >
      <div className="activity-list">
        <Form.Provider
          onFormFinish={(name, { values, forms }) => {
            if (name === 'proListNewForm') {
              let lists = forms.modalFoemNew.getFieldsValue(true).list;
              if (activityReward.rewardSpuList.length + lists.length > 5) {
                message.error('最多添加5个赠品')
                return;
              }
              let spuIds: any = [], bindSpuIds: any = [], glbalSpuIds = [], paramsLists: any = [];
              lists.forEach((item: any, index: any) => {
                spuIds.push(item.spuId)
                paramsLists.push({
                  count: item.count,
                  id: item.id,
                  shopId: item.shopId,
                  skuId: item.skus[0]?.skuId,
                  spuId: item.spuId,
                })
              })
              activityReward.rewardSpuList.forEach((item: any) => {
                bindSpuIds.push(item.spuId)
              })
              glbalSpuIds = spuIds.filter((item: any) => bindSpuIds.indexOf(item) > -1)
              if (glbalSpuIds.length > 0) {
                message.error('有已绑定过的商品，不可重复绑定')
                return;
              }
              (async function () {
                if (!canOnlyView) {
                  let list: any = {};
                  list.activId = activityId;
                  list.spuList = paramsLists;
                  const resp = await apis.getActivityService().rewardBind(list);
                  if (!resp.success) {
                    message.error(resp.message);
                  } else {
                    RefreshRewardList()
                    message.success('赠品绑定成功');
                    onClose();
                  }
                } else {
                }
              })();
            }
          }}
        >
          <Form layout="vertical"
            form={form}
            name="proListNewForm"
            className="search-form"
            initialValues={searchObj}
            onFinish={(values: any) => {
            }}
            onValuesChange={(values: any) => {
            }}
          >
            <div className="search-area">
              <Row gutter={16}>
                <Col span={3}>
                  <Form.Item label={$t('商品状态')} rules={[{ type: 'string', required: false }]}>
                    <Select defaultValue={'1'}>
                      <Select.Option value={'1'}>预热中/已上架</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label={$t('商品ID')} name="spuIds" >
                    <Input maxLength={140} placeholder="请输入商品ID" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label={$t('商品名称')} name="name" >
                    <Input maxLength={140} placeholder="请输入商品名称" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label={$t('商品类目')}>
                    <TreeSelect
                      style={{ width: '100%' }}
                      placeholder={$t('请选择')}
                      treeCheckable={true}
                      showCheckedStrategy={'SHOW_CHILD'}
                      treeData={typeItemOptions}
                      value={value}
                      onChange={onChange}
                      suffixIcon={<IconFont type="icon-xiangxia" />}
                    />
                  </Form.Item>
                </Col>
                {scene == 3 && <Col span={3}>
                  <Form.Item label={$t('选择店铺')} name="shopIds" >
                    <Select placeholder={$t('不限')} options={shopSOptions} />
                  </Form.Item>
                </Col>}
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item>
                    <Space>
                      <Button type="primary" onClick={toSearch}>{$t('portal_search')}</Button>
                      <Button htmlType="reset" onClick={(it: any) => {
                        setSearchObj({ ...searchObj,spuIds:[],name:'' });
                      }}>{$t('portal_reset')}</Button>
                      {!activityRows?.length && <Link style={{ fontSize: 12 }} key="action-edit" to={'/ecs/merchants/edit?1'}>还没有商品,去新建</Link>}
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
          {selectedRows.length > 0 && scene == 4 && <ModalFormNew canOnlyView={canOnlyView} selectedRows={selectedRows} delSelectedRows={delSelectedRows} />}
        </Form.Provider>
        <div>
          <Table
            rowSelection={{
              type: 'checkbox',
              ...rowSelection,
            }}
            scroll={{ x: '100%' }}
            tableLayout="fixed"
            columns={defaultColumns}
            dataSource={activityRows}
            pagination={{
              defaultPageSize: 10
            }}
          />
        </div>
      </div>
    </Modal>
  )
})
