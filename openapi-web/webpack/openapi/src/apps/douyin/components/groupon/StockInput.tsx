import { InputNumber } from '@aurum/pfe-ui';
import React, { useState, useEffect } from 'react';
import './styles/StockInput.less'

export default ({ value, onChange, countSold, ...rest }: any) => {
  return (
    <div className="stock-input" >
      <InputNumber style={{width:'100%'}} value={value} min={0} max={99999} maxLength={5}
        onChange={(v: any) => {
          onChange(v)
        }}
        {...rest}
      />
      {countSold > 0 && <div className="extra">已售: {countSold}</div>}
    </div>
  )
}