var express = require('express');
var router = express.Router();
var config = require('config'); 
var jwt= require('jsonwebtoken'); 
var User = require('../model/Users')
var {check, validationResult} =require('express-validator'); 
var bcrypt = require('bcrypt')


/* 
  route: POST api/auth/login
  desc:  get user token
  access: public
*/

router.post('/login',[
  check("email", "Email is Required").not().isEmpty().isEmail(), 
  check("password", "Password is required ").not().isEmpty()

], async (req,res)=>{
  
  let errors = validationResult(req); 

  if(!errors.isEmpty()){

    return res.status(422).send({errors:errors.array()})
  }
  const {email, password} = req.body;
  let user = await User.findOne({email})
  
  if(!user){
    return res.status(401).json([{msg:"Invalid Credential..!"}])
  }

  let isPasswordMAtch = await bcrypt.compare(password, user.password); 

  if(!isPasswordMAtch){
    return res.status(401).json([{msg:"Invalid Credential..!"}])

  }


  const payload ={
    user:{
      id:user.id
    }
  }
  

  let token = jwt.sign(payload,config.get('MySecretCode'), {expiresIn:36000})


  res.json({token})

})


router.get('/', function(req, res, next) {
  res.send('Auth API');
});

module.exports = router;
