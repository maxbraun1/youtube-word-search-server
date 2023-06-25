import mongoose from "mongoose";

const searchSchema = new mongoose.Schema({
  videoID: {
    type: String,
    required: true
  },
  videoTitle: {
    type: String,
    required: true
  },
  videoThumbnail: {
    type: String,
    required: true
  },
  videoChannel: {
    type: String,
    required: true
  },
  videoURL: {
    type: String,
    required: true
  },
  searchCount: {
    type: Number,
    default: 1
  }
});

const Search = mongoose.model('searches', searchSchema);

export default Search;