const mongoose = require('mongoose'); 
const config = require('config')
const jwt = require('jsonwebtoken')


module.exports = async function (req, res, next) {  

    let token = req.header('x-auth-token'); 

    if(!token){
        return res.status(401).json(
            {msg:"Token not found - User not verified"}
        )
    }


    try {
        let decode = await jwt.verify(token, config.get('MySecretCode'))
        // console.log(decode, "decode")
        req.user = decode.user; 
        

    } catch (error) {
        
        return res.status(401).json(
            {msg:"Token not valid - User not verified"}
        )
        
    }

    // const user = jwt.verify(token,"Secret")

    next()


}