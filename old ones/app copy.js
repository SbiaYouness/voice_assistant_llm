import ErrorHandler from './errorHandler.js';
import AudioHandler from './audioHandler.js';
import Visualizer from './visualizer.js';
import ChatInterface from './chatInterface.js';

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let visualizer;

async function initApp(ErrorHandler, AudioHandler, Visualizer, ChatInterface) {
    const elements = {
        recordButton: document.getElementById('recordButton'),
        chatContainer: document.getElementById('chatContainer'),
        loading: document.getElementById('loading'),
        textInput: document.getElementById('textInput'),
        sendText: document.getElementById('sendText'),
        header: document.querySelector('header'),
        visualizer: document.getElementById('audioVisualizer'),
        recordingStatus: document.getElementById('recordingStatus')
    };

    const audioHandler = new AudioHandler();
    const chatInterface = new ChatInterface(elements.chatContainer);

    async function init() {
        try {
            await audioHandler.initialize();
            mediaRecorder = audioHandler.mediaRecorder;
            setupEventListeners();
        } catch (err) {
            ErrorHandler.showError('مشكل في الميكروفون', elements.chatContainer);
        }
    }

    function setupEventListeners() {
        elements.recordButton.addEventListener('click', handleRecording);
        elements.sendText.addEventListener('click', handleTextSubmit);
        elements.textInput.addEventListener('keyup', handleEnterKey);
    }

    function handleRecording() {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    }

    function startRecording() {
        audioChunks = [];
        mediaRecorder.start(100);
        isRecording = true;
        elements.recordButton.classList.add('recording');
        elements.visualizer.classList.add('active');
        elements.recordingStatus.classList.add('active');
        chatInterface.activateChat(elements.header);
        visualizer = new Visualizer(audioHandler.getStream());
        visualizer.startVisualization();
    }

    function stopRecording() {
        mediaRecorder.stop();
        isRecording = false;
        elements.recordButton.classList.remove('recording');
        elements.visualizer.classList.remove('active');
        elements.recordingStatus.classList.remove('active');
        visualizer.stopVisualization();
    }

    async function processAudio(audioBlob) {
        elements.loading.style.display = 'block';
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
            const response = await fetch('/process_audio', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            chatInterface.addMessage(data.transcription, 'user');
            chatInterface.addMessage(data.response, 'bot');
            
            const audio = new Audio(`/audio/${data.audio_file}`);
            audio.play();
        } catch (error) {
            console.error('Error:', error);
            ErrorHandler.showError('عندي مشكل. عاود من بعد.', elements.chatContainer);
        } finally {
            elements.loading.style.display = 'none';
        }
    }

    async function handleTextSubmit() {
        const text = elements.textInput.value.trim();
        if (!text) return;

        chatInterface.activateChat(elements.header);
        elements.loading.style.display = 'block';
        chatInterface.addMessage(text, 'user');
        elements.textInput.value = '';

        try {
            const response = await fetch('/process_text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            chatInterface.addMessage(data.response, 'bot');
        } catch (error) {
            console.error('Error:', error);
            ErrorHandler.showError('عندي مشكل. عاود من بعد.', elements.chatContainer);
        } finally {
            elements.loading.style.display = 'none';
        }
    }

    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            elements.sendText.click();
        }
    }

    // Initialize the application
    init();
}

export default initApp;