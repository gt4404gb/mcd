import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { Input, Select, Space, Button } from '@aurum/pfe-ui';
import PayItems from './PayItems';

import './styles/PayItemGroups.less';

const MAX_ROWS: number = 10;
export default ({ value, onChange }: any) => {
  const [dataSource, setDataSource]: any = useState([]);
  const [columns, setColumns]: any = useState([]);

  const calcDataSource: any = (items: any) => {
    const len: number = items.length;
    return items.map((v: any, key: number) => {
      return {
        ...v,
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
      let groups: any = JSON.parse(JSON.stringify(value));
      groups = groups.map((g: any, key: number) => {
        g.item_list = g.item_list || [];
        let total = g.item_list.length;
        if (!g.option_count || g.option_count > total) g.option_count = total;
        if (total >= 1) {
          g.options = [{ value: total, label: `全部${total}项` }];
          for (let i = 1; i < total; i++) {
            g.options.push({
              value: i,
              label: `任选${i}项`,
            })
          }
        } else {
          g.options = [];
        }
        return {
          key: g.key || key,
          group: g,
        };
      });

      setDataSource(calcDataSource(groups));
    }
  }, [value]);

  useEffect(() => {
    setColumns([
      {
        title: 'Name',
        dataIndex: 'group',
        className: 'drag-visible top',
        render: (g: any, record: any) => {
          return <div className="pay-item-group">
            <div className="group-row">
              <Input className="ant-input" value={g.group_name} maxLength={10} placeholder="请输入商品组名称" onChange={(e: any) => {
                g.group_name = e.target.value;
                handleChange();
              }} />
              {g.options?.length > 0 && <Select className="option-count" value={g.option_count} options={g.options} onChange={(selectedVal: any) => {
                g.option_count = selectedVal;
                handleChange();
              }} />}
              <div className="group-actions">
                <Space size='xs'>
                  {!record.isFirst && <a type="link" onClick={() => up(record)}>上移</a>}
                  {!record.isLast && <a type="link" onClick={() => down(record)}>下移</a>}
                  <a type="link" onClick={() => removeGroup(record)}>删除</a>
                </Space>
              </div>
            </div>
            <div className="item-row">
              <PayItems value={g.item_list} onChange={(items: any) => {
                g.item_list = items;
                if (g.option_count > items.length) g.option_count = items.length;
                handleChange();
              }} />
            </div>
          </div>
        }
      },

    ]);
  }, [dataSource])

  const handleChange: any = (ds: any) => {
    if (onChange) {
      const groups: any = (ds || dataSource).map((d: any) => d.group)
      onChange(groups);
    } else {
      setDataSource([...(dataSource || ds)]);
    }
  }

  const addGroup: any = () => {
    dataSource.push({
      key: (new Date()).getTime() + (Math.random() * 10) >>> 0,
      group: {
        option_count: 0,
        item_list: []
      }
    })
    handleChange(dataSource);
  }

  const removeGroup: any = (dsItem: any) => {
    handleChange(dataSource.filter((it: any) => {
      return it.key !== dsItem.key
    }));
  }

  return (
    <div className="pay-item-groups" >
      {dataSource.length < MAX_ROWS &&
        <Button type="primary" onClick={addGroup} >添加商品组</Button>}
      {dataSource.length > 0 && <Table
        className="group-table"
        showHeader={false}
        pagination={false}
        dataSource={dataSource}
        columns={columns}
      />}
    </div>
  )
}