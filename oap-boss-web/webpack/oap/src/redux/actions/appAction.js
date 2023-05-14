import {APP} from './index';

export const OpenPageLoading = APP + 'OpenPageLoading';
export const ClosePageLoading = APP + 'ClosePageLoading';
export const IsMCD = APP + 'MCD';
export const IsRGM = APP + 'RGM';

export const OpenLoading = () => ({
    type: OpenPageLoading,
});

export const CloseLoading = () => ({
    type: ClosePageLoading,
});

export const SetMCD = () => ({
    type: IsMCD,
});

export const SetRGM = () => ({
    type: IsRGM,
});
