import React, { useState } from 'react';
import SearchForm from '@/apps/openapi/components/subscribedApi/SearchForm';
import SearchResult from '@/apps/openapi/components/subscribedApi/SearchResult';

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ pageSize: 10, currentPage: 1 });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="subscribed-api-list table-container">
      <SearchForm searchConds={searchConds} onSearch={(searchResult: any) => {
        setSearchResult(searchResult);
      }} />
      <SearchResult dataSource={searchResult} searchConds={searchConds} onChangeSearchConds={(value: any) => setSearchConds(value)} />
    </div>
  )
}