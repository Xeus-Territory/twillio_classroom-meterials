const root = document.getElementById('root');
const usernameInput = document.getElementById('username');
const button = document.getElementById('join_leave');
const shareScreen = document.getElementById('share_screen');
const toggleChat = document.getElementById('toggle_chat');
const container = document.getElementById('container');
const count = document.getElementById('count');
const chatScroll = document.getElementById('chat-scroll');
const chatContent = document.getElementById('chat-content');
const chatInput = document.getElementById('chat-input');
const muteAudio = document.getElementById('mute-audio');
const stopVideo = document.getElementById('stop-video');
let connected = false;
let room;
let chat;
let conv;
let screenTrack;

// create the video call with other people

const addLocalVideo = async () => {
  const track = await Twilio.Video.createLocalVideoTrack();
  const video = document.getElementById('local').firstChild;
  var trackElement = track.attach();
  trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
  video.appendChild(trackElement);
};

const connectButtonHandler = async () => {
  event.preventDefault();
  if (!connected) {
    const username = usernameInput.value;
    if (!username) {
      alert("Enter your name before connecting");
      return;
    }
    button.disabled = true;
    button.innerHTML = "Connecting...";
    try {
      await connect(username);
      button.innerHTML = "Leave call";
      button.disabled = false;
      shareScreen.disabled = false;
    }
    catch
    {
      alert('Connection failed. Is the backend running?');
      button.innerHTML = 'Join call';
      button.disabled = false;
    }
  }
  else {
    disconnect();
    button.innerHTML = "Join call";
    shareScreen.innerHTML = "Share screen";
    shareScreen.disabled = true;
    connected = false;
  }
};

const connect = async (username) => {
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'username': username }),
  });
  const data = await response.json();
  room = await Twilio.Video.connect(data.token);
  room.participants.forEach(participantConnected);
  room.on('participantConnected', participantConnected);
  room.on('participantDisconnected', participantDisconnected);
  connected = true;
  updateParticipantCount();
};

const updateParticipantCount = () => {
  if (!connected) {
    count.innerHTML = 'Disconnected.';
  }
  else {
    count.innerHTML = (room.participants.size + 1) + ' participants online.';
  }
};

const participantConnected = (participant) => {
  const participantDiv = document.createElement('div');
  participantDiv.setAttribute('id', participant.sid);
  participantDiv.setAttribute('class', 'participant');

  const tracksDiv = document.createElement('div');
  participantDiv.appendChild(tracksDiv);

  const labelDiv = document.createElement('div');
  labelDiv.setAttribute('class', 'label');
  labelDiv.innerHTML = participant.identity;
  participantDiv.appendChild(labelDiv);

  container.appendChild(participantDiv);

  participant.tracks.forEach(publication => {
    if (publication.isSubscribed) {
      trackSubscribed(tracksDiv, publication.track);
    }
  });
  participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
  participant.on('trackUnsubscribed', trackUnsubscribed);
  updateParticipantCount();
};

const participantDisconnected = (participant) => {
  document.getElementById(participant.sid).remove();
  updateParticipantCount();
};

const trackSubscribed = (div, track) => {
  var trackElement = track.attach();
  trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
  div.appendChild(trackElement);
};

const trackUnsubscribed = (track) => {
  track.detach().forEach(element => {
    if (element.classList.contains('participantZoomed')) {
      zoomTrack(element);
    }
    element.remove()
  });
};

const disconnect = () => {
  room.disconnect();
  while (container.lastChild.id != 'local') {
    container.removeChild(container.lastChild);
  }
  button.innerHTML = 'Join call';
  connected = false;
  updateParticipantCount();
};

// Share the screen with the participants
const shareScreenHandler = () => {
  event.preventDefault();
  if (!screenTrack) {
    navigator.mediaDevices.getDisplayMedia().then(stream => {
      screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
      room.localParticipant.publishTrack(screenTrack);
      shareScreen.innerHTML = "Stop sharing screen";
      screenTrack.mediaStreamTrack.onened = () => { shareScreenHandler() };
    }).catch(() => {
      alert('Could not share screen');
    });
  }
  else {
    room.localParticipant.unpublishTrack(screenTrack);
    screenTrack.stop();
    screenTrack = null;
    shareScreen.innerHTML = "Share screen";
  }
}

// Zoom Track Events for Screen Share
const zoomTrack = (trackElement) => {
  if (!trackElement.classList.contains('participantZoomed')) {
    // Zoom in 
    container.childNodes.forEach(participant => {
      if (participant.className == 'participant') {
        participant.childNodes[0].childNodes.forEach(track => {
          if (track === trackElement) {
            track.classList.add('participantZoomed');
          }
          else {
            track.classList.add('participantHidden');
          }
        });
        participant.childNodes[1].classList.add('participantHidden');
      }
    });
  }
  else {
    // Zoom out
    container.childNodes.forEach(participant => {
      if (participant.className == 'participant') {
        participant.childNodes[0].childNodes.forEach(track => {
          if (track === trackElement) {
            track.classList.remove('participantZoomed');
          }
          else {
            track.classList.remove('participantHidden');
          }
        });
        participant.childNodes[1].classList.remove('participantHidden');
      }
    });
  }
}

const muteHandler = () => {
  event.preventDefault();
  try {
    console.log(room.localParticipant);
    room.localParticipant.audioTracks.forEach(track => {
      track.track.disable();
    });
    muteAudio.value = "Muted";
  }catch (e) {
    alert("Error: " + e.message);
  }
};

const videoHandler = () => {
  event.preventDefault();
  try {
    room.localParticipant.videoTracks.forEach(track => {
      track.track.stop();
      track.unpublish();
    });
  }catch (e) {
    alert("Error: " + e.message); 
  }
}

// Do this function 

addLocalVideo();
button.addEventListener('click', connectButtonHandler);
shareScreen.addEventListener('click', shareScreenHandler);
muteAudio.addEventListener('click', muteHandler);
stopVideo.addEventListener('click', videoHandler);
