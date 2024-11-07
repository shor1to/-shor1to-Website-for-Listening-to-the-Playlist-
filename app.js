const API_KEY = 'AIzaSyAf3pLMRWfa3ZaTNk4e9Tbv7mUr1h2QNb8';
let PLAYLIST_ID = 'PL0QFwxFJGzHKIMRsLmcF_burLpMD0BXoS';

let loadPlaylistTimeout;
let trackList = [];
let currentTrackIndex = 0;
let player;
let trackInterval;

const playlistInput = document.getElementById('playlist-id');

playlistInput.addEventListener('input', function () {
    clearTimeout(loadPlaylistTimeout);

    loadPlaylistTimeout = setTimeout(() => {
        const userPlaylistId = playlistInput.value.trim();
        PLAYLIST_ID = userPlaylistId || PLAYLIST_ID;
        getPlaylistItems();
    }, 2000);
});

function loadClient() {
    gapi.client.setApiKey(API_KEY);
    return gapi.client.load('https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest');
}

function getPlaylistItems() {
    return gapi.client.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: PLAYLIST_ID,
        maxResults: 100
    }).then(function(response) {
        trackList = response.result.items;
        const trackListElement = document.getElementById('track-list');
        trackListElement.innerHTML = '';

        trackList.forEach((item, index) => {
            const track = document.createElement('li');
            track.className = 'track-item';
            track.textContent = item.snippet.title;
            track.onclick = () => playTrack(index);
            trackListElement.appendChild(track);
        });

        if (trackList.length > 0) {
            playTrack(currentTrackIndex);
        }
    });
}

function playTrack(index) {
    clearInterval(trackInterval);
    
    const videoId = trackList[index].snippet.resourceId.videoId;
    const playerIframe = document.getElementById('player');
    playerIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    
    document.getElementById('track-name').textContent = trackList[index].snippet.title;
    currentTrackIndex = index;

    setTimeout(() => {
        const duration = player.getDuration();
        document.getElementById('seek-bar').max = duration;
        document.getElementById('duration-time').textContent = formatTime(duration);

        trackInterval = setInterval(updateSeekBarAndTime, 1000);
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateSeekBarAndTime() {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    document.getElementById('seek-bar').value = currentTime;
    document.getElementById('current-time').textContent = formatTime(currentTime);
    document.getElementById('duration-time').textContent = formatTime(duration);
}

function onYouTubePlayerAPIReady() {
    player = new YT.Player('player', {
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        clearInterval(trackInterval);
        trackInterval = setInterval(updateSeekBarAndTime, 1000);
    } else if (event.data === YT.PlayerState.ENDED) {
        if (currentTrackIndex < trackList.length - 1) {
            playTrack(currentTrackIndex + 1);
        } else {
            clearInterval(trackInterval);
        }
    }
}

document.getElementById('prev').onclick = () => {
    if (currentTrackIndex > 0) playTrack(currentTrackIndex - 1);
};

document.getElementById('next').onclick = () => {
    if (currentTrackIndex < trackList.length - 1) playTrack(currentTrackIndex + 1);
};

document.getElementById('play-pause').onclick = function() {
    if (player && player.getPlayerState) {
        const playerState = player.getPlayerState();
        if (playerState === 1) {
            player.pauseVideo();
            document.getElementById('play-pause').textContent = '▶';
        } else if (playerState === 2) {
            player.playVideo();
            document.getElementById('play-pause').textContent = '❚❚';
        }
    }
};

document.getElementById('seek-bar').addEventListener('input', function(event) {
    const value = event.target.value;
    player.seekTo(value);
});

document.getElementById('volume-bar').addEventListener('input', function(event) {
    const volume = event.target.value / 100;
    if (player && player.setVolume) {
        player.setVolume(volume * 100);
    }
});

gapi.load('client', loadClient);
window.onload = getPlaylistItems;

function loadAPI() {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
}

loadAPI();
