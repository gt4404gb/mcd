import { Input } from '@aurum/pfe-ui';
import React, { useState, useEffect } from 'react';
import './styles/IdsInput.less';

export default ({ value, onChange, addonBefore, ...rest }: any) => {
  const [inputValue, setInputValue]: any = useState([]);
  useEffect(() => {
    if (value) {
      setInputValue(value)
    }
  }, [value]);
  return (
    <div className="ids-input" >      
      {addonBefore && <div>{inputValue.length} {addonBefore}</div>}
      <Input.TextArea value={inputValue.join(',')} onChange={(e: any) => {
        let v: string = e.target.value.trim();
        if (onChange) onChange(v ? v.split(',') : [])
      }}
        rows={6}
        {...rest}
      />
    </div>
  )
}