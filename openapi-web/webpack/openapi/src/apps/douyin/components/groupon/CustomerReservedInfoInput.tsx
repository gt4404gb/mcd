import { Checkbox, Input } from '@aurum/pfe-ui';
import React, { useState, useEffect } from 'react';
export default ({ value, onChange, extra, ...rest }: any) => {
  const [info, setInfo]: any = useState([]);
  useEffect(() => {
    if (value) {
      const _info = [];
      if (value.allow) _info.push(1);
      if (value.allow_tel) _info.push(2);
      setInfo(_info);
    }
  }, [value]);
  return (
    <Checkbox.Group value={info} onChange={(checkedValues: any) => {
      const v = {
        allow: true,
        allow_tel: true,
      };
      // if (checkedValues.indexOf(1) > -1) v.allow = true;
      // if (checkedValues.indexOf(2) > -1) v.allow_tel = true;
      onChange(v);
    }}
      {...rest}
    >
      <Checkbox value={1}>留资</Checkbox>
      <Checkbox value={2} >顾客电话</Checkbox>
    </Checkbox.Group>
  )
}