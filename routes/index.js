var express = require('express');
var router = express.Router();
var cache = require('memory-cache');

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
