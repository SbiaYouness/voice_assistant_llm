class ChatInterface {
    constructor(container) {
        this.container = container;
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        this.container.appendChild(messageDiv);
        this.container.scrollTop = this.container.scrollHeight;
    }

    activateChat(header) {
        if (!header.classList.contains('active')) {
            header.classList.add('active');
            this.container.classList.add('active');
        }
    }
}

export default ChatInterface;