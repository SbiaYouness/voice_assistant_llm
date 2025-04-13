# import os
# import time
# import pygame
# import requests
# from gtts import gTTS

# def play_text_to_speech(text, language='ar', slow=False, output_path=None):
#     tts = gTTS(text=text, lang=language, slow=slow)
    
#     # Use provided output path or default temp file
#     audio_file = output_path if output_path else "temp_audio.mp3"
#     tts.save(audio_file)
    
#     # Only play and remove if no custom output path
#     if not output_path:
#         pygame.mixer.init()
#         pygame.mixer.music.load(audio_file)
#         pygame.mixer.music.play()

#         while pygame.mixer.music.get_busy():
#             pygame.time.Clock().tick(10)

#         pygame.mixer.music.stop()
#         pygame.mixer.quit()

#         time.sleep(3)
#         os.remove(audio_file)

import os
import time
import pygame
import elevenlabs
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

# Load environment variables from .env
load_dotenv()

def play_text_to_speech(text, output_path=None):
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY environment variable not set.")

    # Debug logging to confirm key loading
    print("Sending request to ElevenLabs...")

    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    audio = client.generate(
        text=text,
        voice="Hamid",
        output_format="mp3_22050_32",
        model="eleven_multilingual_v2"
    )

    audio_file = output_path if output_path else "temp_audio_elevenlabs.mp3"
    elevenlabs.save(audio, audio_file)

    # Only play and remove if no custom output path
    if not output_path:
        pygame.mixer.init()
        pygame.mixer.music.load(audio_file)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)

        pygame.mixer.music.stop()
        pygame.mixer.quit()

        time.sleep(3)
        os.remove(audio_file)