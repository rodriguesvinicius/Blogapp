const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require("../models/categoria")
const Categoria = mongoose.model('categorias')
require("../models/Postagem")
const Postagem = mongoose.model('postagens')
require("../models/Usuario")
const bcrypt = require('bcryptjs')
const Usuario = mongoose.model('usuarios')
const { eAdmin } = require('../helpers/eAdmin')

// ROTA PRINCIPAL
router.get('/', eAdmin, (req, res) => {
    res.render("admin/index.handlebars")
})

//==============//
//INICIO
//ROTAS DE POSTAGENS
router.get("/postagens", eAdmin, (req, res) => {
    Postagem.find().populate('categoria').sort({ data: 'Desc' }).then((postagens) => {
        res.render("admin/postagens.handlebars", { postagens: postagens })
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao lista as postagens")
        res.redirect('/admin')
    })

})

router.get("/postagens/add", eAdmin, (req, res) => {
    Categoria.find().then((categorias) => {
        res.render("admin/addpostagem.handlebars", { categorias: categorias })
    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Houve um erro ao carregar o Formulario")
        res.redirect("/admin")
    })
})

router.post("/postagens/nova", eAdmin, (req, res) => {

    var erros = []
    if (req.body.categoria == 0) {

        erros.push({ texto: "Categoria invalida, Registre uma Categoria" })
    }

    if (erros.length > 0) {
        res.render("admin/addpostagem.handlebars", { erros: erros })
    } else {
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug,
            foto: req.body.foto
        }

        new Postagem(novaPostagem).save().then(() => {
            req.flash("success_msg", "Postagem Criada com Sucesso!")
            res.redirect('/admin/postagens')
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', "Houve um erro durante o salvamento da postagem")
            res.redirect('/admin/postagens')
        })
    }

})
// setando campos para editar
router.get('/postagens/edit/:id', eAdmin, (req, res) => {

    Postagem.findOne({ _id: req.params.id }).then((postagem) => {
        Categoria.find().then((categorias) => {
            res.render('admin/editpostagens.handlebars', { categorias: categorias, postagem: postagem })
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao listar as categorias')
            res.redirect('/admin/postagens')
        })
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao carregar o formulario de edição")
        res.redirect('/admin/postagens')
    })
})

router.post('/postagens/edit', eAdmin, (req, res) => {

    Postagem.findOne({ _id: req.body.id }).then((postagem) => {
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {

            req.flash('success_msg', "Postagem editada com sucesso!")
            res.redirect('/admin/postagens')
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', "Erro Interno")
            res.redirect('/admin/postagens')
        })
    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Houve um erro ao salvar a edição!")
        res.redirect('/admin/postagens')
    })
})

router.get('/postagens/deletar/:id', eAdmin, (req, res) => {
    Postagem.remove({ _id: req.params.id }).then(() => {
        req.flash('success_msg', "Postagem deletada com sucesso")
        res.redirect('/admin/postagens')
    }).catch((err) => {
        req.flash('error_msg', "Erro ao deletar postagem!")
        res.redirect('/admin/postagens')
    })
})
///================//

// estamos listando nossas categorias
router.get('/categorias', eAdmin, (req, res) => {
    Categoria.find().sort({ date: 'Desc' }).then((categorias) => {
        res.render("admin/categorias.handlebars", { categorias: categorias })
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao lista as Categorias")
        res.redirect("/admin")
    })
})

// Rota para editar categorias
router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.params.id }).then((categoria) => {
        res.render("admin/editcategorias.handlebars", { categoria: categoria })
    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Esta categoria não existe")
        res.redirect("/admin/categorias")
    })
})



// Rota que altera as categorias
router.post("/categorias/edit", eAdmin, (req, res) => {

    //criando um vetor para amarzenar os erros 
    var errosEdit = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        errosEdit.push({ texto: "Nome Invalido" })
    }

    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        errosEdit.push({ texto: "Slug Invalido" })
    }

    if (req.body.nome.length < 2) {
        errosEdit.push({ texto: "Nome da categoria é muito pequena" })
    }

    if (errosEdit.length > 0) {
        console.log(errosEdit)
        res.render("admin/editcategorias.handlebars", { errosEdit: errosEdit })

    } else {

        Categoria.findOne({ _id: req.body.id }).then((categoria) => {
            categoria.nome = req.body.nome
            categoria.slug = req.body.slug

            categoria.save().then(() => {
                req.flash('success_msg', 'Categoria Alterada Com sucesso')
                res.redirect("/admin/categorias")
            }).catch((err) => {
                req.flash("error_msg", "Houve um Interno ao salvar a ediçao da categoria")
                res.redirect("/admin/categorias")
            })

        }).catch((err) => {

            req.flash("error_msg", "Houve um erro ao editar a categoria")
            res.redirect("/admin/categorias")
        })
    }
})

// rota para deletar uma categoria
router.post('/categorias/deletar', eAdmin, (req, res) => {

    Categoria.deleteOne({ _id: req.body.id }).then((categoria) => {

        req.flash("success_msg", "Categoria deletada com sucesso")
        res.redirect('/admin/categorias')


    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Houve um erro ao Deletar a categoria")
        res.redirect("/admin/categorias")
    })

})

// rota quando clicado no botao leva para a pagina de criação de categoria
router.get('/categorias/add', eAdmin, (req, res) => {
    res.render("admin/addcategorias.handlebars")
})

// rota que cria uma categoria assim que clicado no botão
router.post('/categorias/nova', eAdmin, (req, res) => {
    // codigo abaixo estamos validando o formulario
    var erros = []
    // verificando se o campo nome foi preenchido corretamente
    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome Invalido" })
    }

    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({ texto: "Slug Invalido" })
    }

    if (req.body.nome.length < 2) {
        erros.push({ texto: "Nome da categoria é muito pequena" })
    }

    // no primeiro if caso o array tenha erro sera rederizado a pagina addcategorias com os erros
    if (erros.length > 0) {
        res.render("admin/addcategorias.handlebars", { erros: erros })
    } else {
        Categoria.findOne({ nome: req.body.nome }).then((categoria) => {
            if (categoria) {
                req.flash('error_msg', "Já existe uma categoria com este nome")
                res.redirect('/admin/categorias')
            } else {
                const novaCategoria = {
                    nome: req.body.nome,
                    slug: req.body.slug
                }
                new Categoria(novaCategoria).save().then(() => {
                    req.flash("success_msg", "Categoria Criada com sucesso")
                    res.redirect("/admin/categorias")
                }).catch((err) => {
                    console.log(err)
                    req.flash("error_msg", "Erro ao cadastrar a Categoria tente novamente")
                    res.redirect("/admin")
                })
            }

        })
        // senao sera feito o cadastro no banco de dados


    }
})



router.get('/minhaconta', eAdmin, (req, res) => {
    res.render('admin/minhaconta.handlebars')
})

router.get('/usuarios', eAdmin, (req, res) => {
    Usuario.find().sort({ date: 'Desc' }).then((usuarios) => {
        res.render("admin/usuarios.handlebars", { usuarios: usuarios })
    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Houve um erro ao lista as Categorias")
        res.redirect("/admin")
    })
})

router.post('/minhaconta/edit', eAdmin, (req, res) => {
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
        res.render('admin/minhaconta.handlebars', { errosEdit: errosEdit })
    } else {
        Usuario.findOne({ _id: req.body.id }).then((usuario) => {
            usuario.nome = req.body.nome
            usuario.email = req.body.email

            usuario.save().then(() => {
                req.flash("success_msg", "Usuario Alterado com sucesso")
                res.redirect("/admin/minhaconta")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao alterar o usuario")
                res.redirect("/admin/minhaconta")
            })
        })
    }
})


module.exports = router