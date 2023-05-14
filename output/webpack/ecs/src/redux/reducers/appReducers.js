import { OpenPageLoading, ClosePageLoading } from '../actions/appAction';

const initialState = {
  pageLoadingVal: false,
};

export default (state = initialState, action) => {
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
      return state;
    }
  }
};
