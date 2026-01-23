const mongoose = require('mongoose');

const UserData = new mongoose.Schema(

    {
        username:{
            type:String,
            required : true,
            unique : true,
            trim : true,
            minlength : 3,
            maxlength : 30,
        },
        email:{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
        },
        password :{
            type : String,
            required:true,
            minlength :6
        }
    },{
        timeStamp: true
    }
)
module.exports = mongoose.model('userdata',UserData)