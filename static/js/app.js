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
        console.log('Stopping recording...');
        mediaRecorder.stop();
        isRecording = false;
        visualizer.classList.remove('active');
        recordButton.style.color = 'var(--text-color)';
    } else {
        // Start recording
        console.log('Starting recording...');
        audioChunks = [];
        
        // Request data every 1 second to ensure we get something
        mediaRecorder.start(1000);
        
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
    const messages = Array.from(chatContainer.children).map(msg => {
        // Get the text content without including any audio player text
        const messageContent = msg.querySelector('.message-text') ? 
            msg.querySelector('.message-text').textContent : 
            msg.textContent;
        
        return {
            text: messageContent,
            sender: msg.classList.contains('user-message') ? 'user' : 'bot',
            audioFile: msg.hasAttribute('data-audio-file') ? msg.getAttribute('data-audio-file') : null
        };
    });
    
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
        chat.messages.forEach(msg => addMessage(msg.text, msg.sender, false, msg.audioFile));
        
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

function addAudioPlayerToMessage(audioFile, messageDiv) {
    // Store the audio file name as a data attribute only
    messageDiv.setAttribute('data-audio-file', audioFile);
    
    // Add a small indicator that audio is available
    const audioIndicator = document.createElement('span');
    audioIndicator.className = 'audio-indicator';
    audioIndicator.innerHTML = '<i class="fas fa-volume-up"></i>';
    audioIndicator.style.marginLeft = '8px';
    audioIndicator.style.color = '#4CAF50';
    audioIndicator.style.fontSize = '0.8em';
    
    // Add the indicator to the message
    messageDiv.querySelector('.message-text').appendChild(audioIndicator);
}

function addMessage(text, sender, save = true, audioFile = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    // Create a container for the text content
    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    textDiv.textContent = text;
    messageDiv.appendChild(textDiv);
    
    // Add audio player if available and the message is from the bot
    if (audioFile && sender === 'bot') {
        addAudioPlayerToMessage(audioFile, messageDiv);
    }
    
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
            chats[chatIndex].messages.push({ text, sender, audioFile });
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
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        // Set up audio visualization if needed
        setupAudioVisualization(stream);
        
        // Options for better audio quality
        const options = { 
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
        };
        
        // Try with specified options first, fallback to default if not supported
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.warn('Requested codec not supported, using default codec', e);
            mediaRecorder = new MediaRecorder(stream);
        }
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                audioChunks.push(event.data);
                console.log(`Audio chunk added: ${event.data.size} bytes`);
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log(`Recording stopped. Total chunks: ${audioChunks.length}`);
            if (audioChunks.length === 0 || (audioChunks.length === 1 && audioChunks[0].size < 100)) {
                console.error('No audio data captured or insufficient data');
                alert('No audio was captured. Please try again and speak into your microphone.');
                return;
            }
            
            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            console.log(`Audio blob created: ${audioBlob.size} bytes`);
            await processAudio(audioBlob);
        };
        
        // Add data collection at regular intervals for longer recordings
        mediaRecorder.addEventListener('start', () => {
            console.log('Recording started');
        });
        
    } catch (err) {
        console.error('Mic initialization error:', err);
        alert('مشكل في الميكروفون: ' + err.message);
    }
}

// Add this function to visualize audio (helps debug if audio is being captured)
function setupAudioVisualization(stream) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        // You could implement visualization here if needed
        console.log('Audio visualization setup successful');
    } catch (e) {
        console.warn('Audio visualization could not be set up:', e);
    }
}

async function processAudio(audioBlob) {
    if (!audioBlob || audioBlob.size === 0) {
        console.error('Empty audio blob');
        alert('No audio data was captured. Please try again.');
        loading.style.display = 'none';
        return;
    }
    
    loading.style.display = 'block';
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Log the size of what we're sending
    console.log(`Sending audio data: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    try {
        const response = await fetch('/process_audio', { method: 'POST', body: formData });
        const data = await response.json();
        
        addMessage(data.transcription, 'user');
        addMessage(data.response, 'bot', true, data.audio_file);
        
        // Play the audio response automatically with better error handling
        if (data.audio_file) {
            console.log("Playing audio response:", data.audio_file);
            const audioPlayer = new Audio(`/audio/${data.audio_file}`);
            
            // Set volume to maximum
            audioPlayer.volume = 1.0;
            
            // Force the user's device to use the speakers (not guaranteed to work on all browsers)
            audioPlayer.setSinkId && audioPlayer.setSinkId('default').catch(e => console.log('Cannot set audio output device'));
            
            // Play with better error handling
            audioPlayer.oncanplaythrough = () => {
                audioPlayer.play()
                    .then(() => console.log("Audio playback started"))
                    .catch(error => {
                        console.error('Error playing audio:', error);
                        // Try playing again after a user interaction
                        document.body.addEventListener('click', function playOnClick() {
                            audioPlayer.play();
                            document.body.removeEventListener('click', playOnClick);
                        }, { once: true });
                    });
            };
            
            audioPlayer.onerror = (e) => {
                console.error("Audio element error:", e);
            };
        }
    } catch (error) {
        console.error('Error processing audio:', error);
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
    } catch (error) {
        console.error('Error processing text:', error);
        addMessage('عندي مشكل. عاود من بعد.', 'bot');
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