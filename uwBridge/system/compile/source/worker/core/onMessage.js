import app from './app';
import { events } from './events';
import { post } from './post';
const {
  utility: {
    get
  }
} = app;
self.onmessage = (e) => {
  const data = e.data;
  const requestName = data.request;
  const id = data.id;
  const body = data.data;
  const eventCallback = get(requestName, events);
  if (eventCallback) {
    const returned = eventCallback(body, {
      id
    });
    if (returned) {
      post(returned, id);
    }
    console.log(`Worker api.${requestName}`);
  } else {
    console.log(`FAILED Worker api.${requestName}`);
  }
};
