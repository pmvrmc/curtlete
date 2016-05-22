'use latest';

const _ = require('lodash');
const async = require('async');
const redis = require('redis');
const twilio = require('twilio');
const request = require('request');

function sendSMS (accountSid, authToken, twilioNumber, userNumber, callback) {
  const client = twilio(accountSid, authToken);
  client.messages.create({
    to: userNumber,
    from: twilioNumber,
    body: 'Wow there are new champions available at LoL! Go check them out!'
  }, (err) => {
    return callback(err);
  });
}

function getLocalFreeChampions (client, callback) {
  return client.smembers('freeChampions', callback);
}

function setLocalFreeChampions (client, championSet, callback) {
  client.del('freeChampions', (err) => {
    if (err) {
      return callback(err);
    }
    return client.sadd('freeChampions', championSet, callback);
  });
}

function getRemoteFreeChampions (key, callback) {
  const FREE_CHAMPIONS_URL = 'https://euw.api.pvp.net/api/lol/euw/v1.2/champion?freeToPlay=true&api_key='.concat(key);
  return request.get(FREE_CHAMPIONS_URL, (err, response, body) => {
    if (err) {
      return callback(err);
    }
    if (response.statusCode !== 200) {
      return callback(new Error('Invalid response ' + response.statusCode));
    }
    body = JSON.parse(body);
    return callback(null, body.champions);
  });
}

function mapChampions (champions, callback) {
  return async.map(champions || [], (champion, cbAsync) => {
    return cbAsync(null, champion.id);
  }, callback);
}

function isNewChampions (oldChampions, newChampions, callback) {
  const diffChampions = _.xor(newChampions, oldChampions);
  return callback(null, diffChampions.length !== 0);
}

module.exports = function (ctx, done) {
  const client = redis.createClient(ctx.data.REDIS_URL);
  let localChampions, remoteChampions;

  async.waterfall([
    async.apply(getLocalFreeChampions, client),
    (champions, callback) => {
      localChampions = champions || [];
      return getRemoteFreeChampions(ctx.data.LOL_KEY, callback);
    },
    (champions, callback) => {
      return mapChampions(champions, callback);
    },
    (champions, callback) => {
      remoteChampions = champions;
      return isNewChampions(localChampions, remoteChampions, callback);
    },
    (isNewChampions, callback) => {
      if (!isNewChampions) {
        return callback();
      }
      return sendSMS(ctx.data.TWILIO_SID, ctx.data.TWILIO_TOKEN, ctx.data.TWILIO_NUMBER, ctx.data.MY_NUMBER, callback);
    },
    (callback) => {
      return setLocalFreeChampions(client, remoteChampions, callback);
    }
  ], (err) => {
    if (err) {
      return done(err);
    }
    return done(null, 'Updated latest free champions!');
  });
};
