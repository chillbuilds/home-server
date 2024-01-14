let selectedPodcast = ''

let obj = {
    show: 'Womp It Up!',
    ep: '79 - Teachers Lounge',
    currentTime: '0'
}

let fetchEpisode = (episode, startTime) => {
    let file = selectedPodcast + '/' + episode + '.mp3'
    console.log(file)
    fetch('/send-podcast', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: file
    }).then((data) => {
        console.log(data)
        $('#audio-player').attr('src', '/fetch-podcast')
        if(startTime != '0'){
            $('#audio-player').prop('currentTime', startTime)
        }
        $('#audio-player').trigger('play')
        $('#play').attr('style', 'display: none;')
        $('#pause').attr('style', 'display: inline-block;')
        updateCurrentTrack(file)
      }).catch((error) => {
        console.log(error)
      })
}

let fetchEpisodeList = (podcast) => {
    fetch('/episode-list', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: podcast
    }).then(response => response.json())
    .then(data => {
        buildEpisodeView(data)
    })
}

let fetchPodcastList = () => {
    fetch('/podcast-list', {
        method: 'GET'
    }).then(response => response.json())
    .then(data => {
        buildPodcastView(data)
    })
}

let fetchThumbnail = (podcast) => {
    fetch('/thumbnail', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: podcast
    }).then(response => response.blob())
    .then(blob => {
        const imageUrl = URL.createObjectURL(blob)
        $(`.podcast[name="${podcast}"]`).find('img.icon').attr('src', imageUrl)
    })
}

let fetchEpThumbnail = (podcast) => {
    fetch('/thumbnail', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: podcast
    }).then(response => response.blob())
    .then(blob => {
        const imageUrl = URL.createObjectURL(blob)
        $('#thumb-img').attr('src', imageUrl)
        let currentTrack = localStorage.getItem('current-track')
        let formattedTrackName = currentTrack.split('/')[1].split('.mp3').join('')
        if(currentTrack != '' && currentTrack != undefined){
            $('#audio-controls-container').attr('style', 'display:inline-block;')
            $('#current-track').text(formattedTrackName)
            $('#current-track').css({
                'white-space': 'nowrap',
                'overflow': 'hidden',
                'text-overflow': 'ellipsis'
            })
        }
    })
}

let updateCurrentTrack = (track) => {
    localStorage.setItem('current-track', track)
    let formattedTrackName = track.split('/')[1].split('.mp3').join('')
    console.log(formattedTrackName)
    $('#current-track').text(formattedTrackName.split('.mp3').join(''))
    $('#current-track').css({
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'text-overflow': 'ellipsis'
    })
    fetchEpThumbnail(track.split('/')[0])
}

let buildPodcastView = (podcasts) => {
    $('#podcast-list').attr('style', 'margin-bottom:200px;')
    podcasts.forEach(podcast => {
        $('#podcast-list').append(`
            <div class="podcast" name="${podcast}">
                <img class="icon">
            </div>
        `)
        fetchThumbnail(podcast)
    })
    $('.podcast').on('click', function() {
        selectedPodcast = $(this).attr('name')
        fetchEpisodeList($(this).attr('name'))
    })
    let currentTrack = localStorage.getItem('current-track')
    let currentTrackTime = localStorage.getItem('current-track-time')
    if(currentTrack != '' && currentTrack != undefined && currentTrackTime != '' && currentTrackTime != undefined){
        fetchEpThumbnail(currentTrack.split('/')[0])
        let trackDuration = localStorage.getItem('current-track-duration')
        // to-do get track time instead of pulling from audio player before track is loaded
        $('#audio-slider').val(currentTrackTime / trackDuration * 100)
    }
}

let buildEpisodeView = (episodes) => {
    $('#audio-controls-container').attr('style', 'display: inline-block;')
    $('#podcast-list').html(``)
    episodes.forEach(episode => {
        let episodeName = episode.split('.mp3').join('')
        $('#podcast-list').append(`
            <div class="episode">${episodeName}</div>
        `)
    })
    $('.episode').on('click', function() {
        updateCurrentTrack(selectedPodcast + '/' + $(this).text())
        fetchEpisode($(this).text(), 0)
    })
    let currentTrack = localStorage.getItem('current-track')
    if(currentTrack != '' && currentTrack != undefined){
        updateCurrentTrack(currentTrack)
    }
}

let convertSeconds = (seconds) => {
    var hours = Math.floor(seconds / 3600)
    var minutes = Math.floor((seconds % 3600) / 60)
    var remainingSeconds = seconds % 60
    var formattedHours = hours.toString().padStart(2, '0');
    var formattedMinutes = minutes.toString().padStart(2, '0');
    var formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    return {
        hours: formattedHours,
        minutes: formattedMinutes,
        seconds: formattedSeconds
    }
}

$('#pause').on('click', function() {
    // const audioPlayer = $('#audio-player')[0]
    // audioPlayer.pause()
    $('#audio-player').trigger('pause')
    $('#pause').attr('style', 'display: none;')
    $('#play').attr('style', 'display: inline-block;')
})

$('#play').on('click', function() {
    let audioSrc = $('#audio-player').attr('src')
    let currentTrack = localStorage.getItem('current-track')
    if(audioSrc == undefined && currentTrack != '' && currentTrack != undefined){
        selectedPodcast = currentTrack.split('/')[0]
        fetchEpisode(currentTrack.split('/')[1].split('.mp3').join(''), localStorage.getItem('current-track-time'))
    }
    $('#audio-player').trigger('play')
    $('#play').attr('style', 'display: none;')
    $('#pause').attr('style', 'display: inline-block;')
})

$('#skip-back').on('click', function() {
    const audioPlayer = $('#audio-player')[0]
    audioPlayer.currentTime = audioPlayer.currentTime - 15
    // const currentTime = audioPlayer.currentTime 
})

$('#skip-forward').on('click', function() {
    const audioPlayer = $('#audio-player')[0]
    audioPlayer.currentTime = audioPlayer.currentTime + 30
    // const currentTime = audioPlayer.currentTime 
})

$(document).ready(function() {

    $(window).on('beforeunload', function(e) {
        // You can also return null or undefined to show the default browser confirmation message
        fetch('/close-stream', {
            method: 'GET'
        }).then(response => response.json())
        .then(data => {
            console.log(data)
        })
    })

    const audioPlayer = $('#audio-player')[0]

    // Add event listener for play event
    audioPlayer.addEventListener('play', function() {
        $('#play').attr('style', 'display: none;')
        $('#pause').attr('style', 'display: inline-block;')
    })

    // Add event listener for pause event
    audioPlayer.addEventListener('pause', function() {
        $('#pause').attr('style', 'display: none;')
        $('#play').attr('style', 'display: inline-block;')
    })

    audioPlayer.addEventListener('ended', function() {
        localStorage.setItem('current-track', '')
        localStorage.setItem('current-track-time', '0')
    })

    audioPlayer.addEventListener('timeupdate', () => {
        localStorage.setItem('current-track-time', audioPlayer.currentTime)
        $('#audio-slider').val(audioPlayer.currentTime / audioPlayer.duration * 100)
        let trackTime = convertSeconds(parseInt(audioPlayer.currentTime))
        trackTime = trackTime.hours + ':' + trackTime.minutes + ':' + trackTime.seconds
        $('#currentTime').text(trackTime)
    })

    audioPlayer.addEventListener("loadedmetadata", function() {
        let trackTime = convertSeconds(parseInt(audioPlayer.duration))
        trackTime = trackTime.hours + ':' + trackTime.minutes + ':' + trackTime.seconds
        $('#trackDuration').text(' / ' + trackTime)
        localStorage.setItem('current-track-duration', audioPlayer.duration)
    })

    $('#audio-slider').on('input', function() {
        audioPlayer.currentTime = (this.value / 100) * audioPlayer.duration
    })
})

fetchPodcastList()