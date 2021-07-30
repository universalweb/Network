import app from './app.js';
import { workerRequest } from './worker';
const {
  assign,
} = app.utility;
export const request = async (requestName, config) => {
  const requestPackage = (config) ? {
    data: config,
    request: requestName
  } : requestName;
  const workerPackage = {
    data: {
      data: requestPackage,
      name: 'api'
    },
    request: 'socket.request'
  };
  if (requestPackage.id) {
    workerPackage.data.id = requestPackage.id;
    return workerRequest(workerPackage);
  }
  const json = await workerRequest(workerPackage);
  return json;
};
assign(app, {
  request,
});
