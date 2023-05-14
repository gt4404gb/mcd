import * as orderAction from '../actions/orderAction';
const initialState = {
    refreshRandom: ''
}

export default (state = initialState, action) => {
  switch (action.type) {
    case orderAction.ORDER_ORDER_REFRESH: {
      const response = action.payload;
      return {
        ...state,
        refreshRandom: response,
      };
    }
    default:
      return state;
  }
};
