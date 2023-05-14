import {IsMCD, IsRGM} from '../actions/appAction';

const initialState = {
  systemHost: 'mcd',
};
const systemReducer = (state, action) => {
  if (!state) return {
    systemHost: 'mcd',
  }
  switch(action.type) {
    case IsMCD: {
      return {
        systemHost: 'mcd',
      }
    }
    case IsRGM: {
      return {
        systemHost: 'rgm',
      }
    }
    default: {
      return initialState
    }
  }
}
export default systemReducer;