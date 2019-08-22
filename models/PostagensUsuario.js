const mongoose= require('mongoose')
const Schema= mongoose.Schema

const PostagensUsuario= new Schema({
    conteudo: {
        type: String,
        required: true
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref:"usuarios",
        required:true
    },
    data:{
        type:Date,
        default:Date.now()
    },
})

mongoose.model("postagensUsuario",PostagensUsuario)