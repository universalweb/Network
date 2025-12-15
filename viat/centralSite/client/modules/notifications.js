function scheduleRemoval(notification) {
	setTimeout(() => {
		if (notification && notification.parentNode) {
			notification.parentNode.removeChild(notification);
		}
	}, 300);
}
export function hideNotification(notification) {
	if (!notification || !notification.parentNode) {
		return;
	}
	notification.classList.remove('show');
	scheduleRemoval(notification);
}
export function showNotification(message, type = 'info', duration = 4000) {
	const container = document.getElementById('notificationContainer');
	if (!container) {
		return null;
	}
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.innerHTML = `${message}<button class="notification-close" aria-label="Close">×</button>`;
	const closeButton = notification.querySelector('.notification-close');
	closeButton.addEventListener('click', () => {
		hideNotification(notification);
	});
	container.appendChild(notification);
	requestAnimationFrame(() => {
		notification.classList.add('show');
	});
	if (duration > 0) {
		setTimeout(() => {
			hideNotification(notification);
		}, duration);
	}
	return notification;
}
