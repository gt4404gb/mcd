import http from '@omc/boss-https';
import { OpenLoading, CloseLoading } from '@/redux/actions/appAction';

const ApiPrefix = {
  PORTAL: '/api/inner/platform',
  MC: '/api/inner/messagecenter'
};

const httpCtx = http({
  baseUrl: ApiPrefix.PORTAL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading
});

export function changeLocale(locale) {
  if (locale === 'cn') {
    return 'en';
  } else {
    return 'cn';
  }
}

export function getLocale() {
  return httpCtx.get('/i18n');
}

export function getLangDetail(id) {
  return httpCtx.get('/i18n/detail/' + id);
}

export function searchLangList(params) {
  return httpCtx.get('/i18n/query', { params });
}
export function saveLang(params) {
  return httpCtx.post('/i18n/create', { params });
}
export function updateLang(params) {
  return httpCtx.post('/i18n/update', { params });
}
export function deleteLang(id) {
  return httpCtx.post('/i18n/delete/' + id);
}

export function getLangTypeDetail(id) {
  return httpCtx.get('/langType/detail/' + id);
}

export function getLangTypeList() {
  return httpCtx.get('/langType/queryUsedAndActive');
}
export function searchLangTypeList() {
  return httpCtx.get('/langType/queryUsed');
}
export function getUnUsedLangTypeList() {
  return httpCtx.get('/langType/queryUnUsed');
}
export function newOrUpdateLangType(params) {
  return httpCtx.post('/langType/create', { params });
}
export function activeLangType(id) {
  return httpCtx.post('/langType/updateStatusActive/' + id);
}
export function deActiveLangType(id) {
  return httpCtx.post('/langType/updateStatusDeActive/' + id);
}
export function setDefaultLangType(id) {
  return httpCtx.post('/langType/updateSetDefault/' + id);
}
