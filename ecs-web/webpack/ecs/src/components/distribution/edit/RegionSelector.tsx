import React, { useEffect, useState } from 'react';
import { Table, Form, Row, Col, Button, Input, Select, Modal } from '@aurum/pfe-ui';

export default ({ visible, onClose, source, regionData }: any) => {
  const [couponIdChecked, setCouponIdChecked] = useState(0);
  const [toSelectedCoupons, setToSelectedCoupons] = useState([]);
  const [coupons, setCoupons]: any = useState([]);
  const [channelOptions, setChannelOptions]: any = useState([]);
  const [html, setHtml]: any = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible])

  useEffect(() => {
    let _html = regionData?.map((item: any) => {
      return (<div className='region-part' key={item.index}>
        <label className='checkbox-wrap-left'>
          <span className='region-checkbox'>
            <span className='region-checkbox-inner'></span>
            <input type='checkbox' />
          </span>

          <span className='checkbox-label' key={item.index}> {item.part}</span>
        </label>
        <div className="checkbox-group">
          {
            item.provinces.map((len: any, i: any) => {
              return (
                <label className='checkbox-wrap'>
                  <input type='checkbox' />
                  <span className='checkbox-label' key={len.regionId}> {len.name}
                    <i className='region-province__more'></i>
                  </span>
                </label>
              )
            })
          }</div>
      </div>)
    })

    // 设置默认值
    setHtml(_html);
  }, [])




  // function findCityData(city) {
  //   city.forEach(item => {
  //     const { id, label, value, children } = item;
  //     if (selectedValues.includes(value)) {
  //       result.push({ id, label, value });
  //     }
  //     if (children && children.length) {
  //       findCityData(children);
  //     }
  //   });
  // }

  function close(toSelectedCoupons: any) {
    setCouponIdChecked(0);
    setToSelectedCoupons(toSelectedCoupons);
    if (onClose) {
      onClose(toSelectedCoupons, source);
    }
  }
  return (
    <Modal width={900} visible={visible} onCancel={() => { close([]) }}
      bodyStyle={{ paddingTop: '0' }}
      title="选择配送城市"
      footer={[
        <Button key="confirm" type="primary" onClick={() => { close(toSelectedCoupons) }} >确定</Button>,
      ]}
    >
      <div className="coupon-select-modal row">
        {html}
      </div>
    </Modal>
  )
}

