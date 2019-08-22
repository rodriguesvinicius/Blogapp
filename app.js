// Carregando modulos
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./routes/admin')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
require('./models/categoria')
const Categoria = mongoose.model('categorias')
require('./models/PostagensUsuario')
const PostagensUsuario = mongoose.model('postagensUsuario')
require('./models/Usuario')
const Usuario = mongoose.model('usuarios')
const usuarios = require('./routes/usuario')
const passport = require('passport')
process.env.PWD = process.cwd()
require('./config/auth')(passport)
const db = require('./config/db')
const { deslogado } = require('./helpers/deslogado')

// Con  ihurações
// Sessao
app.use(session({
    secret: "cursodeNode",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

// Flash
app.use(flash())
//
// midleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next()
})
//
// body-parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//Handlebars

app.engine('handlebars', handlebars({
    defaultLayout: 'main',
}))

//mongoose
mongoose.Promise = global.Promise;
mongoose.connect(db.mongoURI,{ useNewUrlParser: true }).then(() => {
    console.log("Conectado com banco de dados")
}).catch((err) => {
    console.log("Não foi possivel se conectar" + err)
})
//
//Public
app.use(express.static(path.join(__dirname, "public")))

//midles
app.use((req, res, next) => {

    console.log("Eu sou um midle")
    next();
})
//ROTAS

// listando as postagens recente na pagina incial
app.get("/", (req, res) => {
    Postagem.find().populate('categoria').sort({ data: 'Desc' }).then((postagens) => {
        res.render("index.handlebars", { postagens: postagens })
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao lista as postagens")
        res.redirect('/404')
    })

})

app.get("/minhaspostagens/add", deslogado, (req, res) => {

    PostagensUsuario.find().populate('usuario').sort({ data: 'Desc' }).then((postagensUsuario) => {
        res.render("usuarios/minhasPostagens.handlebars", { postagensUsuario: postagensUsuario })

    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao lista as postagens")
        res.redirect('/404')
    })
})

app.get("/minhaspostagens/add/:id", deslogado, (req, res) => {

    if (req.params.id == req.user.id) {
        PostagensUsuario.find({ usuario: req.params.id }).populate('usuario').sort({ data: 'Desc' }).then((postagensUsuario) => {
            res.render("usuarios/minhasPost.handlebars", { postagensUsuario: postagensUsuario })

        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao lista as postagens")
            res.redirect('/404')
        })
    } else {
        res.redirect('/minhaspostagens/add')
    }
})

app.post('/minhaspostagens/alterar', deslogado, (req, res) => {
    //criando um vetor para amarzenar os erros  
    var errosEdit = []
    // verificando se o campo nome foi preenchido corretamente
    if (!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null) {
        errosEdit.push({ texto: "Conteudo não pode estar em Branco" })
    }
    if (errosEdit.length > 0) {
        res.render('usuarios/minhasPostagens.handlebars', { errosEdit: errosEdit })
    } else {
        PostagensUsuario.findOne({ _id: req.body.id }).then((postagem) => {
            postagem.conteudo = req.body.conteudo
            postagem.save().then(() => {
                req.flash("success_msg", "Postagem Alterada com sucesso")
                res.redirect("/usuarios/perfil")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao alterar a Postagem")
                res.redirect("/usuarios/perfil")
            })
        })
    }
})
app.post('/minhaspostagens/deletar', deslogado, (req, res) => {
    PostagensUsuario.deleteOne({ _id: req.body.id }).then(() => {
        req.flash('success_msg', "Postagem deletada com sucesso")
        res.redirect('/minhaspostagens/add')
    }).catch((err) => {
        req.flash('error_msg', "Erro ao deletar postagem!")
        res.redirect('/minhaspostagens/add')
    })
})

app.post("/minhaspostagens/nova", deslogado, (req, res) => {

    var errosEdit = []

    if (!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null) {
        errosEdit.push({ texto: "Conteudo Invalido" })
    }

    if (!req.body.usuario || typeof req.body.usuario == undefined || req.body.usuario == null) {
        errosEdit.push({ texto: "Não possivel localizar o Usuario" })
    }

    if (req.body.conteudo.length < 2) {
        errosEdit.push({ texto: "O conteudo e muito pequeno" })
    }

    if (errosEdit.length > 0) {
        console.log(errosEdit)
        res.render("usuarios/minhaspostagens.handlebars", { errosEdit: errosEdit })

    } else {
        const novaPostagem = {
            conteudo: req.body.conteudo,
            usuario: req.body.usuario
        }

        new PostagensUsuario(novaPostagem).save().then(() => {
            req.flash("success_msg", "Postagem Criada com Sucesso!")
            res.redirect('/usuarios/perfil')
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', "Houve um erro durante o salvamento da postagem")
            res.redirect('/usuarios/perfil')
        })
    }

})

// saber mais pagina de cada postage
app.get('/postagem/:slug', (req, res) => {
    Postagem.findOne({ slug: req.params.slug }).then((postagem) => {
        if (postagem) {
            res.render('postagem/index.handlebars', { postagem: postagem })
        } else {
            req.flash('error_msg', "Esta Postagem Não existe")
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno')
        res.redirect('/')
    })
})

//erro 404
app.get('/404', (req, res) => {
    res.send('Erro:404')
})


// listando todas as categorias
app.get('/categorias', (req, res) => {
    Categoria.find().then((categorias) => {
        res.render('categorias/index.handlebars', { categorias: categorias })
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao listar as categorias")
        res.redirect('/')
    })
})

// trazendo as publicações de acordo com cada slug
app.get('/categorias/:slug', (req, res) => {
    Categoria.findOne({ slug: req.params.slug }).then((categoria) => {
        if (categoria) {
            Postagem.find({ categoria: categoria._id }).then((postagens) => {
                res.render("categorias/postagens.handlebars", { postagens: postagens, categoria: categoria })
            }).catch((err) => {
                req.flash('error_msg', "Houve um erro ao listar os posts")
                res.redirect('/')
            })

        } else {
            req.flash('error_msg', "Esta Categoria não existe")
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro interno ao carregar a pagina de categorias")
        res.redirect('/')
    })
})

// primeiro parametro criando um prefixo admin
app.get
app.use('/admin', admin)
app.use('/usuarios', usuarios)
// OUTROS
const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
    console.log("Servidor Rodando")
})