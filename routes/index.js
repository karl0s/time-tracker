var express = require('express');
var router = express.Router();
var cache = require('memory-cache');

var sa = require('superagent');
var moment = require('moment');

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
    var base_url = 'https://api.assembla.com/v1/';

    var api_key = req.session.user.api_key;
    var api_secret = req.session.user.api_secret;

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
                    var events = [];

                    tickets.forEach(function(ticket){
                        if(ticket.custom_fields && ticket.custom_fields["Due Date"]) {
                            var start_date = moment(ticket.custom_fields["Due Date"]);
                            var end_date = start_date.add('h', 1);

                            events.push({
                                title: ticket.summary,
                                id: ticket.id,
                                start: start_date.toDate(),
                                end: end_date.toDate(),
                                url: 'https://assembla.com/spaces/' + ticket.space_id + '/tickets/' + ticket.number
                            });
                        }
                    });

                    return res.render('calendar', {
                        events: events,
                        api_key: api_key,
                        api_secret: api_secret
                    });
                });
        });
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

                    var ical = require('icalendar');
                    var cal = new ical.iCalendar();
                    cal.addProperty('X-WR-CALNAME;VALUE=TEXT', 'Mana.io Tasks');

                    tickets.forEach(function(ticket){
                        if(ticket.custom_fields && ticket.custom_fields["Due Date"]) {
                            var event = new ical.VEvent(ticket.id);
                            event.setSummary('#' + ticket.number + ' - ' + ticket.summary);
                            event.setDescription('https://assembla.com/spaces/' + ticket.space_id + '/tickets/' + ticket.number + ' - ' + ticket.description);

                            var dueDate = moment(ticket.custom_fields["Due Date"]);
                            event.setDate(dueDate.toJSON(), 60*60);

                            cal.addComponent(event);
                        }
                    });

                    return res.send(cal.toString());
                    res.setHeader('Content-type', 'text/calendar; charset=utf-8');
                    return res.send(cal.toString());
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

    res.cookie('user', user, { mageAge: 10000 });

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
