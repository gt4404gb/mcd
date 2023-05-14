import React, { useState } from 'react';
import { Spin } from '@aurum/pfe-ui';
import SearchForm from '@/apps/openapi/components/dashboard/SearchForm';
import SearchResult from '@/apps/openapi/components/dashboard/SearchResult';
import './styles/Dashboard.less';

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState(null);
  const [searchResult, setSearchResult]: any = useState({});
  const [timeRange, setTimeRange]: any = useState([]);
  const [loading, setLoading]: any = useState(false);

  return (
    // <Spin spinning={loading} delay={500}>
    <div className="dashboard table-container">
      <SearchForm searchConds={searchConds} onSearchBegin={() => {
        setLoading(true);
      }}
        onSearch={(searchResult: any) => {
          setLoading(false);
          setSearchResult(searchResult);
        }}
        onTimeChange={(timeRange: any) => {
          setTimeRange(timeRange);
        }}
      />
      <SearchResult dataSource={searchResult} timeRange={timeRange} onChange={(value: any) => setSearchConds(value)} />
    </div>
    // </Spin>
  )
}