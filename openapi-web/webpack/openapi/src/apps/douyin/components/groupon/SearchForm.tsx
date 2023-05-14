import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/douyin/common/apis';
export const initSearchObj: any = {
  currentPage: 1,
  pageSize: 99,
  state: null,
  templateName: null
};

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchObj, onChangeSearchObj, onSearch }: any) => {
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    sanitizeFields(searchObj);
    let cursor: number = searchObj.currentPage;
    const resp: any = await apis.getDouyinModule().fetchGroupons({
      count: searchObj.pageSize,
      cursor,
    });
    if (resp.success) {
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    fetchList({ ...searchObj });
  }, [searchObj]);
  return (
    <Form layout="vertical"
      form={form}
      className="search-form"
      initialValues={searchObj}
      onFinish={(values: any) => {
        if (onChangeSearchObj) {
          onChangeSearchObj({
            ...searchObj,
            ...values,
            currentPage: 1
          });
        }
      }}
    >
    </Form>
  )
}
