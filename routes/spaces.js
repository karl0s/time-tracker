var express = require('express');
var router = express.Router();

var sa = require('superagent');

router.get('/:id', function(req, res){
    var base_url = 'https://api.assembla.com/v1/';

    var api_key = req.session.user.api_key;
    var api_secret = req.session.user.api_secret;

    sa.get(base_url + '/spaces/' + req.params.id + '/tickets/my_active.json')
        .set('X-Api-Key', api_key)
        .set('X-Api-Secret', api_secret)
        .end(function(err, response){
            if(err)return res.send(500, err);

            console.log(response.body);
            return res.render('space', { space_id: req.params.id, tickets: response.body });
        });
});

router.get('/:id/tickets/:ticket_id', function(req, res){
    var base_url = 'https://api.assembla.com/v1/';

    var api_key = req.session.user.api_key;
    var api_secret = req.session.user.api_secret;

    sa.get(base_url + '/spaces/' + req.params.id + '/tickets/id/' + req.params.ticket_id + '.json')
        .set('X-Api-Key', api_key)
        .set('X-Api-Secret', api_secret)
        .end(function(err, response){
            if(err)return res.send(500, err);

            console.log(response.body);
            return res.render('ticket', { space_id: req.params.id, ticket: response.body });
        });
});

module.exports = router;
