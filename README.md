## Curtlete

Hacking [webtaks.io](https://webtask.io/)!

This project uses webtaks.io to see if there are new free-to-play champions for the League of Legends game. If there it uses the Twilio API to send a message to the desired number.

Creating the webtask:
```script
wt create -n curtlete \
   -s REDIS_URL=XXX-REDIS-URL-XXX \
   -s LOL_KEY=XXX-KEY-XXX \
   -s TWILIO_SID=XXX-SID-XXX \
   -s TWILIO_TOKEN=XXX-TOKEN-XXX \
   -s TWILIO_NUMBER=XXX-TWILIO-NUMBER-XXX \
   -s MY_NUMBER=XXX-NUMBER-XXX \
  index.js
```


Creating a cron job:
```script
 wt cron schedule -n curtletecron \
   -s REDIS_URL=XXX-REDIS-URL-XXX \
   -s LOL_KEY=XXX-KEY-XXX \
   -s TWILIO_SID=XXX-SID-XXX \
   -s TWILIO_TOKEN=XXX-TOKEN-XXX \
   -s TWILIO_NUMBER=XXX-TWILIO-NUMBER-XXX \
   -s MY_NUMBER=XXX-NUMBER-XXX \
   "0 */10 * * *" index.js
```
