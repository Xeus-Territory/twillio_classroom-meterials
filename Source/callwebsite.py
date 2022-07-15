from flask import Flask, jsonify, render_template, request, abort
from flask_restful import Api
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant, ChatGrant, SyncGrant
from env import TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_SYNC_SERVICE_SID

twillio_client = Client(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_ACCOUNT_SID)

app = Flask(__name__)

def get_chatroom(name):
    for conversation in twillio_client.conversations.conversations.stream():
        if conversation.friendly_name == name:
            return conversation
    
    return twillio_client.conversations.conversations.create(friendly_name=name)

        
@app.route('/')
def meetingCreate():
    return render_template('index.html')

@app.route('/login', methods = ['POST'])
def login():
    username = request.get_json(force=True).get('username')
    if not username:
        abort(401)
    
    conversation = get_chatroom("my_room")
    try:
        conversation.participants.create(identity=username)
    except TwilioRestException as e:
        if e.status != 409:
            raise
        
    token = AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, identity=username)
    token.add_grant(VideoGrant(room='my_room'))
    token.add_grant(ChatGrant(service_sid=conversation.chat_service_sid))
    
    return {'token': token.to_jwt(),
            'conversation_sid': conversation.sid}

@app.route('/whiteboard')
def whiteboard():
    return render_template('whiteboard.html')

@app.route('/token')
def generate_token():
    username = request.get_json(force=True).get('username')
    if not username:
        abort(401)
    
    token = AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, identity=username)
    token.add_grant(SyncGrant(service_sid=TWILIO_SYNC_SERVICE_SID))
    return jsonify(identity=username, token=token.to_jwt())

if __name__ == '__main__':
    app.run(debug=True)