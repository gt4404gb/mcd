import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Form, Table, Space, Row, Col, Input, InputNumber, Button, Select, Empty, TreeSelect, Modal, message, DatePicker, Radio, Upload, Tabs, IconFont } from '@aurum/pfe-ui';
import config from '@/common/config/config';
import * as apis from '@/common/net/apis';
import * as apisEdit from '@/common/net/apis_edit';
import moment from 'moment';
import '@/assets/styles/api/list.less';
import '@/assets/styles/common.less'
import ShopSelection from '@/components/ShopSelection';
import QRDialog from '@/components/QRDialog';
import SelectMerchants from '@/components/SelectMerchants';
// @ts-ignore 
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
import { getB2bManager } from '@/common/helper';

const { RangePicker }: any = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const initSearchObj: any = {
  pageNum: 1,
  pageSize: 50,
  categoryIds: [],    //商品品类ID
  status: '',         //商品状态
  shopId: '',         //店铺ID
  shopName: '',       //店铺名称
  commodityId: '',    //商品ID
  commodityName: '',  //商品名称
  skuId: '', //规格ID
  skuName: '', //规格名称
  upStartTime: '',
  upEndTime: '',
  downStartTime: '',
  downEndTime: '',
  source: 'ECS_BOSS'
}

export default ((props: any) => {
  const [merchants, setMerchants]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [onlineParams, setOnlineParams]: any = useState({});
  const [offLineParams, setOffLineParams]: any = useState({});
  const [currenTab, setCurrentTab]: any = useState('0');
  const [modelVisible, setModelVisible] = React.useState(false);
  const [addStockBatchModelVisible, setAddStockBatchModelVisible] = React.useState(false);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalText, setModalText] = React.useState('');
  const [modalType, setModalType] = React.useState('');
  const [haveMoreShop, setHaveMoreShop] = React.useState(false);
  const newProduct = React.useRef("1")
  const [stockModalData, setStockModalData]: any = useState({});
  const [keyValue, setKeyValue]: any = useState('');
  const [editTimeVisible, setEditTimeVisible] = React.useState(false);
  const [onlineView, setOnlineView]: any = React.useState({});
  const [shopId, setShopId] = useState('');
  const [manager, setManager]: any = useState([]);
  const [dialogPreview, setDialogPreview]: any = useState({
    shopId: "",
    spuId: "",
    title: "",
    spuName: "",
    visible: false,
  });
  const dateRange: any = useRef([]);
  const editOffTime: any = useRef([]);
  const dateRangeUp: any = useRef([]);
  const dateRangeDown: any = useRef([]);

  const filterColumns = ['position', 'cities', 'channels', 'price', 'stock', 'sale', 'modifiedTime']
  let defaultColumns: any = [
    {
      title: $t('店铺ID'),
      dataIndex: 'shopId',
      key: 'shopId',
      width: 80,
      fixed: 'left',
    },
    {
      title: $t('店铺名称'),
      dataIndex: 'shopName',
      key: 'shopName',
      width: 100,
      fixed: 'left',
    },
    {
      title: '商品ID',
      dataIndex: 'spuId',
      key: 'spuId',
      width: 80,
      fixed: 'left',
    },
    {
      title: '商品名称',
      dataIndex: 'spuName',
      key: 'spuName',
      width: 100,
      render: (text: any, fields: any) => <Link key="editLink" to={{
        pathname: '/ecs/merchants/edit/' + fields.spuId + '/isShow',
        search: String(newProduct.current)
      }} >{text}</Link>,
    },
    {
      title: $t('商品类目'),
      dataIndex: 'catName',
      key: 'catName',
      width: 100,
    },
    {
      title: '商品状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: '售卖城市',
      dataIndex: 'cities',
      key: 'cities',
      width: 180,
      render: (text: any, fields: any) => {
        return renderSaleCityConfig(fields)
        // <div className="tdCities">{fields.cities}</div>
      }
    },
    {
      title: '露出位置',
      dataIndex: 'positions',
      key: 'positions',
      width: 100,
    },
    {
      title: '上架时间',
      dataIndex: 'upTime',
      key: 'upTime',
      width: 180,
      render: (text: any, fields: any) => {
        return <div className="tdCities">{fields.upTime}</div>
      }
    },
    {
      title: '下架时间',
      dataIndex: 'downTime',
      key: 'downTime',
      width: 180,
      render: (text: any, fields: any) => {
        return <div className="tdCities">{fields.downTime}</div>
      }
    },
    {
      title: '规格信息',
      dataIndex: 'skuInfo',
      key: 'skuInfo',
      width: 180,
      render: (text: any, fields: any) => {
        let result: any = [];
        if (fields.skuInfo?.length > 0) {
          fields.skuInfo.forEach((item: any) => {
            result.push(item + ',')
          })
        } else {
          result.push('/')
        }
        return (
          <div className="tdCities">{result}</div>
        )
      }
    },
    {
      title: '售卖渠道',
      dataIndex: 'channels',
      key: 'channels',
      width: 200,
    },
    {
      title: $t('价格'),
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
    },
    {
      title: $t('库存'),
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
    },
    {
      title: $t('销量'),
      dataIndex: 'sale',
      key: 'sale',
      width: 100,
    },
    {
      title: $t('更新时间'),
      dataIndex: 'modifiedTime',
      key: 'modifiedTime',
      width: 175,
    }
  ];

  const [addStockColumns, setAddStockColumns]: any = useState([]);
  const [addStockList, setAddStockList]: any = useState([]);

  const [columns, setColumns]: any = useState(defaultColumns);
  const [saleOptions, setSaleOptions]: any = useState([]);
  const [typeItemOptions, setTypeItemOptions]: any = useState([]);
  const [moreShop, setMoreShop] = useState(true);
  const [shopSelectionData, setShopSelectionData] = useState([]);
  const defaultSelectData = useRef("")
  const [positions, setPositions]: any = useState([]);
  //城市选择配置
  const cityFilterCodes: any = [];
  const defaultQueryCity: any = [];
  const queryCityMap: any = {};
  const cityMap: any = {};
  cityFilterCodes.map((c: any) =>
    defaultQueryCity.push({
      code: c,
      name: queryCityMap[c]
    })
  )
  const [queryCity, setQueryCity] = useState(defaultQueryCity);
  const options = queryCity && queryCity.map((c: any) => {
    cityMap[c.cityCode] = c.cityName;
    return <Option key={c.cityCode} value={c.cityCode}>{c.cityName}</Option>
  })



  const [form] = Form.useForm();

  useEffect(() => {
    if (searchObj.shopId === 10005) {
      defaultColumns = defaultColumns.concat([
        {
          title: '关联商户',
          dataIndex: 'merchantNames',
          key: 'merchantNames',
          width: 180,
          render: (text: any, fields: any) => {
            return <div className="tdCities">{fields.merchantNames}</div>
          }
        },])
    }
    defaultColumns = defaultColumns.concat([{
      title: $t('Action'),
      dataIndex: 'operation',
      key: 'operation',
      width: 200,
      fixed: 'right',
      renderAction: (fileds: any, record: any) => {
        const editLink = checkMyPermission('ecs:ecsLego:productedit') ?
          {
            name: '编辑',
            components: (<Link key="editLink" to={{
              pathname: '/ecs/merchants/edit/' + record?.spuId,
              search: String(newProduct.current)
            }} >{$t('编辑')}</Link>)
          } :
          {
            iconName: 'edit',
            name: '编辑',
            components: (<a type="link" className='disabled'>{$t('编辑')}</a>)
          };
        const editLinkOnline = checkMyPermission('ecs:ecsLego:productedit') ?
          {
            name: '编辑',
            components: (<Link key="editLink" to={{
              pathname: '/ecs/merchants/edit/' + record?.spuId,
              search: String(newProduct.current)
            }} >{$t('编辑')}</Link>)
          } :
          {
            iconName: 'edit',
            name: '在线编辑',
            components: (<a type="link" className='disabled'>{$t('在线编辑')}</a>)
          };

        const onlineLink = checkMyPermission('ecs:ecsLego:productup') ?
          {
            name: '上架',
            components: (<a type="link" key="onlineLink" onClick={() => { showOnlineModal(record) }}>{$t('上架')}</a>)
          } :
          {
            name: '上架',
            components: (<a type="link" key="onlineLink" className='disabled'>{$t('上架')}</a>)
          };
        const offLineLink = checkMyPermission('ecs:ecsLego:productdown') ?
          {
            name: '下架',
            components: (<a type="link" key="offLineLink" onClick={() => { showOfflineModal(record) }}>{$t('下架')}</a>)
          }
          :
          {
            name: '下架',
            components: (<a type="link" key="offLineLink" className='disabled'>{$t('下架')}</a>)
          }

        const editTimeLink = checkMyPermission('ecs:ecsLego:productdown') ?
          {
            name: '修改下架时间',
            components: (<a type="link" key="editTimeLink" onClick={() => { requestEditTimeAlert(record) }}>{$t('修改下架时间')}</a>)
          }
          :
          {
            name: '修改下架时间',
            components: (<a type="link" key="editTimeLink" className='disabled'>{$t('修改下架时间')}</a>)
          }

        const checkLink = {
          name: '查看',
          components: (<Link key="checkLink" to={{
            pathname: '/ecs/merchants/edit/' + record.spuId + '/isShow',
            search: String(newProduct.current)
          }}>  {$t('查看')}</Link>)
        };
        const addLink = checkMyPermission('ecs:ecsLego:addstock') ?
          {
            name: '加库存',
            components: (<a type="link" key="addLink" onClick={() => { requestAddStockAlert(record) }}>{$t('加库存')}</a>)
          }
          :
          {
            name: '加库存',
            components: (<a type="link" key="addLink" className='disabled'>{$t('加库存')}</a>)
          }
          ;
        const actions: any = [];
        if (record.status === '已上架' && (record.shopId == 1 || record.shopId == 2 || record.shopId == 3 || record.shopId == 5)) {
          actions.push({
            name: '预览',
            components: (<a type="link" key="preLook"
              href="#"
              onClick={() => {
                setDialogPreview({
                  shopId: record.shopId,
                  spuId: record.spuId,
                  title: "",
                  spuName: record.spuName,
                  spuType: record.spuType,
                  visible: true,
                });
              }}>预览</a>)
          });
        }
        if (record && record.opts && record.opts.length > 0) {
          record.opts.map((item: any) => {
            if (item.code == 1) {
              actions.push(editLink);
            } else if (item.code == 2) {
              actions.push(onlineLink);
            } else if (item.code == 3) {
              actions.push(offLineLink);
              actions.push(editTimeLink);
            } else if (item.code == 4) {
              actions.push(checkLink);
            } else if (record.shopId !== 5 && item.code == 5) {
              actions.push(addLink);
            }
            else if (item.code == 6) {
              actions.push(editLinkOnline);
            }
          });
        }
        return (
          actions
        )
      }
    }]);
    setColumns(defaultColumns)
  }, [shopId])

  useEffect(() => {
    if (moreShop == true) {
      return;
    }
    form.resetFields();
    (async () => {
      const searchConds = { ...searchObj };
      searchConds.status = currenTab == '0' ? '' : currenTab;
      if (dateRangeUp.current?.length > 0) {
        searchConds.upStartTime = dateRangeUp.current[0].format('YYYY-MM-DD');
        searchConds.upEndTime = dateRangeUp.current[1].format('YYYY-MM-DD');
      }

      if (dateRangeDown.current?.length > 0) {
        searchConds.downStartTime = dateRangeDown.current[0].format('YYYY-MM-DD');
        searchConds.downEndTime = dateRangeDown.current[1].format('YYYY-MM-DD');
      }
      const { data: resultObj } = await apis.getMerchantModule().list(searchConds);
      if (resultObj && resultObj.list) {
        setMerchants([...resultObj.list]);
        setTotalCount(resultObj.total)
      }
    })()

  }, [searchObj]);

  const initData = async () => {
    const { data: filterObj } = await apis.getMerchantModule().filter();
    if (filterObj && filterObj.categories && filterObj.categories.length > 0) {
      modifyCategoriesData(filterObj.categories);
      setTypeItemOptions(filterObj.categories);
    }
    if (filterObj && filterObj.cities && filterObj.cities.length > 0) {
      setQueryCity(filterObj.cities);
    }
    if (filterObj && filterObj.channel && filterObj.channel.length > 0) {
      filterObj.channel.map((item: any, index: any) => {
        if (item) {
          item.label = item.v;
          item.value = item.k;
        }
      })
      filterObj.channel.unshift({
        label: '不限',
        value: ''
      })
      setSaleOptions(filterObj.channel);
    }
    if (filterObj && filterObj.positions && filterObj.positions.length > 0) {
      let values: any = [];
      filterObj.positions.map((item: any, index: any) => {
        if (item) {
          item.value = Object.keys(item)[0];
          item.label = item[item.value];
          values.push(item.value)
        }
      })
      filterObj.positions.unshift({
        label: '不限',
        value: ''
      })
      setPositions(filterObj.positions);
    }
  }

  const getShopList = async () => {
    try {
      let data = await apis.getMerchantModule().getShopList();
      if (data.success && data.data.userShops.length > 1) {
        setMoreShop(true)
        setShopSelectionData(data.data.userShops)
      } else {
        if (data.data.userShops.length == 1) {
          setMoreShop(false)
          const backData = data.data.userShops[0];
          const getReturnData = {
            shopId: backData.id,         //店铺ID

          }
          newProduct.current = backData.id;
          fillInitSearchObj(backData.id, backData.name);
          setSearchObj({ ...searchObj, ...getReturnData })
          setShopId(backData.id);
        }
      }
    } catch (e) {
    }
  }

  useEffect(() => {
    (async () => {
      initData();
      getManager();

      try {
        const data = await apis.getMerchantModule().getShopList();
        setHaveMoreShop((data.data.userShops.length > 1))
        let isSaveShopId = await apis.getMerchantModule().isSaveShopId();
        if (isSaveShopId.success && isSaveShopId.data == null) {
          getShopList();
        } else {
          setMoreShop(false)
          const backData = isSaveShopId.data;
          defaultSelectData.current = JSON.stringify(backData);
          const getReturnData = {
            shopId: backData.id,         //店铺ID

          }
          newProduct.current = backData.id;
          fillInitSearchObj(backData.id, backData.name);
          setSearchObj({ ...searchObj, ...getReturnData })
          setShopId(backData.id)
        }
      } catch (e) {
        getShopList();
      }
    })()
  }, []);

  const getManager = async () => {
    try {
      const { data: result }: any = await apisEdit.getBMSModule().fetchMerchantList({});
      if (result?.length > 0) {
        setManager(getB2bManager(result));
      }
    } catch (error) {

    }
  }

  const success = (info: any) => {
    message.success(info);
  };

  const error = (info: any) => {
    message.error(info);
  };

  const requestProductOnline = () => {
    (async () => {
      const params = { ...onlineParams };
      const { data: resultObj, message: resultMessage } = await apis.getMerchantModule().online(params);
      if (resultObj) {
        setModelVisible(false);
        setConfirmLoading(false);
        success('操作成功');
        const narrowSearchObj: any = searchObj;
        setSearchObj({ ...searchObj, ...narrowSearchObj });
      } else {
        setModelVisible(false);
        error(resultMessage ? resultMessage : '上架失败');
        setConfirmLoading(false);
      }
    })()
  };

  const requestProductOffline = () => {
    (async () => {
      const params = { ...offLineParams };
      const { data: resultObj, message: resultMessage } = await apis.getMerchantModule().offline(params);
      if (resultObj) {
        setModelVisible(false);
        setConfirmLoading(false);
        success('操作成功');
        const narrowSearchObj: any = searchObj;
        setSearchObj({ ...searchObj, ...narrowSearchObj });
      } else {
        setModelVisible(false);
        error(resultMessage ? resultMessage : '下架失败');
        setConfirmLoading(false);
      }
    })()
  };

  const requestEditTimeAlert = (param: any) => {
    (async () => {
      const { data: resultObj, message: resultMessage } = await apis.getMerchantModule().onlineView(param);
      if (resultObj) {
        setOnlineView(resultObj);
        if (resultObj.upTime && resultObj.downTime) {
          editOffTime.current = [moment(resultObj.upTime, 'YYYY-MM-DD HH:mm:ss'), moment(resultObj.downTime, 'YYYY-MM-DD HH:mm:ss')]
        }
        setEditTimeVisible(true);
        setModalType('editTime');
      } else {
        error(resultMessage ? resultMessage : '获取信息失败');
      }
    })()
  }

  const requestAddStockAlert = async (param: any) => {
    (async () => {
      let { data: resultObj, message: resultMessage } = await apis.getMerchantModule().addStockAlert(param);
      if (resultObj) {
        resultObj = { ...resultObj, spuId: param.spuId, catId: param.catId }
        setModelVisible(false);
        setConfirmLoading(false);
        showAddStockModal(resultObj);
        setStockModalData(resultObj)
      } else {
        error(resultMessage ? resultMessage : '获取信息失败');
      }
    })()
  };

  const requestAddStore = () => {
    (async () => {
      if (addStockList && addStockList.length > 0) {
        const params = addStockList[0];
        try {
          const { data: resultObj, message: resultMessage } = await apis.getMerchantModule().addStock(params);
          if (resultObj) {
            setAddStockBatchModelVisible(false);
            setConfirmLoading(false);
            success('操作成功');
            const narrowSearchObj: any = searchObj;
            setSearchObj({ ...searchObj, ...narrowSearchObj });
          } else {
            error(resultMessage ? resultMessage : '加库存失败');

            const list = JSON.parse(JSON.stringify(addStockList));
            list[0].stock = 0;
            setAddStockList(list);
            setConfirmLoading(false);
          }
        } catch (e) {
          setConfirmLoading(false);
        }
      }
    })()
  };

  const requestAddStoreBatch = () => {
    (async () => {
      const params = addStockList;
      try {
        const { data: resultObj, message: resultMessage } = await apis.getMerchantModule().addStockBatch(params);
        if (resultObj) {
          setAddStockBatchModelVisible(false);
          setConfirmLoading(false);
          success('操作成功');
          const narrowSearchObj: any = searchObj;
          setSearchObj({ ...searchObj, ...narrowSearchObj });
        } else {
          error(resultMessage ? resultMessage : '加库存失败');

          const list = JSON.parse(JSON.stringify(addStockList));
          list.map((item: any) => {
            item.stock = 0;
          });
          setAddStockList(list);
          setConfirmLoading(false);
        }
      } catch (e) {
        setConfirmLoading(false);
      }
    })()
  };

  const handleTabClick = async (e: any) => {
    if (e) {
      setCurrentTab(e)
      const narrowSearchObj: any = searchObj;
      narrowSearchObj.status = e;
      setSearchObj({ ...searchObj, ...narrowSearchObj });
    }
  };

  const modifyCategoriesData = async (data: any) => {
    if (data && data.length > 0) {
      data.map((item: any) => {
        item.key = item.ruleId;
        item.value = item.ruleId;
        item.title = item.name;
        if (item.subCategories && item.subCategories.length > 0) {
          modifyCategoriesData(item.subCategories);
          item.children = item.subCategories
        }
      });
    }
  };

  const showOnlineModal = (item: any) => {
    setModalType('online');
    setModalTitle('上架确认');
    setModalText('上架成功后，用户即可在渠道端查看并购买该商品，是否确认上架');
    setModelVisible(true);
    setOnlineParams({ spuId: item.spuId || '' });
  };

  const showOfflineModal = (item: any) => {
    setModalType('offline');
    setModalTitle('下架确认');
    setModalText('下架成功后，则商品状态变更为已下架，且用户无法查看购买，是否确认下架');
    setModelVisible(true);
    setOffLineParams({ spuId: item.spuId || '' })
  };

  const showAddStockModal = (result: any) => {
    if (result) {
      if (result.head && result.head.length > 0 && result.data && result.data.length > 0) {
        setModalType('addStockBatch');
        var columns: any[] = [];
        result.head.map((item: any) => {
          if (item) {
            var columItem = { title: '' };
            columItem.title = item;
            columns.push(columItem);
          }
        })
        var addStockInputItem = { title: '*库存' };
        columns.push(addStockInputItem);

        setAddStockColumns(columns);
        var addStockListData: any[] = [];
        result.data.map((item: any) => {
          const dataSource: any[] = [];
          let skuItem: any = {}

          skuItem = { skuId: '', skuData: dataSource, stock: 0 }
          item.map((child: any, index: any) => {
            if (index == 0) {
              skuItem.skuId = child;
            } else {
              skuItem.skuData.push(child);
            }
          })
          addStockListData.push(skuItem);
        });
        setAddStockList(addStockListData);
        setAddStockBatchModelVisible(true);
      } else {
        setModalType('addStock');
        let skuItem: any = {};
        skuItem = { skuId: '', stock: 0, spuId: '' }
        skuItem.skuId = result.skuId;
        skuItem.spuId = result.spuId;
        var addStockListData: any[] = [];
        addStockListData.push(skuItem);
        setAddStockList(addStockListData);
        setAddStockBatchModelVisible(true);
      }
    } else {
      error('获取产品信息失败')
    }
  };

  const handleOk = () => {
    setConfirmLoading(true);
    if (modalType == 'online') {
      requestProductOnline();
    } else if (modalType == 'offline') {
      requestProductOffline();
    } else if (modalType == 'addStockBatch') {
      requestAddStoreBatch();
    } else if (modalType == 'addStock') {
      requestAddStore();
    } else if (modalType === 'editTime') {
      requestEditTime();
    }
  };

  const requestEditTime = () => {
    let param: any = {};
    param.spuId = onlineView.spuId;
    param.upTime = editOffTime?.current[0]?.format('YYYY-MM-DD HH:mm:ss');
    param.downTime = editOffTime?.current[1]?.format('YYYY-MM-DD HH:mm:ss');
    (async () => {
      const { data: resultObj, message: resultMessage } = await apis.getMerchantModule().putOnlineView(param);
      if (resultObj) {
        setEditTimeVisible(false);
        setConfirmLoading(false);
        success('操作成功');
        const narrowSearchObj: any = searchObj;
        setSearchObj({ ...searchObj, ...narrowSearchObj });
      } else {
        setEditTimeVisible(false);
        error(resultMessage ? resultMessage : '修改下架时间失败');
        setConfirmLoading(false);
      }
    })()
  }

  const handleCancel = () => {
    setModelVisible(false);
    setAddStockBatchModelVisible(false);
    setEditTimeVisible(false);
  };

  const renderSaleCityConfig: any = (field: any) => {
    let cityConfig: any = '全国可售';
    let cityFlag = (field?.cityFlag || field?.cityFlag == 0) ? field?.cityFlag : 1; // 0全国 1白名单 2黑名单
    if (cityFlag === 0) {
    } else if (cityFlag === 1) {
      cityConfig = `白名单：${field.cities}`;
    } else if (cityFlag === 2) {
      cityConfig = `黑名单：${field.cities}`;
    }
    return <div className="tdCities">{cityConfig}</div>
  }

  const renderAddStockList = () => {

    if (addStockList && addStockList.length > 0) {
      var stockItem = addStockList[0];
      if (addStockList.length == 1 && stockItem.skuData == null) {
        return (
          <div className={'addStockCon'}>
            <Row>
              {stockModalData.couponName != null && <Col span={6} style={{ marginBottom: '24px' }}><label><b>关联的卡券名称：</b><span style={{ display: 'block' }}>{stockModalData.couponName}</span></label></Col>}
              {stockModalData.couponNo != null && <Col span={6}><label><b>关联的卡券编号：</b><span>{stockModalData.couponNo}</span></label></Col>}
            </Row>
            <Row>
              {stockModalData.couponStock != null && <Col span={6} style={{ marginBottom: '24px' }}><label><b>当前卡券库存数：</b><span style={{ display: 'block' }}>{stockModalData.couponStock}</span></label></Col>}
              {stockModalData.stock != null && <Col span={6}><label><b>当前货架库存数：</b><span style={{ display: 'block' }}>{stockModalData.stock || 0}</span></label></Col>}
            </Row>
            <p style={{}}><b>增加库存数量: </b> <InputNumber style={{ display: 'block' }} size="small" min={1} key={Math.random()} placeholder="请输入数量" defaultValue='0' onChange={(e) => addStockInputChange(e, stockItem.skuId)} />
            </p>
          </div>
        );
      } else {
        return (
          <div>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              {renderTitleItem(addStockColumns)}
            </div>
            {renderAddStockItem(addStockList)}
          </div>
        );
      }
    }
  }

  const renderTitleItem = (titleList: any) => {
    return (
      titleList.map((item: any) => {
        return (
          <div className='addStock-title'>
            {item.title}
          </div>
        )
      })
    );
  }

  const renderAddStockItem = (stockList: any) => {
    return (
      <div>
        {stockList.map((item: any, index: any) => {
          return renderAddStockItemChild(item, stockList.length, index);
        })}
      </div>
    );
  }

  const addStockInputChange = (e: any, _skuId: any) => {

    const skuId = _skuId;
    const list = addStockList;
    list.map((item: any) => {
      if (item && item.skuId == skuId) {
        item.stock = isNaN(Number(e)) ? 0 : Number(e);
      }
    });
    setAddStockList(list);
  }

  const renderAddStockItemChild = (stockListChild: any, totleLength: any, index: any) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: '5px', justifyContent: 'space-between', borderBottom: totleLength == (index + 1) ? '1px solid #ffbc0d' : '1px solid #f0f0f0' }}>
        {stockListChild.skuData.map((item: any) => {
          return (
            <div style={{ flex: 1, marginLeft: '12px', overflow: 'auto' }}>
              {item}
            </div>)
        })}

        <InputNumber size="small" min={1} key={Math.random()} defaultValue='0' onChange={(e) => addStockInputChange(e, stockListChild.skuId)}
          style={{ flex: 0.8 }} />
      </div>
    );
  }
  const backFunc = async (data: any, isCheck: boolean) => {
    const backData = data;
    const getReturnData = {
      shopId: backData.id,         //店铺ID

    }
    newProduct.current = backData.id;

    fillInitSearchObj(backData.id, backData.name);
    setSearchObj({ ...searchObj, ...getReturnData })
    setShopId(backData.id);

    defaultSelectData.current = data;
    if (!isCheck) {
      setMoreShop(false)
    } else {
      const { history } = props;
      history.push(`/ecs/merchants/edit/45/isShow?1`)
    }
    try {
      await apis.getMerchantModule().saveShopId({
        id: backData.id,
        name: backData.name
      })
    } catch (e) { }
  }

  const fillInitSearchObj = (id: any, name: any) => {
    initSearchObj.shopId = id;

  }

  const switchShop = async () => {
    setKeyValue(new Date());
    dateRange.current = [];
    dateRangeUp.current = [];
    dateRangeDown.current = []

    await getShopList()
    setMoreShop(true)
  }

  const onChangeDateUp = (value: any, dateString: any) => {
    dateRangeUp.current = value;
  }
  const onChangeDateDown = (value: any, dateString: any) => {
    dateRangeDown.current = value;
  }

  const onChangeDate1 = (value: any, dateString: any) => {
    editOffTime.current = value;
  }

  return (
    <div className="merchant-list table-container">
      {moreShop == true && <ShopSelection callBackFunc={backFunc} basePage='merchants' shopSelectionData={shopSelectionData} defaultSelectData={defaultSelectData.current} />}

      {moreShop == false && <Form layout="vertical"
        form={form}
        className="search-form"
        initialValues={searchObj}
        onFinish={(values: any) => {
          const narrowSearchObj: any = {};
          Object.keys(values).map((key) => {
            narrowSearchObj[key] = values[key];
          });
          narrowSearchObj.pageNum = 1;
          newProduct.current = searchObj.shopId;
          setSearchObj({ ...searchObj, ...narrowSearchObj });
        }}
        onValuesChange={(values: any) => {
        }}
      >
        <div className="search-area">
          <Row gutter={32}>
            <Col span={3}>
              <Form.Item label={$t('商品ID')} name="commodityId">
                <Input style={{ width: '100%' }} placeholder="请输入商品ID" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('商品名称')} name="commodityName" rules={[{ type: 'string', required: false }]}>
                <Input maxLength={140} placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('商品类目')} name="categoryIds" >
                <TreeSelect
                  style={{ width: '100%' }}
                  dropdownStyle={{ maxHeight: 800, overflow: 'auto' }}
                  placeholder={$t('请选择')}
                  showSearch={false}
                  treeCheckable={true}
                  showArrow={true}
                  showCheckedStrategy='SHOW_PARENT'
                  treeData={typeItemOptions}
                  suffixIcon={<IconFont type="icon-xiangxia" />}
                />

              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('售卖城市')} name="cityCode">
                <Select
                  showSearch
                  allowClear
                  placeholder={$t('不限')}
                  value={cityFilterCodes}
                  optionFilterProp={'children'}
                  defaultActiveFirstOption={false}
                  onChange={(value: any) => {
                    queryCityMap[value] = cityMap[value] ? cityMap[value] : queryCityMap[value]
                  }}>
                  {options}
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('售卖渠道')} name="channel" >
                <Select placeholder={$t('不限')} options={saleOptions} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('规格ID')} name="skuId" >
                <Input maxLength={50} placeholder="请输入skuId" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('规格名称')} name="skuName" >
                <Input maxLength={50} placeholder="请输入规格名称" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('上架时间')}>
                <RangePicker
                  style={{ width: '100%' }}
                  picker="date"
                  onChange={onChangeDateUp}
                  key={keyValue}
                  suffixIcon={<IconFont type="icon-rili" />}
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('下架时间')}>
                <RangePicker
                  style={{ width: '100%' }}
                  picker="date"
                  onChange={onChangeDateDown}
                  key={keyValue}
                  suffixIcon={<IconFont type="icon-rili" />}
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('露出位置')} name="position" >
                <Select allowClear placeholder={$t('不限')} options={positions} />
              </Form.Item>
            </Col>
            {searchObj.shopId === 10005 && <Col span={3}>
              <Form.Item label={$t('关联商户')} name="merchantId" >
                <Select
                  allowClear
                  showSearch
                  placeholder={$t('不限')}
                  filterOption={(input: any, option: any) =>
                    (option.children as unknown as string).includes(input)
                  }
                >
                  {
                    manager.map((item: any) => {
                      return <Option key={item.merchantId} value={item.merchantId}>{item.merchantName}</Option>
                    })
                  }
                </Select>
              </Form.Item>
            </Col>}
          </Row>
          <Row gutter={32}>
            <Col span={6}>
              <Space size='xs'>
                <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
                <Button htmlType="reset" onClick={(it: any) => {
                  setKeyValue(new Date());
                  dateRange.current = [];
                  dateRangeUp.current = [];
                  dateRangeDown.current = [];
                  newProduct.current = initSearchObj.shopId;
                  setSearchObj(initSearchObj);
                }}>{$t('portal_reset')}</Button>
                {haveMoreShop == true && <Button onClick={() => { switchShop() }} >切换店铺</Button>}
                <Link to={{
                  pathname: "/ecs/merchants/edit",
                  search: String(newProduct.current)
                }}>
                  <Button disabled={!checkMyPermission('ecs:ecsLego:createpro')}>{$t('新建商品')}</Button>
                </Link>
              </Space>
            </Col>
          </Row>
        </div>
      </Form>}

      {moreShop == false && <>
        <Tabs defaultActiveKey={currenTab} onChange={(e) => { handleTabClick(e) }} type="card" custype="common">
          <TabPane key="0" tab="全部"></TabPane>
          <TabPane key="2" tab="已上架"></TabPane>
          <TabPane key="5" tab="预热中"></TabPane>
          <TabPane key="1" tab="仓库中"></TabPane>
          <TabPane key="3" tab="已售罄"></TabPane>
          <TabPane key="4" tab="已下架"></TabPane>
        </Tabs>
        <div className="table-top-wrap" >
          {merchants?.length > 0 && <Table
            scroll={{ x: '100%' }}
            tableLayout="fixed"
            columns={columns}
            dataSource={merchants}
            rowKey={'spuId'}
            expanded
            allFilterColumns={filterColumns}
            pagination={{
              pageSize: searchObj.pageSize,
              showSizeChanger: true,
              defaultPageSize: 50,
              showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
              current: searchObj.pageNum,
              total: totalCount,
              onShowSizeChange: (current: any, size: any) => { },
              onChange: (pageNum: any, pageSize: any) => {
                setSearchObj({ ...searchObj, pageNum, pageSize });
              },
              position: ['bottomLeft']
            }} />
          }
          {!merchants || merchants.length == 0 &&
            <Empty />
          }
        </div>
      </>}
      <Modal
        width={320}
        title={modalTitle}
        open={modelVisible}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <p>{modalText}</p>
      </Modal>
      <Modal
        width={800}
        title={'加库存'}
        open={addStockBatchModelVisible}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        {renderAddStockList()}
      </Modal>

      {editTimeVisible && <Modal
        width={390}
        open={true}
        title={'修改下架时间'}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <Space>
          <RangePicker
            picker="date"
            defaultValue={[moment(onlineView.upTime, 'YYYY-MM-DD HH:mm:ss'), moment(onlineView.downTime, 'YYYY-MM-DD HH:mm:ss')]}
            showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
            onChange={onChangeDate1}
            key={keyValue}
            suffixIcon={<IconFont type="icon-rili" />}
            disabledDate={(current: any) => {
              return current && current < moment().startOf('day');
            }}
          />
        </Space>
      </Modal>}
      <QRDialog
        isPreview={true}
        title={dialogPreview.title}
        show={dialogPreview.visible}
        shopId={dialogPreview.shopId}
        spuId={dialogPreview.spuId}
        spuName={dialogPreview.spuName}
        spuType={dialogPreview.spuType}
        onClose={() => {
          setDialogPreview({
            shopId: "",
            spuId: "",
            title: "",
            spuName: "",
            spuType: 0,
            visible: false,
          });
        }}
      />
    </div>
  )
})