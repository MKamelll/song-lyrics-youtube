//dependecies
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const readl = require('readline-sync');
require('dotenv').config();

//vars
const titleUrl = 'https://www.googleapis.com/youtube/v3/videos?';
const geniusUrl = 'https://genius.com/';
let artistName, songName;

//get user input for video link
(function userInput() {
  let rawLink = readl.question('Enter Video Link: ');
  if (rawLink != '') {
    getVideoTitle(rawLink);
  } else {
    console.log('Please Enter A Valid Link!');
    let checkKey = readl.keyIn('Jump To Manual Search ? (y/n) ', {
      limit: 'yn'
    });
    if (checkKey == 'y') {
      getData();
    } else {
      userInput();
    }
  }
})();

// fetch the title
function getVideoTitle(rawLink) {
  //get id from youtube video link
  const id = rawLink.match(/=(\w+)&?/)[1];

  const reqBody = {
    'part': 'snippet',
    'id': id,
    'key': process.env.YOUTUBEID
  };

  // compose youtube link to fetch
  // prettier-ignore
  const reqLink = `${titleUrl}part=${reqBody.part}&id=${reqBody.id}&key=${reqBody.key}`;

  fetch(reqLink)
    .then(response => response.json())
    .then(data => {
      const title = data.items[0].snippet.localized.title;
      composeSearch(title);
    })
    .catch(e => console.log(e));
}

// making the search term with the dashes in it
function composeSearch(title) {
  title = title.toLowerCase();
  for (let i = 0; i < title.length; i++) {
    if (title[i] === '(') {
      //remove all things after (
      title = title.substr(0, title.indexOf('('));
    } else if (title[i] === '[') {
      //remove all things after [
      title = title.substr(0, title.indexOf('['));
    } else if (title[i] === '&') {
      title = title.replace(/&/g, 'and');
      // well sometimes you gotta do dumb stuff to make it work
    } else if (title.includes('superfly')) {
      title = title.replace(/superfly/g, 'super fly');
    } else if (title[i] === '|') {
      title = title.substr(0, title.indexOf('|'));
    }
  }

  //solving characters and multiple spaces
  searchTerm = editInput(title);

  console.log(searchTerm);
  getLyrics(searchTerm);
}

// genius scraping lyrics
function getLyrics(searchTerm) {
  const url = geniusUrl + searchTerm + '-' + 'lyrics';

  return fetch(url)
    .then(response => response.text())
    .then(data => {
      const $ = cheerio.load(data);
      lyrics = $('.lyrics')
        .text()
        .trim();
      checkForLyrics(lyrics);
      return true;
    })
    .catch(e => console.log(e));
}

// checking if getlyrics returned something or not
function checkForLyrics(lyrics) {
  if (lyrics) {
    // some styling for the terminal
    console.log('                    ');
    console.log('####################');
    console.log('                    ');
    console.log(lyrics);
    console.log('                    ');
    console.log('####################');
    console.log('                    ');
  } else if (!lyrics) {
    console.log('No Lyrics Available!');
    getData();
  }
}

// asking user for maual input and making a new search term
function getData() {
  console.log('-----Try Manual Search-----');
  let answer1 = readl.question('Enter Artist Name: ');
  let answer2 = readl.question('Enter Song Name: ');
  if (answer1 != '' && answer2 != '') {
    artistName = ' ' + answer1.toLowerCase() + ' ';
    songName = ' ' + answer2.toLowerCase() + ' ';
    searchTerm = artistName + songName;
    searchTerm = editInput(searchTerm);
    console.log(searchTerm);
    getLyrics(searchTerm);
  } else {
    console.log('Not Valid');
    exitKey = readl.keyIn('Do You Want To Exit? (y/n) ', { limit: 'yn' });
    if (exitKey == 'y') {
      return true;
    } else {
      getData();
    }
  }
}

// edit the title to be genius searchable
function editInput(input) {
  return input
    .trim()
    .replace(/"/g, '')
    .replace(/in'/g, 'ing')
    .replace(/\W/g, ' ')
    .replace(/n t/g, 'nt')
    .replace(/\s\s+/g, ' ')
    .split(' ')
    .join('-');
}
