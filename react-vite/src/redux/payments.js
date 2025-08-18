import { csrfFetch } from "../csrf";

// Action Types
const LOAD_PAYMENTS = "payments/load";
const ADD_PAYMENT = "payments/add";
const UPDATE_PAYMENT = "payments/update";
const DELETE_PAYMENT = "payments/delete";

// Action Creators
const loadPayments = (payments) => ({
  type: LOAD_PAYMENTS,
  payments,
});

const addPayment = (payment) => ({
  type: ADD_PAYMENT,
  payment,
});

const updatePayment = (payment) => ({
  type: UPDATE_PAYMENT,
  payment,
});

const removePayment = (paymentId) => ({
  type: DELETE_PAYMENT,
  paymentId,
});

// Thunks
export const thunkGetPayments = (companyId) => async (dispatch) => {
  try {
    const res = await csrfFetch(`/api/companies/${companyId}/payments`);
    if (res.ok) {
      const data = await res.json(); // { payments: [...] }
      dispatch(loadPayments(data.payments));
      return data;
    }
  } catch (err) {
    let data;
    try {
      data = await err.json();
    } catch (e) {
      data = null;
    }
    return { errors: data?.errors || { server: "Failed to load payments." } };
  }
};

export const thunkCreatePayment = (companyId, formData) => async (dispatch) => {
  try {
    const res = await csrfFetch(`/api/companies/${companyId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json(); // { payment: {...} }
    const payment = data.payment ?? data;
    dispatch(addPayment(payment));
    return { payment };
  } catch (err) {
    let data;
    try {
      data = await err.json();
    } catch (e) {
      data = null;
    }
    return { errors: data?.errors || { server: "Failed to create payment." } };
  }
};

export const thunkUpdatePayment = (paymentId, formData) => async (dispatch) => {
  try {
    const res = await csrfFetch(`/api/payments/${paymentId}`, {
      method: "PUT", // use PUT unless your API specifies PATCH
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json(); // { payment: {...} }
    const payment = data.payment ?? data;
    dispatch(updatePayment(payment));
    return { payment };
  } catch (err) {
    let data;
    try {
      data = await err.json();
    } catch (e) {
      data = null;
    }
    return { errors: data?.errors || { server: "Failed to update payment." } };
  }
};

export const thunkDeletePayment = (paymentId) => async (dispatch) => {
  try {
    const res = await csrfFetch(`/api/payments/${paymentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      dispatch(removePayment(paymentId));
      return { ok: true };
    }
  } catch (err) {
    let data;
    try {
      data = await err.json();
    } catch (e) {
      data = null;
    }
    return { errors: data?.errors || { server: "Failed to delete payment." } };
  }
};

// Reducer
const initialState = {};

export default function paymentsReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_PAYMENTS: {
      const newState = {};
      action.payments.forEach((p) => {
        newState[p.id] = p;
      });
      return newState;
    }
    case ADD_PAYMENT:
    case UPDATE_PAYMENT:
      return { ...state, [action.payment.id]: action.payment };
    case DELETE_PAYMENT: {
      const newState = { ...state };
      delete newState[action.paymentId];
      return newState;
    }
    default:
      return state;
  }
}
