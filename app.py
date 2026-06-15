import os
import time
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_cors import CORS

import audio_service as asr
import voice_service as vs
from rag.AIVoiceAssistant import AIVoiceAssistant

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

app = Flask(__name__, static_folder="static")
app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)

CORS(app)

ai_assistant = AIVoiceAssistant()


@app.route('/') 
def index():
    """ 
    Route pour la page d'accueil. #commentaire
    """
    return render_template('index.html')

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "rag_context": ai_assistant.context_name,
    })


@app.route('/process_audio', methods=['POST']) #
def process_audio():
    audio_file = request.files.get('audio')
    if not audio_file:
        return jsonify({"error": "Aucun fichier audio reçu."}), 400

    # Save temp file in uploads folder
    temp_path = os.path.join(app.config["UPLOAD_FOLDER"], f"temp_audio_{int(time.time())}.wav")
    audio_file.save(temp_path)

    # Transcribe audio
    transcription = asr.transcribe_audio(temp_path)
    # os.remove(temp_path)

    # Get AI response
    response = ai_assistant.interact_with_llm(transcription)

    # Generate response audio in uploads folder
    audio_filename = f'response_{int(time.time())}.mp3'
    audio_path = os.path.join(app.config["UPLOAD_FOLDER"], audio_filename)
    vs.play_text_to_speech(response, output_path=audio_path)

    return jsonify({
        "transcription": transcription,
        "response": response,
        "audio_file": audio_filename
    })

@app.route('/audio/<filename>')
def send_audio(filename):
    """Serve the generated audio file."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, mimetype='audio/mpeg')

@app.route('/process_text', methods=['POST'])
def process_text():
    """
    Route pour traiter les requêtes textuelles.
    """
    user_input = request.json.get('text')
    if not user_input:
        return jsonify({"error": "Aucune entrée textuelle reçue."}), 400

    # Obtenez une réponse de l'IA
    response = ai_assistant.interact_with_llm(user_input)

    # Réponse sous forme JSON
    return jsonify({
        "response": response
    })

if __name__ == '__main__':
    app.run(debug=True)