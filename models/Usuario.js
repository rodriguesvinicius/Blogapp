const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Usuario = new Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    eAdmin: {
        type: Number,
        default: 0
    },
    senha: {
        type: String,
        required: true
    },
    foto: {
        type: String,
        default:'/img/boy02.png'
    }

})

mongoose.model("usuarios", Usuario)

