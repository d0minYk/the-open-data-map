const express = require('express');
const basicAuth = require('express-basic-auth')
const bodyParser = require('body-parser');
const path = require('path');
const RateLimit = require('express-rate-limit');
const app = express();
const compression = require('compression');
const Keys = require('./config/Keys.js');

if (!Keys.googleMaps.apiKey) {
    throw Error ("Define API keys");
}

var bugsnag = require('@bugsnag/js')
var bugsnagExpress = require('@bugsnag/plugin-express')
var bugsnagClient = bugsnag(Keys.bugsnag.apiKey)
bugsnagClient.use(bugsnagExpress)

var middleware = bugsnagClient.getPlugin('express')
app.use(middleware.requestHandler)

app.use(compression());

app.use(bodyParser.json({
    limit: '105mb'
}));

app.use(bodyParser.urlencoded({
    extended: true,
    limit: '105mb'
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Origin", "https://theopendatamap.com");
    res.header("Referrer-Policy", "same-origin");
    res.header("X-XSS-Protection", "1");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    // res.setHeader("X-Frame-Options", "DENY");
    // res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
    next();
});

app.use('/a/user/login', new RateLimit({
    windowMs: 600*1000,
    max: 10,
    delayMs: 0,
    onLimitReached: function() { console.log("LIMIT REACHED") }
}));

app.use('*', new RateLimit({
    windowMs: 500*1000,
    max: 500,
    delayMs: 0,
    onLimitReached: function() { console.log("LIMIT REACHED") }
}));

// app.use(basicAuth({
//     challenge: true,
//     users: { 'dominik': 'KhonsSavedPuPPets' }
// }));

const UserAPI = require('./routes/User');
app.use('/a/user', UserAPI);

const RequestAPI = require('./routes/Request');
app.use('/a/request', RequestAPI);

const CityAPI = require('./routes/City');
app.use('/a/city', CityAPI);

const CountryAPI = require('./routes/Country');
app.use('/a/country', CountryAPI);

const DatasetAPI = require('./routes/Dataset');
app.use('/a/dataset', DatasetAPI);

const TopicAPI = require('./routes/Topic');
app.use('/a/topic', TopicAPI);

const TagAPI = require('./routes/Tag');
app.use('/a/tag', TagAPI);

const LocationAPI = require('./routes/Location');
app.use('/a/location', LocationAPI);

const LikeAPI = require('./routes/Like');
app.use('/a/like', LikeAPI);

const LicenceAPI = require('./routes/Licence');
app.use('/a/licence', LicenceAPI);

const ShareAPI = require('./routes/Share');
app.use('/a/share', ShareAPI);

const CommentAPI = require('./routes/Comment');
app.use('/a/comment', CommentAPI);

const ReportAPI = require('./routes/Report');
app.use('/a/report', ReportAPI);

const RatingAPI = require('./routes/Rating');
app.use('/a/rating', RatingAPI);

const ContactUsAPI = require('./routes/ContactUs');
app.use('/a/contact-us', ContactUsAPI);

const StatisticsAPI = require('./routes/Statistics');
app.use('/a/statistics', StatisticsAPI);

const FavoriteLocationAPI = require('./routes/FavoriteLocation');
app.use('/a/favorite', FavoriteLocationAPI);

const DefinitionAPI = require('./routes/Definition');
app.use('/a/definition', DefinitionAPI);

const RequestAutoAssignAPI = require('./routes/RequestAutoAssign');
app.use('/a/request-auto-assign', RequestAutoAssignAPI);

const SubscriptionAPI = require('./routes/Subscription');
app.use('/a/subscription', SubscriptionAPI);

const PublicAPI = require('./routes/PublicAPI');
app.use('/api', PublicAPI);

const WidgetAPI = require('./routes/Widget');
app.use('/widget', WidgetAPI);

app.use('/sitemap.txt', require('./routes/Sitemap'));

app.use(express.static('uploads/'));
app.use(express.static('theOpenDataMap/build/'));
app.get('manifest.json', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'theOpenDataMap', 'build', 'manifest.json'))
})
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'theOpenDataMap', 'build', 'index.html'))
})

app.use(function(err, req, res, next){
    console.error(err);
    res.status(500).json({ error: "Unexpected Error" })
});

// process.on('uncaughtException', function(err) {
//     console.log('Caught exception: ' + err);
// });

app.use(middleware.errorHandler)

// crons
require('./crons/ScheduledParses');
require('./crons/LocationParser');
require('./crons/Statistics');
require('./crons/CKANExplorer');

// scripts
// require('./scripts/CountriesToDatabase');
// require('./scripts/fileParser');
// require('./scripts/GeocodingTest.js');

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server started on port ${port}`))
