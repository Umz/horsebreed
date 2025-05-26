export class Notification {

    static AddNotice(msg, style) {

        const divElement = document.getElementById("notifications");

        // Create a new paragraph element for the notification
        const newNotification = document.createElement('p');
        newNotification.textContent = msg;
        newNotification.className = style;
        newNotification.classList.add("notification-message");

        divElement.insertBefore(newNotification, divElement.firstChild);
    }
}