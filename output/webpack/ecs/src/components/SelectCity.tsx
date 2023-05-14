import React, { useEffect, useRef, useState } from 'react';
import { withRouter, useParams } from 'react-router-dom';
import { Select, Checkbox, Divider } from '@aurum/pfe-ui';

export default ({ cityOptions = [], onChange = null, value = [], disabled = false , mode='', showAll=true, labelInValue=false}: any) => {
  const [checked, setChecked] = useState(false);
  const [currValue, setcurrValue]:any = useState([]);
  const [curCityOptions, setCurCityOptions] = useState([]);
  let maxLen = cityOptions.length;

  useEffect(() => {
    if (!cityOptions.length) return;
    setCurCityOptions(cityOptions);
    maxLen = cityOptions.length;
  }, [cityOptions]);


  useEffect(() => {
    if(!labelInValue) {
      setcurrValue(value);
    } else {
      setcurrValue({ value: value })
    }

  }, [value]);

  const handleChange = (value1: any) => {
    if(!labelInValue) {
      //售卖城市
      if (value1.length < maxLen) {
        setChecked(false);
      } else {
        setChecked(true);
      }
      setcurrValue(value1);
      onChange(value1);
    } else {
      //发货城市
      if(!value1) {
        setcurrValue({value: ''});
        onChange('');
      } else {
        let _label = value1.label && value1.label.length && value1.label[1];
        setcurrValue({value: value1.value});
        onChange(_label);
      }
    }
  }

  const change = (e: any) => {
    let _value: any = [], arr: any = [];
    if (e.target.checked) {
      curCityOptions.forEach((item: any) => {
        arr.push(item.key);
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
        labelInValue = {labelInValue}
        disabled={disabled}
        showSearch
        allowClear
        mode={mode}
        placeholder={$t('请选择售卖城市')}
        value={currValue}
        onChange={handleChange}
        optionFilterProp={'children'}
        defaultActiveFirstOption={false}
        dropdownRender={menu => (
          <div>
            {menu}
            <Divider style={{ margin: '4px 0' }} />
            {showAll && <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
              <Checkbox checked={checked} onChange={change}>全选</Checkbox>
            </div>}
          </div>
        )}
      >
        {curCityOptions}
      </Select>
    </div>
  )
};