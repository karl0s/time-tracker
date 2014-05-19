var express = require('express');
var router = express.Router();
var cache = require('memory-cache');

var sa = require('superagent');

/* GET home page. */
router.get('/', function(req, res) {
    if(req.cookies.user){
        req.session.user = req.cookies.user;
        req.session.is_valid = true;
    }

    if(req.session && req.session.user){
        return res.redirect('/dashboard');
    }

    return res.render('login');
});

router.get('/calendar', function(req, res){
   return res.render('calendar', { api_key: req.session.user.api_key, api_secret: req.session.user.api_secret });
});

router.get('/calendar/:key/:secret', function(req, res){
    if(!req.params.key || !req.params.secret)return res.send(500, 'missing key or secret');

    var base_url = 'https://api.assembla.com/v1/';

    var api_key = req.params.key;
    var api_secret = req.params.secret;

    sa.get(base_url + '/spaces')
        .set('X-Api-Key', api_key)
        .set('X-Api-Secret', api_secret)
        .end(function(err, response){
            var spaces = response.body;

            sa.get(base_url + '/spaces/' + spaces[0].id + '/tickets/my_active.json')
                .set('X-Api-Key', api_key)
                .set('X-Api-Secret', api_secret)
                .end(function(err, response){
                    if(err)return res.send(500, err);

                    var tickets = response.body;


                    var cal = require('icalendar');
                    var event = new cal.VEvent('1234');
                    event.setSummary('hi..');
                    event.setDate(Date.now(), Date.now());

                    res.setHeader('Content-type', 'text/calendar; charset=utf-8');
                    return res.send(event.toString());
                });
        });
});

router.get('/pin', function(req, res){
   return res.render('pin');
});

router.post('/pin', function(req, res){
    var pin = req.body.pin;
    if(!pin)return res.send(500, 'no pin found');

    var user = cache.get(pin);
    if(!user)return res.send(500, 'invalid pin');

    req.session.user = user;
    req.session.is_valid = true;
    req.session.notification = {
        type: 'success',
        title: 'Device Authorized'
    };

    res.cookie('user', user);

    cache.del(pin);

    return res.redirect('/dashboard');
});

router.get('/authorize', function(req, res){
    var code = get_random(1000, 9999);

    console.log('code', cache.get(code));
    while(cache.get(code) != null){
        code = get_random(1000, 9999);
    }

    cache.put(code, req.session.user);
    setTimeout(function(){
        cache.del(code);
    }, 1000 * 60 * 2); // delete after 2 minutes

    return res.render('authorize', {
        code: code
    });
});

var get_random = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = router;
