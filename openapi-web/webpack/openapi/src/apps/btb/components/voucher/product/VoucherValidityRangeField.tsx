import React, { useEffect, useState } from 'react';
import { InputNumber, Radio } from '@aurum/pfe-ui';
import './styles/VoucherValidityRangeField.less';

const defaultValObj: any = {
  days: 30,
  type: 1
}
export default ({ value, onChange, ...rest }: any) => {
  const [valObj, setValObj] = useState(defaultValObj);

  useEffect(() => {
    if (!value) {
      setValObj(defaultValObj)
    } else {
      setValObj({
        ...value
      });
    }
  }, [value])
  return (
    <div className="voucher-validity-range-field">
      <Radio.Group value={valObj.type} onChange={(e: any) => {
        const newValObj: any = { ...valObj };
        if (e.target.value === 0) {
          newValObj.days = 30;
        }
        newValObj.type = e.target.value;
        onChange(newValObj);
      }}>
        <Radio value={0}>同模板有效期</Radio>
        <Radio value={1}>生成后</Radio>
      </Radio.Group>
      {valObj.type === 1 && <>
        <InputNumber className="day-input" min={0} max={180} value={valObj.days} onChange={(val: any) => {
          onChange({
            ...valObj,
            days: val,
          })
        }} />天</>}
    </div>
  );
};