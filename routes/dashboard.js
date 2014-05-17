var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
    if(!req.session || !req.session.user){
        return res.redirect('/');
    }
    return res.render('dashboard');
});


module.exports = router;
