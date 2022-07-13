from flask import Flask, render_template, request, abort
from flask_restful import Api
from dotenv import load_dotenv
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
from env import TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET

app = Flask(__name__)
        
@app.route('/')
def index():
    return '<h1>Video Chat Room SESN</h1>'

@app.route('/meeting')
def meetingCreate():
    return render_template('index.html')

@app.route('/login', methods = ['POST'])
def login():
    username = request.get_json(force=True).get('username')
    if not username:
        abort(401)
    
    token = AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, identity=username)
    token.add_grant(VideoGrant(room='my_room'))
    
    return {'token': token.to_jwt()}

app.run(debug=True)