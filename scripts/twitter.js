// (c) 2012 Richard Carter
// This code is licensed under the MIT license; see LICENSE.txt for details.

// This script handles the following functions:
//     a twitter url - look up the tweet and announce it

var timeago = require('timeago'),
    oauth = require('oauth');

require('./config.js');

var twitterAccessToken = null;
var twitterOauth = new oauth.OAuth2(
        nodebot_prefs.twitter_consumerkey,
        nodebot_prefs.twitter_secret,
        'https://api.twitter.com/',
        null,
        '/oauth2/token',
        null
        );
twitterOauth.useAuthorizationHeaderforGET(true);

twitterOauth.getOAuthAccessToken(
        '',
        {'grant_type': 'client_credentials'},
        function (e, access_token, refresh_token, results) {
            if (e) {
                console.error(e);
                return;
            }
            console.log('Got Twitter bearer token');
            twitterAccessToken = access_token;
        }
        );

listen(regexFactory.matches(".*?https://twitter.com/[a-z0-9]+/status/([0-9]+)", false),
        function(match, data, replyTo) {
    if (!twitterAccessToken) {
        irc.privmsg(replyTo, "Twitter API not yet connected");
        return;
    }

    var tweetId = match[1];
    var url = 

    twitterOauth.get(
        'https://api.twitter.com/1.1/statuses/show.json?id=' + tweetId,
        twitterAccessToken,
        function (e, data, res) {
            if (e) {
                if (e.data) {
                    try {
                        var errorData = JSON.parse(e.data);
                        if (errorData.errors && errorData.errors[0] &&
                            errorData.errors[0].message) {
                                irc.privmsg(replyTo, "Twitter error: " +
                                    errorData.errors[0].message);
                            }
                    } catch (e) {}
                }
                console.error("Twitter error", e);
                return;
            }
            try {
                data = JSON.parse(data);
                var prettyDate = timeago(data.created_at);
                
                irc.privmsg(replyTo, "" + data.user.name + " (@" +
                    data.user.screen_name + "), " + prettyDate + ": " + data.text);
            } catch (e) {
                irc.privmsg(replyTo, "Twitter error: " + e);
            }

        });

    // do not allow title plugin to process url
    return true;
});
