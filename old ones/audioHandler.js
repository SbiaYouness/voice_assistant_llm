class AudioHandler {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }

    async initialize() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            });

            return true;
        } catch (err) {
            console.error('Microphone error:', err);
            return false;
        }
    }

    startRecording(onDataAvailable) {
        this.audioChunks = [];
        this.mediaRecorder.ondataavailable = onDataAvailable;
        this.mediaRecorder.start(100);
        this.isRecording = true;
    }

    stopRecording() {
        this.mediaRecorder.stop();
        this.isRecording = false;
    }

    getStream() {
        return this.stream;
    }
}

export default AudioHandler;