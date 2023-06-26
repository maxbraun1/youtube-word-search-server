import express from 'express'
import mongoose from 'mongoose'
import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'
import bodyParser from 'body-parser';
import { YoutubeTranscript } from 'youtube-transcript';
import searchModel from './models/searchModel.js';
import { getSubtitles } from 'youtube-caption-extractor';
const app = express()

dotenv.config();

await mongoose.connect(process.env.MONGO_DB_URI);

app.use(cors())

app.use(bodyParser.json())

app.get('/getPopular', async (req, res) => {
    try {
        let popularSearches = await searchModel.find().sort({'searchCount': 'desc'}).limit(6);
        res.json(popularSearches);
    } catch (err) {
        res.send("Error retrieving popular searches.");
    }
});

app.post('/getCaptions', async (req, res) => {
    let videoID = req.body.id;
    let lang = 'en';
    console.log(req.body.id);
    await getSubtitles({ videoID, lang })
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
                    let newWord = { word: word, count: 1, locations : [ { offset: item.start, phrase: item.text }]}
                    words.push(newWord);
                }else{
                    // word is already in array
                    let wordIndex = words.findIndex(item => item.word == word);
                    words[wordIndex].count++;
                    words[wordIndex].locations.push({ offset: item.start, phrase: item.text });
                }
            })
        });

        // sort words by most used
        words = words.sort((a, b) => b.count - a.count);

        // Get other info about video

        let videoDetails = await axios.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + videoID + "&key=" + process.env.YT_API_KEY).then((response) => {
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

        // Add Search to Database
        // Check if video has already been searched for
        await searchModel.find({
            videoID: videoID
        }).then(async (doc) => {
            if(doc.length != 0){
                // Add 1 to searchCount
                await searchModel.findOneAndUpdate({ videoID: videoID }, {
                    $inc : {'searchCount' : 1}
                })
            }else{
                // if not, add search to database
                const newRequest = new searchModel({
                    videoID: videoID,
                    videoTitle: response.videoInfo.title,
                    videoThumbnail: response.videoInfo.thumbnail,
                    videoChannel: response.videoInfo.channel,
                    videoURL: req.body.url,
                    searchCount: 1
                });
        
                await newRequest.save();
            }
        });

        // Send Response

        res.send(response);
    })
    .catch((error) => {
        res.status(500);
        console.log(error);
        res.send("Captions cannot be found for this video...");
    });
});

app.listen(3000);