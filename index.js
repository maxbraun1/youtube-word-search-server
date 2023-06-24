import express from 'express'
import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'
import bodyParser from 'body-parser';
import { YoutubeTranscript } from 'youtube-transcript';
const app = express()

dotenv.config();

app.use(cors())

app.use(bodyParser.json())

app.post('/getCaptions', async function (req, res) {
    let id = req.body.id;
    console.log(req.body.id);
    await YoutubeTranscript.fetchTranscript(id)
    .then( async (results) => {
    
        let words = [];
        let wordCount = 0;
    
        // count words
        results.map((item) => {
            let itemWords = item.text.split(" ");
            itemWords.map((word) => {
                wordCount++;
                if(words.find(item => item.word == word) == undefined){
                    // word is not in array yet
                    let newWord = { word: word, count: 1, locations : [ { offset: item.offset, phrase: item.text }]}
                    words.push(newWord);
                }else{
                    // word is already in array
                    let wordIndex = words.findIndex(item => item.word == word);
                    words[wordIndex].count++;
                    words[wordIndex].locations.push({ offset: item.offset, phrase: item.text });
                }
            })
        });

        // sort words by most used
        words = words.sort((a, b) => b.count - a.count);

        // Get other info about video

        let videoDetails = await axios.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + id + "&key=" + process.env.YT_API_KEY).then((response) => {
            //console.log(response.data.items[0].snippet);
            return response.data.items[0].snippet;
        });

        var title = videoDetails.localized.title;
        var thumbnail = videoDetails.thumbnails.medium.url;
        var channel = videoDetails.channelTitle;

        var response = {
            words: words,
            videoInfo: {
                title: title,
                thumbnail: thumbnail,
                channel: channel,
                wordCount: wordCount
            }
        }

        res.send(response);
    })
    .catch((error) => {
        res.status(500);
        console.log(error);
        res.send("Captions cannot be found for this video...");
    });
});

app.listen(3000);