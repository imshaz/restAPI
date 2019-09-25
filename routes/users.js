var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');

const User = require('../model/Users')
const gravatar = require('gravatar')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')
const config = require('config')

/* 
  route: POST api/users
  desc: Register a User
  access: public

*/
router.post('/',[
  check("name", "name is Required- atleast 4 char").not().isEmpty().isLength({min:4}), 
  check("email", "Email is Require").not().isEmpty().isEmail(),
  check("password", "password is Required - and should be atleast 6 char").not().isEmpty().isLength({min:6})
], async function(req, res) {

  const errors = validationResult(req)

  if(!errors.isEmpty()){
    return res.status(422).send({errors:errors.array()})
  }

  try {

    var {name, email, password} = req.body

    //check if user already exist in DB
    let user = await User.findOne({email})
    if(user){
      return res.status(400).send({errors:[{msg:"User Already Exist"}]})
    }
    //Get User Gravitar 

    var avatar = gravatar.url(`${email}`, {s: '200', r: 'pg', d: 'robohash'}, true);
    
    user = new User({

      name, 
      email, 
      avatar, 
      password
    })
    // encrypt password
    const saltRounds = 10;
    
    let salt = await bcrypt.genSalt(saltRounds); 
    user.password = await bcrypt.hash(password, salt); 
    
   await user.save();
    
    // Reaturn JSON token 
    const payload ={
      user:{
        id:user.id
      }
    }

    let token = await jwt.sign(payload,config.get('MySecretCode'),{expiresIn:36000})
    res.json({token})
  } catch (error) {
    res.status(500).send([{
      msg:"Server Error"
    }])
  }
  
});

router.get('/',auth, async (req,res)=>{
  
  // console.log(req.user.id)
  try {
    let user = await User.findById(req.user.id).select('-password')

    res.json(user)
    
  } catch (error) {
    
    res.status(500).send([{
      msg:"Server Error"
    }])
  }
  

})

module.exports = router;
