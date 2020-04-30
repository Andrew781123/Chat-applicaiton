function checkAdmin(req, res, next) {
    if(req.user.role == 'ADMIN') return next();
    else res.redirect('/');
}

module.exports =  checkAdmin ;