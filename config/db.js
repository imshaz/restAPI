const mongoose = require('mongoose')
const config = require('config')

 dbConnect =async ()=>{

    try {
        await mongoose.connect(config.get('mongoURI'),{ useNewUrlParser: true ,useUnifiedTopology: true, useCreateIndex:true})
        console.log("Connected to DB")
    } catch (error) {
        console.log('Some thing went Wrong',error)
    }
    
 }



module.exports = dbConnect