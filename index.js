#!/usr/bin/env node
const request = require('request');
const _ = require('lodash');
const printf = require('printf');


const STATE = {
  links: [],
};


// ------------------------------------
function username() {
  return 'bubujka';
}

function parsePagination(str) {
  return _.fromPairs(str.split(',').map((t) => {
    const tt = t.split(';');
    return [tt[1].replace(/ rel="(.+)"/, '$1'), tt[0].replace(/[<>]/g, '')];
  }));
}

function parseResAndBody(res) {
  return {
    links: parsePagination(res.headers.link),
    data: JSON.parse(res.body).map((i) => {
      return _.pick(i, ['html_url', 'full_name']);
    }),
  };
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    request.get(url,
                { headers: { 'User-Agent': 'Bubujka-github-stars-fetcher <zendzirou@gmail.com>' } },
                (err, res) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(parseResAndBody(res));
                  }
                });
  });
}

function fetchFirstPage() {
  return fetchPage(`https://api.github.com/users/${username()}/starred`);
}


function saveResults(results) {
  return Promise.resolve(results)
    .then((t) => {
      STATE.links = STATE.links.concat(t.data);
    });
}

function isHaveNextPage(results) {
  return Promise.resolve(results)
    .then((t) => {
      return t.links.next;
    });
}

function fetchAllOtherPages(results) {
  return Promise.resolve(results)
    .then((t) => {
      const result = fetchPage(t.links.next);
      saveResults(result);
      return isHaveNextPage(result)
        .then((have) => {
          return have ? fetchAllOtherPages(result) : true;
        });
    });
}

function printResults() {
  STATE.links.sort().map((i) => {
    console.log(printf('★ %-50s%s', i.full_name, i.html_url));
  });
}

function doWork() {
  const result = fetchFirstPage();
  saveResults(result);

  isHaveNextPage(result)
    .then((have) => {
      if (have) {
        return fetchAllOtherPages(result);
      }
      return true;
    })
    .then(() => {
      printResults();
    });
}


// ---------------------------------------

doWork();
