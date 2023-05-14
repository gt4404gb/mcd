import React, { useEffect, useState } from 'react';
// @ts-ignore
import AurumImageField from '@/components/aurumImageField/ImageField';
import { Form, Input, Button, Popconfirm, Table, Divider, Space } from '@aurum/pfe-ui';
export default ({ dataSource, field, form, disabled, style = '' }: any) => {

  const columns_2: any = [
    {
      title: $t('序号'),
      dataIndex: 'index',
      key: 'index',
      width: 20,
      render: (text: any, prizeField: any, index: any) => (
        <span className='area'>{index + 1}</span>
      )
    },
    {
      title: $t('信纸'),
      dataIndex: 'envelop',
      key: 'envelop',
      width: 100,
      render: (text: any, prizeField: any) => (
        <Form.Item colon={false} name={[prizeField.name, 'envelop']} rules={[{ required: style == 'envelops', message: '请上传信纸图' }]} style={{ marginBottom: 0 }}>
          <AurumImageField uploadPath="ecs" disabled={disabled} style={{ width: '72px', height: '100px' }} />
        </Form.Item>
      )
    },
    {
      title: $t('封面图'),
      dataIndex: 'cover',
      key: 'cover',
      width: 100,
      render: (text: any, prizeField: any) => (
        <Form.Item colon={false} name={[prizeField.name, 'cover']} rules={[{ required: style == 'envelops', message: '请上传封面图' }]} style={{ marginBottom: 0 }}>
          <AurumImageField uploadPath="ecs" disabled={disabled} style={{ width: '78px', height: '100px' }} />
        </Form.Item>
      ),
    },
    {
      title: $t('分享图'),
      dataIndex: 'shareImg',
      key: 'shareImg',
      width: 100,
      render: (text: any, prizeField: any) => (
        <Form.Item colon={false} name={[prizeField.name, 'shareImg']} rules={[{ required: style == 'envelops', message: '请上传分享图' }]} style={{ marginBottom: 0 }}>
          <AurumImageField uploadPath="ecs" disabled={disabled} style={{ width: '80px', height: '100px' }} />
        </Form.Item>
      )
    },
    {
      title: $t('预设赠言'),
      dataIndex: 'giftWords',
      key: 'giftWords',
      width: 100,
      render: (text: any, prizeField: any) => (
        <Form.Item colon={false} name={[prizeField.name, 'giftWords']} rules={[{ required: style == 'envelops', message: '请输入预设赠言' }]} style={{ marginBottom: 0 }}>
          <Input maxLength={style == 'cardFaces' || style == 'enCardFaces' ? 27 : 22} disabled={disabled} size='large' placeholder="请输入" />
        </Form.Item>
      )
    },
  ]

  const [columns, setColumns]: any = useState(columns_2)

  useEffect(() => {
    if (style == 'cardFaces' || style == 'enCardFaces') {
      // 删除信纸图
      let newItemList = [
        {
          title: $t('卡面'),
          dataIndex: 'cover',
          key: 'cover',
          width: 100,
          render: (text: any, prizeField: any) => (
            <Form.Item colon={false} name={[prizeField.name, 'cover']} rules={[{ required: true, message: '请上传卡面' }]} style={{ marginBottom: 0 }}>
              <AurumImageField uploadPath="ecs" disabled={disabled} style={{ width: '100px', height: '100px' }} />
            </Form.Item>
          ),
        },
        {
          title: $t('赠送分享图'),
          dataIndex: 'shareImg',
          key: 'shareImg',
          width: 100,
          render: (text: any, prizeField: any) => (
            <Form.Item colon={false} name={[prizeField.name, 'shareImg']} rules={[{ required: true, message: '请上传分享图' }]} style={{ marginBottom: 0 }}>
              <AurumImageField uploadPath="ecs" disabled={disabled} style={{ width: '80px', height: '100px' }} />
            </Form.Item>
          )
        },
        {
          title: $t('信纸颜色(选填)'),
          dataIndex: 'coverRgb',
          key: 'coverRgb',
          width: 100,
          render: (text: any, prizeField: any) => (
            <Form.Item colon={false} name={[prizeField.name, 'coverRgb']}
              rules={[{ pattern: new RegExp('^[rR][gG][Bb][Aa]?[\(]((2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),){2}(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),?(0\.\d{1,2}|1|0)?[\)]{1}$'), message: '只能输入rgb格式颜色' }]}
              style={{ marginBottom: 0 }}
            >
              <Input maxLength={30} disabled={disabled} size='large' placeholder="rgb(255,255,255)" />
            </Form.Item>
          )
        }
      ]
      columns.splice(1, 3, ...newItemList)
      setColumns(columns)
    }
  }, [])

  return (
    <Form.Item className="composite-required-field prize-items-container" rules={[{ required: (style == 'envelops' || style == 'cardFaces') }]} style={{ marginTop: 0 }}>
      <Form.List name={field}>
        {(fields: any, { add, remove, move }) => {
          return <>
            <Button onClick={() => {
              add()
            }} type='primary'>添加</Button>
            {fields.length > 0 ?
              <div style={{ marginTop: '8px' }}>
                <Table
                  className="prize-items"
                  scroll={{ x: '100%' }}
                  pagination={false}
                  tableLayout="fixed"
                  style={{ textAlign: 'center' }}
                  rowKey={'name'}
                  columns={[...columns,
                  {
                    title: $t('Action'),
                    dataIndex: 'action',
                    key: 'action',
                    width: 60,
                    align: "center",
                    render: (text: any, prizeField: any, index: any) => (
                      <Space className="action-block" key={prizeField?.name} size='xxs'>
                        <Popconfirm
                          title='确认要删除吗？删除后可以点击添加按钮重新添加'
                          onConfirm={(e) => {
                            remove(prizeField?.name)
                          }}
                          okText="确认"
                          cancelText="取消"
                          disabled={disabled}
                        >
                          <a>删除</a>
                        </Popconfirm>
                        <Divider type="vertical" />
                        {index !== 0 && <a onClick={() => {
                          if(disabled) return;
                          move(index, index - 1);
                        }}>上移</a>}
                        {index !== 0 && index !== fields.length - 1 && <Divider type="vertical" />}
                        {index !== fields.length - 1 &&
                          <a onClick={() => {
                            if(disabled) return;
                            move(index, index + 1);
                          }}>下移</a>}
                      </Space>
                    )
                  }
                  ]}
                  dataSource={fields}
                />
              </div> :
              <div style={{
                width: '100%',
                height: '40px',
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                暂未添加
              </div>
            }
          </>
        }}
      </Form.List >
    </Form.Item >
  )
};