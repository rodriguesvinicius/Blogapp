const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
require('../models/PostagensUsuario')
const PostagensUsuario = mongoose.model('postagensUsuario')
require('../models/PerfilUsuario')
const PerfilUsuario = mongoose.model('perfilUsuario')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const { logado } = require('../helpers/logado')
const { deslogado } = require('../helpers/deslogado')
const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/uploads')
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + "-" + file.originalname)
    }
})
const upload = multer({ storage })
router.post('/addfoto', (req, res) => {

})
router.get('/registro', logado, (req, res) => {
    res.render('usuarios/registro.handlebars')
})
router.post('/registro', (req, res) => {
    var erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome Invalido" })
    }
    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({ texto: "Email Invalido" })
    }
    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ texto: "Senha Invalido" })
    }

    if (req.body.senha.length < 4) {
        erros.push({ texto: 'Senha muito pequena!!' })
    }

    if (req.body.senha != req.body.senha2) {
        erros.push({ texto: "As senhas são diferentes" })
    }

    if (erros.length > 0) {
        res.render('usuarios/registro.handlebars', { erros: erros })
    } else {
        Usuario.findOne({ email: req.body.email }).then((usuario) => {
            if (usuario) {
                req.flash('error_msg', "Já existe uma conta com esse e-mail cadastrado")
                res.redirect('/usuarios/registro')
            } else {
                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha,

                })

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if (erro) {
                            req.flash("error_msg", "Houve um erro durante o salvamento")
                            res.redirect('/registro')
                        }
                        novoUsuario.senha = hash
                        novoUsuario.save().then(() => {
                            req.flash("success_msg", "Usuario Cadastrado com sucesso")
                            res.redirect('/')
                        }).catch((err) => {
                            req.flash('error_msg', "Houve erro ao cadastrar o Usuario tente novamente")
                            res.redirect('/usuarios/registro')
                        })
                    })
                })

            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect('/')
        })
    }
})


router.get('/login', logado, (req, res) => {
    res.render('usuarios/login.handlebars')
})

router.post('/login', (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/usuarios/perfil",
        failureRedirect: "/usuarios/login",
        failureFlash: true
    })(req, res, next)

})

router.get('/logout', (req, res) => {
    req.logout()
    req.flash("success_msg", "Deslogado com sucesso")
    res.redirect('/')
})

router.get('/minhaconta', deslogado, (req, res) => {
    res.render('usuarios/minhaconta.handlebars')
})

router.post('/minhaconta/edit', upload.single('img'), (req, res) => {
    console.log(req.body, req.file)
    //criando um vetor para amarzenar os erros  
    var errosEdit = []
    // verificando se o campo nome foi preenchido corretamente
    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        errosEdit.push({ texto: "Nome não pode estar em Branco" })
    }

    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        errosEdit.push({ texto: "Email não pode estar em Branco" })
    }


    if (errosEdit.length > 0) {
        res.render('usuarios/minhaconta.handlebars', { errosEdit: errosEdit })
    } else {
        Usuario.findOne({ _id: req.body.id }).then((usuario) => {
            usuario.nome = req.body.nome
            usuario.email = req.body.email
            usuario.foto = "/uploads/" + req.file.filename
            usuario.save().then(() => {
                req.flash("success_msg", "Usuario Alterado com sucesso")
                res.redirect("/usuarios/minhaconta")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao alterar o usuario")
                res.redirect("/usuarios/minhaconta")
            })
        })
    }
})

router.post('/perfil/editnome', (req, res) => {
    var errosEdit = []
    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        errosEdit.push({ texto: "Nome não pode estar em Branco" })
    }

    if (errosEdit.length > 0) {
        res.render('/usuarios/perfil', { errosEdit: errosEdit })
    } else {
        Usuario.findOne({ _id: req.body.id }).then((usuario) => {
            usuario.nome = req.body.nome
            usuario.save().then(() => {
                req.flash('success_msg', "Nome Alterado com Sucesso")
                res.redirect('/usuarios/perfil')
            }).catch((err) => {
                req.flash('error_msg', "Não foi possivel alterar o nome")
                res.redirect('/usuarios/pefil')
            })
        })
    }
})
router.post('/perfil/editFoto', upload.single('img'), (req, res) => {
    PerfilUsuario.findOne({ _id: req.body.id }).then((perfilUsuario) => {
        // passando a foto como parametro se tiver achado perfil de acordo com id
        perfilUsuario.fotoFundo = "/uploads/" + req.file.filename
        perfilUsuario.save().then(() => {
            req.flash('success_msg', "Foto Alterada com successo")
            res.redirect('/usuarios/perfil')
        }).catch((err) => {
            req.flash('error_msg', "não foi possivel alterar a foto")
            res.redirect('/usuarios/perfil')
        })
    })
})

router.get('/perfil', deslogado, (req, res) => {
    if (req.user.id) {
        PostagensUsuario.find({ usuario: req.user.id }).populate('usuario').sort({ data: 'Desc' }).then((postagensUsuario) => {
            Usuario.find().then((usuarios) => {
                PerfilUsuario.findOne({ usuario: req.user.id }).populate('usuario').then((perfilUsuario) => {
                    if (perfilUsuario) {
                        res.render("usuarios/perfil.handlebars", { postagensUsuario: postagensUsuario, perfilUsuario: perfilUsuario, usuarios: usuarios })
                    } else {
                        const erros = []
                        erros.push({ texto: "Você precisa Finalizar seu perfil cadastrando APRESENTAÇÃO" })
                        console.log('Entrei aqui viado')
                        res.render("usuarios/perfil.handlebars", { erros: erros, postagensUsuario: postagensUsuario, perfilUsuario: perfilUsuario })
                    }
                }).catch((err) => {
                    req.flash("error_msg", "Houve um erro interno")
                    console.log(err)
                    res.redirect('/minhaspostagens/add')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro Interno')
                console.log(err)
                res.redirect('/minhaspostagens/add')
            })


        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', "Houve um erro ao lista as postagens")
            res.redirect('/404')
        })
    } else {
        console.log('logado porem nao estou com id')
        res.redirect('/minhaspostagens/add')
    }
})

router.get('/perfilusuario/:id', deslogado, (req, res) => {

    PostagensUsuario.find({ usuario: req.params.id }).populate('usuario').sort({ data: 'Desc' }).then((postagensUsuario) => {
        PerfilUsuario.findOne({ usuario: req.params.id }).populate('usuario').then((perfilUsuario) => {
            if (req.params.id == req.user.id) {
                res.redirect('/usuarios/perfil')
            } else {
                if (!perfilUsuario) {
                    req.flash("error_msg", "O usuario não finalizou o perfil ainda!")
                    res.redirect('/minhaspostagens/add')

                } else {
                    res.render("usuarios/perfilUsuario.handlebars", { postagensUsuario: postagensUsuario, perfilUsuario: perfilUsuario })
                }
            }

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect('/minhaspostagens/add')
        })

    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao lista as postagens")
        res.redirect('/404')
    })
})

router.post('/perfil/edit', (req, res) => {
    PerfilUsuario.findOne({ usuario: req.body.idUser }).then((perfilUsuario) => {
        perfilUsuario.empresa = req.body.empresa,
            perfilUsuario.escola = req.body.escola,
            perfilUsuario.profissao = req.body.profissao,
            perfilUsuario.linguagem = req.body.linguagem
        perfilUsuario.save().then(() => {
            req.flash('success_msg', "Apresentação Alterada com sucesso")
            res.redirect('/usuarios/perfil')
        }).catch((err) => {
            req.flash('error_msg', "Não foi possivel alterar a Apresentação")
            res.redirect('/usuarios/perfil')
        })
    })
})

router.post('/perfilapresentacao/add', (req, res) => {
    PerfilUsuario.findOne({ usuario: req.user.id }).then((perfilUsuario) => {
        console.log(perfilUsuario)
        if (perfilUsuario) {
            req.flash('error_msg', "Você já adicionou todas as informações")
            res.redirect('/usuarios/perfil')
        } else {

            const perfilUsuario = {
                empresa: req.body.empresa,
                escola: req.body.escola,
                profissao: req.body.profissao,
                linguagem: req.body.linguagem,
                usuario: req.body.idUser,
                resumo: "teste meu amigo"
            }
            new PerfilUsuario(perfilUsuario).save().then(() => {
                req.flash('success_msg', "Informações cadastrada com sucesso")
                res.redirect('/usuarios/perfil')

            }).catch((err) => {
                req.flash('error_msg', "Houve um erro ao salvar as informações no banco de dadados")
                res.redirect('/usuarios/perfil')
            })
        }

    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', "Houve um erro Interno")
        res.redirect('/minhaspostagens/add')
    })

})


module.exports = router 