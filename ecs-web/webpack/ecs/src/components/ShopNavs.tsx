import React, { useEffect, useState } from 'react';
import {
  Radio,
  Button,
  Input,
  message,
  Row,
  Col,
  Tabs
} from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
import '@/assets/styles/shopselection/ShopNavs.less';
import { useRef } from 'react';
const { TabPane } = Tabs;
const ShopNavs = ((props: any, ref: any) => {
  const { callBackFunc} = props
  const [shops, setShops]:any = useState([])
  useEffect(() => {
    (async () => {
      try {
        const data = await orderApis.getMerchantModule().getShopList();
        if (data.success && data.data?.userShops) {
          setShops([{ id: '', name: '全部' }].concat(data.data.userShops))
        }
      } catch (e) {

      }
    })()
  }, []);

  const seleceShop = (key:any) => {
    callBackFunc(key)
  }

  return (<div className="search-nav-panel">
    <Tabs defaultActiveKey="" onChange={seleceShop} type="card" custype="common">
      {shops.map((item:any) => {
        return <TabPane  tab={item.name} key={item.id} disabled={item.id === 10005}>
      </TabPane>
      })}
    </Tabs>
  </div>)
})
export default ShopNavs;


