import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser';
import { YoutubeTranscript } from 'youtube-transcript';
const app = express()

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.post('/getCaptions', async function (req, res) {
    let id = req.body.id;
    console.log(req.body.id);
    await YoutubeTranscript.fetchTranscript(id)
    .then((results) => {

        console.log(results.length);
    
        let words = [];

        results.map((item) => {
            let itemWords = item.text.split(" ");
            itemWords.map((word) => {
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
        })

        // sort words by most used
        words = words.sort((a, b) => b.count - a.count);

        res.send(words);
    })
    .catch((error) => {
        res.status(500);
        console.log(error);
        res.send("Captions cannot be found for this video...");
    });
})

app.listen(3000)