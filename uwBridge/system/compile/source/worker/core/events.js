import app from './app';
import { post } from './post';
import { socketInitialize } from './socket';
const {
  config,
  utility: {
    assign,
  }
} = app;
export const events = {
  appStatus: {
    state: 0
  },
  configure(data) {
    console.log(data);
    assign(config, data);
    socketInitialize();
  },
  credit(data) {
    app.creditSave = data;
    console.log('Credits Saved in worker');
  },
  post,
  socket: {}
};
