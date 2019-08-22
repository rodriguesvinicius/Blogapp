module.exports = {
    deslogado: (req, res, next) => {
        if (req.isAuthenticated()) {
            
            return next()
        } 
        else{
            
            req.flash("error_msg", "Você tem que estar logado")
            res.redirect("/usuarios/login")
        }

    }
}