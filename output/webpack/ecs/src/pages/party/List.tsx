import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
/* @ts-ignore */
import { Row, Col } from '@aurum/pfe-ui';
/* @ts-ignore */
import ProList from '@/components/party/ProList';
import '@/assets/styles/party/list.less'
import '@/assets/styles/common.less'

export default ((() => {
  return (
    <div className={'party-list'}>
      <Row>
        <Col span={12}>
          <Row>
            <ProList />
          </Row>
        </Col>
      </Row>
    </div >
  )
}));