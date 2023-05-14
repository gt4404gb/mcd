import {ClosePageLoading, OpenPageLoading} from '../actions/appAction';

const initialState = {
    pageLoadingVal: false,
};

export default (state, action) => {
    switch (action.type) {
        case OpenPageLoading: {
            return {
                pageLoadingVal: true,
            };
        }
        case ClosePageLoading: {
            return {
                pageLoadingVal: false,
            };
        }
        default: {
            return initialState;
        }
    }
};
