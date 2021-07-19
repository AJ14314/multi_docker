const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000 //try to reconnect in 1 second
});
//duplicate connection because to watch redis for any new value and run our fib function
const sub = redisClient.duplicate();

function fib(index) {
    if (index < 0) return -1;
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}
//subscription
sub.on('message', (channel, message) => {
    //calculating fibnocii for each message and adding to hash of values
    redisClient.hset('values', message, fib(parseInt(message)));
});

//subscribing for each insert in redis
sub.subscribe('insert');