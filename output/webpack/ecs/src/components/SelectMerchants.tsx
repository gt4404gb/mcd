import React, { useEffect, useRef, useState } from 'react';
import { Select, Checkbox, Divider } from '@aurum/pfe-ui';
const { Option } = Select;

export default ({ cityOptions = [], onChange = null, value = [], disabled = false, mode = '', showAll = true }: any) => {
  const [checked, setChecked] = useState(false);
  const [currValue, setcurrValue]: any = useState([]);
  const [curCityOptions, setCurCityOptions]:any = useState([]);
  let maxLen = cityOptions.length;


  useEffect(() => {
    if (!cityOptions.length) return;
    setCurCityOptions(cityOptions);
    maxLen = cityOptions.length;
  }, [cityOptions]);


  useEffect(() => {
    if (value.length) {
      setcurrValue(value);
    }
  }, [value]);

  const handleChange = (value1: any) => {
    if (value1.length < maxLen) {
      setChecked(false);
    } else {
      setChecked(true);
    }
    setcurrValue(value1);
    onChange(value1);
  }

  const change = (e: any) => {
    let _value: any = [], arr: any = [];
    if (e.target.checked) {
      curCityOptions.forEach((item: any) => {
        arr.push(item.merchantId);
      })
      _value = arr;
      setcurrValue(_value);
      setChecked(true)
    } else {
      setChecked(false)
      _value = [];
      setcurrValue(_value);
    }
    if (onChange) {
      onChange(_value);
    }
  }
  return (
    <div className="city_select">
      <Select
        disabled={disabled}
        showSearch
        allowClear
        mode={mode}
        placeholder={$t('请关联商户,可多选')}
        value={currValue}
        onChange={handleChange}
        defaultActiveFirstOption={false}
        filterOption={(input:any, option:any) =>
          (option.children as unknown as string).includes(input)
        }
        dropdownRender={menu => (
          <div>
            {menu}
            <Divider style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
              <Checkbox checked={checked} onChange={change}>全选</Checkbox>
            </div>
          </div>
        )}
      >
        {cityOptions.map((item: any) => (
          <Option key={item.merchantId} value={item.merchantId}>{item.merchantName}</Option>
        ))}

      </Select>
    </div>
  )
};