import os
import time
from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
from rag.AIVoiceAssistant import AIVoiceAssistant
import voice_service as vs  # For text-to-speech
import audio_service as asr  # For audio transcription

app = Flask(__name__, static_folder='static')

# Activer CORS pour toutes les routes
CORS(app)

# Initialisation de l'assistant vocal
ai_assistant = AIVoiceAssistant()


@app.route('/') 
def index():
    """ 
    Route pour la page d'accueil. #commentaire
    """
    return render_template('index3.html')

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/process_audio', methods=['POST']) #
def process_audio():
    audio_file = request.files.get('audio')
    if not audio_file:
        return jsonify({"error": "Aucun fichier audio reçu."}), 400

    # Save temp file in uploads folder
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_audio_{int(time.time())}.wav")
    audio_file.save(temp_path)

    # Transcribe audio
    transcription = asr.transcribe_audio(temp_path)
    # os.remove(temp_path)

    # Get AI response
    response = ai_assistant.interact_with_llm(transcription)

    # Generate response audio in uploads folder
    audio_filename = f'response_{int(time.time())}.mp3'
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename)
    vs.play_text_to_speech(response, output_path=audio_path)

    return jsonify({
        "transcription": transcription,
        "response": response,
        "audio_file": audio_filename
    })

@app.route('/audio/<filename>')
def send_audio(filename):
    """Serve the generated audio file."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

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