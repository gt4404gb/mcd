import React, { useState } from 'react';
import SearchForm, { initSearchObj } from '@/apps/douyin/components/taxConfig/SearchForm';
import SearchResult from '@/apps/douyin/components/taxConfig/SearchResult';
import './styles/List.less'

export default ({ }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="douyin-tax-configs table-container">
      <SearchForm searchObj={searchObj}
        onChangeSearchObj={(_updSearchObj: any) => {
          setSearchObj({ ..._updSearchObj });
        }} onSearch={(searchResult: any) => {
          setSearchResult(searchResult);
        }} />
      <SearchResult searchObj={searchObj} dataSource={searchResult}
        onChangePartialSearchObj={(value: any) => {
          setSearchObj({ ...searchObj, ...value });
        }} />
    </div>
  )
}