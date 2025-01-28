class Visualizer {
    constructor(mediaStream) {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaStreamSource(mediaStream);
        this.source.connect(this.analyser);
    }

    startVisualization() {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        const draw = () => {
            requestAnimationFrame(draw);
            this.analyser.getByteTimeDomainData(dataArray);
            
            const bars = document.querySelectorAll('.audio-bar');
            bars.forEach((bar, i) => {
                const value = dataArray[i * 10] / 128.0;
                const height = value * 40;
                bar.style.height = `${height}px`;
            });
        };
        
        draw();
    }

    stopVisualization() {
        const bars = document.querySelectorAll('.audio-bar');
        bars.forEach(bar => bar.style.height = '5px');
    }
}

export default Visualizer;