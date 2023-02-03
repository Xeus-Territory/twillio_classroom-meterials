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
    let username = usernameInput.value;
    if (!username) {
      alert('Enter your name before connecting');
      return;
    }
    button.disabled = true;
    button.innerHTML = 'Connecting...';
    connect(username).then(() => {
      button.innerHTML = 'Leave call';
      button.disabled = false;
      shareScreen.disabled = false;
    }).catch(() => {
      alert('Connection failed. Is the backend running?');
      button.innerHTML = 'Join call';
      button.disabled = false;
    });
  }
  else {
    disconnect();
    button.innerHTML = 'Join call';
    connected = false;
    shareScreen.innerHTML = 'Share screen';
    shareScreen.disabled = true;
  }
};

const connect = async (username) => {
  let promise = new Promise((resolve, reject) => {
    // get a token from the back end
    let data;
    fetch('/login', {
      method: 'POST',
      body: JSON.stringify({ 'username': username })
    }).then(res => res.json()).then(_data => {
      // join video call
      data = _data;
      return Twilio.Video.connect(data.token);
    }).then(_room => {
      room = _room;
      room.participants.forEach(participantConnected);
      room.on('participantConnected', participantConnected);
      room.on('participantDisconnected', participantDisconnected);
      connected = true;
      updateParticipantCount();
      connectChat(data.token, data.conversation_sid);
      openWhiteboard();
      resolve();
    }).catch(e => {
      console.log(e);
      reject();
    });
  });
  return promise;
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
  if (chat) {
    chat.shutdown().then(() => {
      conv = null;
      chat = null;
    });
  }
  while (container.lastChild.id != 'local') {
    container.removeChild(container.lastChild);
  }
  button.innerHTML = 'Join call';
  if (root.classList.contains('withChat')) {
    root.classList.remove('withChat');
  }
  toggleChat.disabled = true;
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
  if (!trackElement.classList.contains('trackZoomed')) {
    // zoom in
    container.childNodes.forEach(participant => {
      if (participant.classList && participant.classList.contains('participant')) {
        let zoomed = false;
        participant.childNodes[0].childNodes.forEach(track => {
          if (track === trackElement) {
            track.classList.add('trackZoomed')
            zoomed = true;
          }
        });
        if (zoomed) {
          participant.classList.add('participantZoomed');
        }
        else {
          participant.classList.add('participantHidden');
        }
      }
    });
  }
  else {
    // zoom out
    container.childNodes.forEach(participant => {
      if (participant.classList && participant.classList.contains('participant')) {
        participant.childNodes[0].childNodes.forEach(track => {
          if (track === trackElement) {
            track.classList.remove('trackZoomed');
          }
        });
        participant.classList.remove('participantZoomed')
        participant.classList.remove('participantHidden')
      }
    });
  }
};

// The media Controls

const muteHandler = () => {
  event.preventDefault();
  try {
    if (muteAudio.value == 'enable') {
      console.log(room.localParticipant);
      room.localParticipant.audioTracks.forEach(track => {
        track.track.disable();
      });
      muteAudio.value = "disable";
      muteAudio.innerHTML = "unMute";
    }
    else {
      console.log(room.localParticipant);
      room.localParticipant.audioTracks.forEach(track => {
        track.track.enable();
      });
      muteAudio.value = "enable";
      muteAudio.innerHTML = "Mute";
    }
  } catch (e) {
    alert("Error: " + e.message);
  }
};

const videoHandler = () => {
  event.preventDefault();
  try {
    if (stopVideo.value == 'enable') {
      room.localParticipant.videoTracks.forEach(track => {
        track.track.disable();
      });
      stopVideo.value = "disable";
      stopVideo.innerHTML = "Turn on";
    }
    else {
      room.localParticipant.videoTracks.forEach(track => {
        track.track.enable();
      });
      stopVideo.value = "enable";
      stopVideo.innerHTML = "Turn off";
    }
  } catch (e) {
    alert("Error: " + e.message);
  }
}

// Chat Function
const connectChat = (token, conversation_sid) => {
  return Twilio.Conversations.Client.create(token).then(_chat => {
    chat = _chat;
    return chat.getConversationBySid(conversation_sid).then((_conv) => {
      conv = _conv;
      conv.on('messageAdded', (message) => {
        addMessageToChat(message.author, message.body);
      });
      return conv.getMessages().then((messages) => {
        chatContent.innerHTML = '';
        for (let i = 0; i < messages.items.length; i++) {
          addMessageToChat(messages.items[i].author, messages.items[i].body);
        }
        toggleChat.disabled = false;
      });
    });
  }).catch(e => {
    console.log(e);
  });
};

const addMessageToChat = (user, message) => {
  chatContent.innerHTML += `<p><b>${user}</b>: ${message}`;
  chatScroll.scrollTop = chatScroll.scrollHeight;
};

const toggleChatHandler = () => {
  event.preventDefault();
  if (root.classList.contains('withChat')) {
    root.classList.remove('withChat');
  }
  else {
    root.classList.add('withChat');
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }
};

const onChatInputKey = (ev) => {
  if (ev.keyCode == 13 && chatInput.value != '') {
    conv.sendMessage(chatInput.value);
    chatInput.value = '';
  }
};

// Open Whiteboard in other window
const openWhiteboard = () => {
  window.open('whiteboard', '_blank');
};

// Do this function 

addLocalVideo();
button.addEventListener('click', connectButtonHandler);
shareScreen.addEventListener('click', shareScreenHandler);
muteAudio.addEventListener('click', muteHandler);
stopVideo.addEventListener('click', videoHandler);
toggleChat.addEventListener('click', toggleChatHandler);
chatInput.addEventListener('keyup', onChatInputKey);
