import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { Input, Button, InputNumber, Space } from '@aurum/pfe-ui';
import PriceInput from '../libs/PriceInput';

import './styles/PayItems.less';

const MAX_ROWS: number = 100;
export default ({ value, onChange }: any) => {
  const [dataSource, setDataSource]: any = useState([]);
  const [columns, setColumns]: any = useState([]);

  const calcDataSource: any = (items: any) => {
    const len: number = items.length;
    return items.map((v: any, key: number) => {
      return {
        ...v,
        key: v.key || key,
        isFirst: (len === 1 || key === 0) ? true : false,
        isLast: (len === 1 || key === (len - 1)) ? true : false,
      };
    });
  }

  const up: any = (record: any) => {
    let prevRow: any = null;
    dataSource.some((item: any, key: number) => {
      if (item.key === record.key) {
        if (prevRow) {
          [prevRow.key, item.key] = [item.key, prevRow.key];
          dataSource[key - 1] = item;
          dataSource[key] = prevRow;
        }
        return true;
      }
      prevRow = item;
      return false;
    })
    if (prevRow) handleChange(calcDataSource(dataSource));
  }

  const down: any = (record: any) => {
    let prevRow: any = null;
    dataSource.some((item: any, key: number) => {
      if (prevRow) {
        [prevRow.key, item.key] = [item.key, prevRow.key];
        dataSource[key - 1] = item;
        dataSource[key] = prevRow;
        return true;
      } else {
        if (item.key === record.key) {
          prevRow = item;
        }
      }
      return false;
    })
    if (prevRow) handleChange(calcDataSource(dataSource));
  }

  useEffect(() => {
    if (Array.isArray(value)) {
      setDataSource(calcDataSource(value));
    }
  }, [value]);

  useEffect(() => {
    setColumns([
      {
        title: '商品项名称',
        dataIndex: 'name',
        className: 'drag-visible',
        render: (value: any, record: any) => {
          var fieldId: any = `name-${record.key}`;
          return (
            <>
              <Input id={fieldId} value={value} className="ant-input" placeholder="请输入名称" maxLength={12} onChange={(e: any) => {
                record.name = e.target.value;
                handleChange();
              }} />
            </>
          )
        }
      },
      {
        title: '数量',
        dataIndex: 'count',
        render: (value: any, record: any) => {
          return (
            <InputNumber value={value} placeholder="请输入数量" min={1} max={999} maxLength={8} onChange={(v: any) => {
              record.count = v;
              handleChange();
            }} />
          )
        }
      },
      {
        title: '价格（元）',
        dataIndex: 'price',
        render: (value: any, record: any) => {
          return (
            <PriceInput value={value} placeholder="请输入价格" maxLength={10} min={1} max={200000} onChange={(v: any) => {
              record.price = v;
              handleChange();
            }} />
          )
        }
      },
      {
        title: '操作',
        dataIndex: 'price',
        render: (_: any, record: any) => {
          return (
            <div className="actions">
              <Space size='xs'>
                {!record.isFirst && <a type="link" onClick={() => up(record)}>上移</a>}
                {!record.isLast && <a type="link" onClick={() => down(record)}>下移</a>}
                <a type="link" onClick={() => removeItem(record)}>删除</a>
              </Space>
            </div>
          )
        }
      },
    ]);
  }, [dataSource])

  const handleChange: any = (ds: any) => {
    if (onChange) {
      onChange([...(ds || dataSource)]);
    } else {
      setDataSource([...(dataSource || ds)]);
    }
  }

  const addItem: any = () => {
    dataSource.push({
      key: (new Date()).getTime() + (Math.random() * 10) >>> 0,
      price: 0,
      name: '',
      count: 1,
    })
    handleChange(dataSource);
  }

  const removeItem: any = (dsItem: any) => {
    handleChange(dataSource.filter((it: any) => {
      return it.key !== dsItem.key
    }));
  }

  return (
    <div className="pay-items" >
      {dataSource.length < MAX_ROWS && <Button type="primary" onClick={addItem}>添加商品项</Button>}
      {dataSource.length > 0 && <Table
        showHeader={true}
        className="item-table"
        pagination={false}
        dataSource={dataSource}
        columns={columns}
      />}
    </div>
  )
}