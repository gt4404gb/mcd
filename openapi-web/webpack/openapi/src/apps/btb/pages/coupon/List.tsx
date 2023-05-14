import React, { useState, useRef } from 'react';
import SearchForm from '@/apps/btb/components/coupon/SearchForm';
import SearchResult from '@/apps/btb/components/coupon/SearchResult';
import './styles/List.less'

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ pageSize: 10, currentPage: '' });
  const [currPageSize, setCurrPageSize]: any = useState({ pageSize: 10 });
  const [searchResult, setSearchResult]: any = useState({});
  return (
    <div className="btb-coupons-container table-container">
      <SearchForm
        searchConds={searchConds}
        currPageSize={currPageSize}
        onSearch={(searchResult: any) => {
          setSearchResult(searchResult);
        }}
      />
      <SearchResult
        dataSource={searchResult}
        searchConds={searchConds}
        onChangeSize={(value: any) => setCurrPageSize(value)}
        onChangeSearchConds={(value: any) => setSearchConds(value)}
      />
    </div>
  )
}