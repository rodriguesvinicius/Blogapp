module.exports = {
    logado: (req, res, next) => {
        if (req.isAuthenticated()) {
            req.flash("error_msg", "Você ja esta  Logado")
            res.redirect("/")
        } 
        else{
            return next()
        }

    }
}