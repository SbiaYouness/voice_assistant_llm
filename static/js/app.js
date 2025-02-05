let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let chats = JSON.parse(localStorage.getItem('chats') || '[]');
let currentChatId = Date.now();

const recordButton = document.getElementById('recordButton');
const chatContainer = document.getElementById('chatContainer');
const loading = document.getElementById('loading');
const textInput = document.getElementById('textInput');
const sendText = document.getElementById('sendText');
const newChatBtn = document.querySelector('.new-chat button');
const historyDiv = document.querySelector('.history');
const visualizer = document.getElementById('audioVisualizer');

const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const chatArea = document.querySelector('.chat-area');

toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    toggleSidebarBtn.classList.toggle('collapsed');
    chatArea.classList.toggle('expanded');
});
// Add mic handling code
recordButton.addEventListener('click', async () => {
    if (!mediaRecorder) {
        await initializeRecording();
    }
    
    if (isRecording) {
        // Stop recording
        mediaRecorder.stop();
        isRecording = false;
        visualizer.classList.remove('active');
        recordButton.style.color = 'var(--text-color)';
    } else {
        // Start recording
        audioChunks = [];
        mediaRecorder.start();
        isRecording = true;
        visualizer.classList.add('active');
        recordButton.style.color = '#ff4444';
    }
});
// Add a new chat
newChatBtn.addEventListener('click', () => {
    saveChatToStorage();
    currentChatId = Date.now();
    chatContainer.innerHTML = '';
    
    const newChat = {
        id: currentChatId,
        title: `محادثة ${new Date().toLocaleTimeString()}`,
        messages: []
    };
    chats.unshift(newChat);
    localStorage.setItem('chats', JSON.stringify(chats));
    addChatToHistory(newChat);
    
    audioChunks = [];
    isRecording = false;
    textInput.value = '';
});

function addChatToHistory(chat) {
    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');
    historyItem.setAttribute('data-chat-id', chat.id);
    historyItem.textContent = chat.title;
    historyItem.addEventListener('click', () => loadChat(chat.id));
    historyDiv.prepend(historyItem);
}

function saveChatToStorage() {
    const messages = Array.from(chatContainer.children).map(msg => ({
        text: msg.textContent,
        sender: msg.classList.contains('user-message') ? 'user' : 'bot'
    }));
    
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    if (chatIndex !== -1) {
        chats[chatIndex].messages = messages;
        localStorage.setItem('chats', JSON.stringify(chats));
    }
}

function loadChat(chatId) {
    saveChatToStorage();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        // Update current chat ID
        currentChatId = chatId;
        
        // Clear and load messages
        chatContainer.innerHTML = '';
        chat.messages.forEach(msg => addMessage(msg.text, msg.sender, false));
        
        // Visual feedback for selected chat
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('selected');
            if (item.getAttribute('data-chat-id') == chatId) {
                item.classList.add('selected');
            }
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function addMessage(text, sender, save = true) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    if (save) {
        // Find current chat in array
        const chatIndex = chats.findIndex(c => c.id === currentChatId);
        if (chatIndex !== -1) {
            // Add message to chat
            if (!chats[chatIndex].messages) {
                chats[chatIndex].messages = [];
            }
            chats[chatIndex].messages.push({ text, sender });
            // Save to localStorage
            localStorage.setItem('chats', JSON.stringify(chats));
            
            // Update chat title with first message if it's new
            if (chats[chatIndex].messages.length === 1) {
                const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
                chats[chatIndex].title = title;
                document.querySelector(`.history-item[data-chat-id="${currentChatId}"]`).textContent = title;
                localStorage.setItem('chats', JSON.stringify(chats));
            }
        }
    }
}
async function initializeRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processAudio(audioBlob);
        };
    } catch (err) {
        console.error('Mic error:', err);
        alert('مشكل في الميكروفون');
    }
}

async function processAudio(audioBlob) {
    loading.style.display = 'block';
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
        const response = await fetch('/process_audio', { method: 'POST', body: formData });
        const data = await response.json();
        addMessage(data.transcription, 'user');
        addMessage(data.response, 'bot');
    } catch {
        addMessage('عندي مشكل. عاود من بعد.', 'bot');
    } finally {
        loading.style.display = 'none';
    }
}

sendText.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) return;

    loading.style.display = 'block';
    addMessage(text, 'user');
    textInput.value = '';

    try {
        const response = await fetch('/process_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        addMessage(data.response, 'bot');
    } finally {
        loading.style.display = 'none';
    }
});

textInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') sendText.click();
});

initializeRecording();

window.addEventListener('load', () => {
    chats = JSON.parse(localStorage.getItem('chats') || '[]');
    chats.forEach(chat => addChatToHistory(chat));
    if (chats.length > 0) {
        loadChat(chats[0].id);
    }
});