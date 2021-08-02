import app from './app';
const {
  utility: {
    assign,
  }
} = app;
export const post = (id, data, options) => {
  const responseData = {
    data,
    id
  };
  assign(responseData, options);
  postMessage(responseData);
};
