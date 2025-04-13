import os
import time
import streamlit as st
from audio_service import transcribe_audio  # [components/audio_service.py](components/audio_service.py)
from rag.AIVoiceAssistant import AIVoiceAssistant         # [ai/AIVoiceAssistant.py](ai/AIVoiceAssistant.py)
from voice_service import play_text_to_speech    # [components/voice_service.py](components/voice_service.py)

# Initialize chat history in session state
if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []

# Initialize the AI Voice Assistant
ai_assistant = AIVoiceAssistant()

def display_chat():
    chat_html = ""
    for entry in st.session_state.chat_history:
        sender = entry['sender']
        message = entry['message']
        chat_html += f"<p><strong>{sender}:</strong> {message}</p>"
    return chat_html

# Custom CSS for a scrollable chat area
st.markdown("""
    <style>
        .chat-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background-color: #f9f9f9;
            margin-bottom: 20px;
        }
    </style>
""", unsafe_allow_html=True)

st.title("AI Voice Assistant darija")
st.write("Chat with the AI assistant using text or audio.")

# Chat display area
st.markdown('<div class="chat-container">', unsafe_allow_html=True)
st.markdown(display_chat(), unsafe_allow_html=True)
st.markdown('</div>', unsafe_allow_html=True)

# Text chat section
text_input = st.text_input("Your Message:")
if st.button("Send Text"):
    if text_input.strip():
        st.session_state.chat_history.append({"sender": "User", "message": text_input})
        response = ai_assistant.interact_with_llm(text_input)
        st.session_state.chat_history.append({"sender": "Assistant", "message": response})
        st.rerun() 

# Audio chat section
audio_file = st.file_uploader("Upload Audio (wav or mp3)", type=["wav", "mp3"])
if st.button("Send Audio") and audio_file is not None:
    temp_path = os.path.join("uploads", f"temp_audio_{int(time.time())}.wav")
    with open(temp_path, "wb") as f:
        f.write(audio_file.read())
    
    # Transcribe and update chat with the transcription
    transcription = transcribe_audio(temp_path)
    os.remove(temp_path)
    st.session_state.chat_history.append({"sender": "User", "message": transcription})
    
    # Get AI response
    response = ai_assistant.interact_with_llm(transcription)
    st.session_state.chat_history.append({"sender": "Assistant", "message": response})
    
    # Generate response audio and provide an audio player
    audio_filename = f'response_{int(time.time())}.mp3'
    audio_path = os.path.join("uploads", audio_filename)
    play_text_to_speech(response, output_path=audio_path)
    
    st.audio(audio_path, format="audio/mp3")
    st.rerun()