var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth')
var Profile = require('../model/Profile')
var User = require('../model/Users')
let {check, validationResult} =require('express-validator')
var request = require('request')
// ROUTE#1
/* 
   
  route: GET api/profiles/me
  desc: get logined/current user Profile
  access: Private
*/

router.get('/me',auth,async (req, res) =>{

    // console.log(req.user.id)

  const CurrentProfile = await Profile.findOne({user:req.user.id}).populate('user',['name', 'avatar'])

  if(!CurrentProfile){
    return res.status(400).send({msg:'No profile found for this user'})
  }

  res.json(CurrentProfile);
});

//Route #2
// route: @POST /api/profiles/me
// desc: @Create or update new profile 
// access: private

router.post('/',[auth, 
  check("status").not().isEmpty(), 
  check('skills').not().isEmpty()
], async (req,res)=>{


  let errors = validationResult(req)

  if(!errors.isEmpty()){

    res.status(400).send({errors:errors.array()})
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body


  let ProfileObject = {}
  
  if(company)ProfileObject.company=company; 
  if(website)ProfileObject.website=website; 
  if(location)ProfileObject.location=location; 
  if(bio)ProfileObject.bio=bio; 
  if(status)ProfileObject.status=status; 
  if(githubusername)ProfileObject.githubusername=githubusername; 

  if(skills){
    ProfileObject.skills= skills.split(',').map(skill=>skill.trim())
    // console.log(ProfileObject.skills)
  }

  ProfileObject.social={}

  if(youtube)ProfileObject.social.youtube=youtube;
  if(facebook)ProfileObject.social.facebook=facebook;
  if(instagram)ProfileObject.social.instagram=instagram;
  if(linkedin)ProfileObject.social.linkedin=linkedin;
  if(twitter)ProfileObject.social.twitter=twitter;

  
  try {

    //check if profile already Exist

    let profile = await Profile.findOne({user:req.user.id}); 

    
    if(profile){
      let profile = await Profile.findOneAndUpdate({user:req.user.id}, {$set:ProfileObject},{new:true, useFindAndModify:false })

      res.json(profile)

    }
    else{
      ProfileObject.user = req.user.id;
      let profile = new Profile(ProfileObject); 
      let result = await profile.save()
      res.json(result)
    }
    // res.send({})
  } catch (error) {
    
    // console.log(error)
    res.status(500).send([{msg:'Server Error'}])
  }

}
)

//Route #3
// route: @GET /api/profiles
// desc: @Get All Profiles
// access: Public

router.get('/',async (req, res)=>{

  let profiles = await Profile.find().populate('user',["name","avatar"]);

  if(!profiles){
    res.status(400).send([{msg:'No Profile Found'}])
  }

  res.json(profiles)
  
})

//Route #4
// route: @GET /api/profiles/users/:user_id
// desc: @Get a Profile for user with id user_id
// access: Public

router.get('/user/:user_id',async (req, res)=>{

  try {
    
    let profile = await Profile.findOne({user:req.params.user_id}).populate('user',["name","avatar"]);

  if(!profile){
    return res.status(400).send([{msg:'Profile Not Found'}])
  }

  res.json(profile)
  } catch (error) {

    if(error.kind==='ObjectId')
   {
     return res.status(400).send([{msg:'Profile not Found- Make sure ID is correct'}])
   }

  return res.status(500).send({msg:'Server Error'})
    
  }
})


//Route #5
// route: @DELETE /api/profiles/
// desc: @DELETE user Profile's, Posts and Users 
// access: Private

router.delete('/',auth, async (req,res)=>{

  try {
    //TODO: DELETE ALL POSTS 

    //Delete Profile
    let profile = await Profile.findOneAndDelete({user:req.user.id});
    let user = await User.findOneAndDelete({_id:req.user.id});
    res.send({msg:req.user.id})
  } catch (error) {
    console.log(error)
    res.status(500).json({msg:'Server Error'})
  }
})

//Route #6
// route: @PUT /api/profiles/experience
// desc: @PUT Add work Experiences
// access: Private

router.put('/experience',[auth, 

check('title', 'Title is Requried').not().isEmpty(), 
check('company', 'company is Required').not().isEmpty(), 
check('from','start date is required').not().isEmpty()],async (req,res)=>{

  let errors = validationResult(req); 
  if(!errors.isEmpty()){
    return res.status(422).send(errors.array())
  }


  let {
    title, 
    company,
    location, 
    from, 
    to, 
    current,
    description
  } =req.body

  let userExperience = {
    title:title, 
    company:company,
    location:location, 
    from:from, 
    to:to, 
    current:current,
    description:description
  }

  try {
    
    
    let userProfile = await Profile.findOne({user:req.user.id})
    userProfile.experience.unshift(userExperience)
    userProfile.save()
    res.json({userProfile})

  } catch (error) {
    console.log(error)

    res.status(500).send({msg:"Server Error"})
    
  }
})

//Route #7
// route: @DELETE /api/profiles/experience
// desc: @DELETE DELETE work Experience
// access: Private

router.delete('/experience/:id',[auth, 

  check('id', 'ID is Requried').not().isEmpty(), 
],async (req,res)=>{
  
    let errors = validationResult(req); 
    if(!errors.isEmpty()){
      return res.status(422).send(errors.array())
    }
  
    try {      
      
      let userProfile = await Profile.findOne({user:req.user.id})
      let experience = userProfile.experience.filter((exp)=>{
        return exp._id!=req.params.id
      })
      userProfile.experience =experience;
      
      await userProfile.save()
      res.json({userProfile})
  
    } catch (error) {
      
      res.status(500).send({msg:"Server Error"})
      
    }
  
  })
  

  //Route #8
// route: @PUT /api/profiles/education
// desc: @PUT Add Education
// access: Private

router.put('/education',[auth, 

  check('school', 'School is Requried').not().isEmpty(), 
  check('from', 'From date is Required').not().isEmpty(), 
  check('degree', 'Degree is Required').not().isEmpty(), 
  check('fieldofstudy','Field of Study is is required').not().isEmpty()],async (req,res)=>{
  
    let errors = validationResult(req); 
    if(!errors.isEmpty()){
      return res.status(422).send(errors.array())
    }
  
  
    let {
      school, 
      degree,
      fieldofstudy, 
      from, 
      to, 
      current,
      description
    } =req.body
  
    let Education = {
      school, 
      degree,
      fieldofstudy, 
      from, 
      to, 
      current,
      description
    }
  
    try {
      
      let userProfile = await Profile.findOne({user:req.user.id})
      userProfile.education.unshift(Education)
      await userProfile.save()
      res.json({userProfile})
  
    } catch (error) {
    
      res.status(500).send({msg:"Server Error"})
      
    }
  })
  
  //Route #9
  // route: @DELETE /api/profiles/education
  // desc: @DELETE DELETE Education by ID
  // access: Private
  
  router.delete('/education/:id',auth,async (req,res)=>{
    
      try {      
        
        let userProfile = await Profile.findOne({user:req.user.id})
        let education = userProfile.education.filter((edu)=>{
          return edu._id!=req.params.id
        })
        userProfile.education =education;
        
        await userProfile.save()
        res.json({userProfile})
    
      } catch (error) {
        
        res.status(500).send({msg:"Server Error"})
        
      }
    
    })



    // Route #10 
    //@route : GET api/profiles/github/:username
    //@desc : get User Repos from Github  
    // @access public


    router.get('/github/:username',async(req,res)=>{

      try {

   
request(`https://api.github.com/users/${req.params.username}/repos?per_page=5`, function (error, response, body) {

if(error){
 return res.status(response.statusCode).send({msg:'Server Error'})
}

return res.json(body)

  // console.log('body:', body); // Print the HTML for the Google homepage.
});
      } catch (error) {
      console.log(error)  
        res.status(500).send({msg:'Server Error'})
      }
    })
    

module.exports = router;
