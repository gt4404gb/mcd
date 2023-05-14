import { APP } from './index';

export const OpenPageLoading = APP + 'OpenPageLoading';
export const ClosePageLoading = APP + 'ClosePageLoading';

export const OpenLoading = () => ({
  type: OpenPageLoading,
});

export const CloseLoading = () => ({
  type: ClosePageLoading,
});
