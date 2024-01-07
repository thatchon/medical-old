import { SET_USER, SET_ROLE, CLEAR_USER } from './action';

const initialState = {
  user: null,
  role: null,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    case SET_ROLE:
      return { ...state, role: action.payload };
    case CLEAR_USER:
      return { ...state, user: null, role: null };
    default:
      return state;
  }
};

export default userReducer;