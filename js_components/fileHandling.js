const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const audioDir = 'F:/podcasts/'

let folderFormat = () => {
    let showArr = fetchPodcastList()
    //create "temp" folder for mp3 splitting, and create default thumb if absent
    showArr.forEach(show => {
        let showDir  = audioDir + show
        let items = fs.readdirSync(showDir)
        if(!items.includes('temp')){
            try{fs.mkdirSync(showDir+'/temp')}
            catch (err) {
                console.log('error creating "temp" directory for' + show)
            }
        }
        if(!items.includes('thumb.jpg')){
            fs.copyFileSync('./public/images/default-thumb.jpg', audioDir + show + '/thumb.jpg')
        }
    })
}

let fetchEpisodeList = (podcast) => {
    let fileList = fs.readdirSync(audioDir + '/' + podcast + '/')
    let episodeList = fileList.filter(file => file !== 'thumb.jpg')
    return episodeList
}

let fetchPodcastList = () => {
    let audioDirArr = fs.readdirSync(audioDir)
    const showArr = audioDirArr.filter(element => {
        const itemPath = `${audioDir}/${element}`
        const stat = fs.statSync(itemPath)
        
        return stat.isDirectory()
    })
    return showArr
}

let secondsToMinutes = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    let minObj = {mins: minutes, secs: remainingSeconds < 10 ? '0' : '' + remainingSeconds}
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`
}

let queryDuration = (filePath) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve({min:secondsToMinutes(metadata.format.duration), 
                   sec: Math.floor(metadata.format.duration)})
        }
      })
    })
}

let splitFile = async (filePath) => {
    const trackDuration = await queryDuration(filePath)
    const segmentDuration = 3
    let showPath = filePath.split('/')
    showPath.splice(showPath.length-1, 1)
    let tempPath = showPath.join('/') + '/temp/'
    let ff = 
    ffmpeg()
        .input(filePath)
        .outputOptions('-f segment')
        .outputOptions(`-segment_time ${segmentDuration}`)
        .outputOptions('-reset_timestamps 1')
        .output(tempPath + 'output%d.mp3')
        .on('end', () => {
            console.log('Splitting finished.');
        })
        .on('error', (err) => {
            console.error('Error:', err);
        })

        ff.on('progress', (progress) => {
            // Extract the segment index from the target name
            // const match = progress.target.match(/output(\d+)\.mp3/);
            // if (match) {
            //   const segmentIndex = match[1];
            //   console.log(`Segment ${segmentIndex} saved at ${progress.timemark}`);
            // }
        })
          
        ff.run()
}

folderFormat()

module.exports = {
    fetchEpisodeList,
    fetchPodcastList,
    splitFile,
    audioDir
}