import app from '../app';
const security = {
  clear() {
    console.log('Cleanup');
  }
};
security.clear();
app.security = security;
