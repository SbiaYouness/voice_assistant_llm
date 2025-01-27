import os
from scipy.io import wavfile
from faster_whisper import WhisperModel

DEFAULT_MODEL_SIZE = "medium"

def transcribe_audio(file_path):
    """Transcribes an audio file using Whisper."""
    model = WhisperModel(DEFAULT_MODEL_SIZE, device="cpu", compute_type="int8", num_workers=2)
    
    segments, _ = model.transcribe(file_path, beam_size=7)
    transcription = ' '.join(segment.text for segment in segments)
    
    return transcription
