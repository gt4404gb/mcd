import React, { useState } from 'react';
import SearchForm from '@/apps/openapi/components/api/SearchForm';
import SearchResult from '@/apps/openapi/components/api/SearchResult';
import constants from '@/apps/openapi/common/constants';
import './styles/Apis.less';

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ pageSize: 10, currentPage: 1, status: constants.api.status.APPROVED.value });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="api-list table-container">
      <SearchForm searchConds={searchConds} onSearch={(searchResult: any) => {
        setSearchResult(searchResult);
      }} />
      <SearchResult dataSource={searchResult} searchConds={searchConds} onChangeSearchConds={(value: any) => setSearchConds(value)} />
    </div>
  )
}