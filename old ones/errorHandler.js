class ErrorHandler {
    static showError(message, container) {
        const existingError = container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('message', 'bot-message', 'error-message');
        errorDiv.textContent = message;
        container.appendChild(errorDiv);
        container.scrollTop = container.scrollHeight;
        
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode === container) {
                errorDiv.remove();
            }
        }, 3000);
    }
}

export default ErrorHandler;