import app from '../app';
const {
  utility: {
    drop
  }
} = app;
let notificationStatus;
const notifications = [];
const	spawnNotification = (data) => {
  if (notificationStatus) {
    const notification = new Notification(data.title, {
      body: data.body,
      icon: data.icon
    }, data.options);
    const number = notifications.push(notification) - 1;
    setTimeout(() => {
      notification.close();
      drop(notifications, number, 1);
    }, data.time || 4000);
    return notification;
  }
};
app.notify = async (data) => {
  if (Notification.permission === 'granted') {
    return spawnNotification(data);
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      spawnNotification({
        body: 'enabled',
        title: 'Notifications',
      });
    }
  }
};
export const setupNotification = async () => {
  notificationStatus = await Notification.requestPermission();
};
