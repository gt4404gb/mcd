import { Input } from '@aurum/pfe-ui';
import React, { useState, useEffect } from 'react';
import './styles/PriceInput.less'

export default ({ value, onChange, originalValue, min = 0, max, unit = 'cent', extra, ...rest }: any) => {
  const [valueYuan, setValueYuan]: any = useState(null);
  const [originalValueYuan, setOriginalValueYuan]: any = useState(null);

  useEffect(() => {
    let cent: any = parseFloat(value);
    let yuan: any = value;
    if (!isNaN(cent)) {
      if (String(value).match(/^\d\.0{1,2}$/)) {
        setValueYuan(value)
      } else {
        yuan = (unit === 'cent') ? cent / 100 : cent;
        if (String(value).endsWith('.')) {
          yuan += '.';
        } else {
          // 因为 value 一直是分，下面代码无意义
          let [integer, decimal]: any = String(value).split('.');
          if (decimal?.length > 2) {
            yuan = `${integer}.${decimal.substr(0, 2)}`;
          }
        }
        setValueYuan(yuan);
      }
    } else {
      setValueYuan('')
    }
  }, [value])

  useEffect(() => {
    if (originalValue) {
      let _value = parseInt(originalValue);
      if (!isNaN(_value)) {
        setOriginalValueYuan((unit === 'cent') ? (_value / 1000).toFixed(2) : _value);
      }
    }
  }, [originalValue]);

  return (
    <div className="price-input" >
      <Input value={valueYuan} onChange={(e: any) => {
        let yuan: any = e.target.value;
        yuan = yuan.replace(/[^\d\.]/, '');
        let cent = yuan;
        if (!yuan.match(/^\d\.0{1,2}$/)) {
          if (unit === 'cent') {
            if (!isNaN(parseFloat(yuan))) {
              let [integer, decimal]: any = yuan.split('.');
              if (decimal) {
                decimal = decimal.padEnd(2, '0');
                if (decimal.length > 2) {
                  decimal = decimal.substring(0, 2) + '.' + decimal.substring(2);
                }
                cent = (integer + decimal) >>> 0;
              } else {
                cent = yuan * 100;
              }
              if (cent > max || cent <= min) {
                // TODO: 错误提示.                
              }
            }
          }
          if (String(e.target.value).endsWith('.')) cent += '.';
        }
        if (onChange) onChange(cent);
      }}
        addonAfter="元"
        {...rest}
      />
      {originalValueYuan && <div className="extra">原价: {originalValueYuan}元</div>}
    </div>
  )
}