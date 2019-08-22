const mongoose= require('mongoose')
const Schema= mongoose.Schema

const PerfilUsuario= new Schema({
    empresa: {
        type: String,
        required:false
    },
    escola:{
        type:String,
        required:false
    },
    profissao:{
        type:String,
        required:false
    },
    linguagem:{
        type:String,
        required:false
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref:"usuarios",
        required:true
    },
    fotoFundo:{
        type:String,
        default:'/img/wallpaper01.jpg'
    },
    resumo:{
        type:String,
        required:false
    },
    data:{
        type:Date,
        default:Date.now()
    },
})

mongoose.model("perfilUsuario",PerfilUsuario)