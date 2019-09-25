var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth')
var { check, validationResult } = require('express-validator')

var User = require('../model/Users');
var Post = require('../model/Post');
var Profile = require('../model/Profile')

/* 
  route: POST api/posts
  desc:  Create a post
  access: private

*/
router.post('/', [auth,
  check('text', "post Text is Required").not().isEmpty()], async (req, res) => {

    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select("-password")

      let newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post)

    } catch (error) {
      console.log(error)
      return res.status(500).send({ msg: "Server Error" })
    }


    // res.send('Post API');
  });


/* 
  route: GET api/posts
  desc:  Get all posts
  access: private

*/

router.get('/', auth, async (req, res) => {

  try {
    let posts = await Post.find().sort({ date: -1 })
    res.json(posts)
  } catch (error) {
    return res.status(500).send({ msg: 'Server Error' })
  }

  return
})


/* 
  route: GET api/posts/:post_id
  desc:  Get a single post 
  access: private

*/

router.get('/:post_id', auth, async (req, res) => {

  try {
    let post = await Post.findById(req.params.post_id)

    if (!post) return res.status(404).send({ msg: 'Post not found' })

    res.json(post)
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).send({ msg: 'Post not found' })
    }
    return res.status(500).send({ msg: 'Server Error' })
  }

  return
})


/* 
  route: DLETE api/posts/:post_id
  desc:  Get a single post 
  access: private

*/

router.delete('/:post_id', auth, async (req, res) => {

  let post = await Post.findOne({ user: req.user.id, _id: req.params.post_id })
  if (!post) {
    return res.status(404).send({ msg: 'No post found' })
  }
  await post.deleteOne()
  res.send({ msg: 'post Removed successfully' })

})


/* 
  route: PUT api/posts/like/:post_id
  desc:  add user ID to post.like array
  access: private

*/

router.put('/like/:post_id', auth, async (req, res) => {
  try {
    var post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: 'No post found' })
    }

    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: 'post Already Liked' })
    }
    post.likes.unshift({ user: req.user.id })
    await post.save()

    res.send({ msg: 'Success' })
  } catch (error) {

    console.log(error)
    return res.status(500).send(error.errors)
  }
})

/* 
  route: PUT api/posts/unlike/:post_id
  desc:  remove user ID from post.like array
  access: private

*/

router.put('/unlike/:post_id', auth, async (req, res) => {

  try {
    var post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: 'No post found' })
    }


    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {

      var likes = post.likes.filter(function (value, index, arr) {

        return value.user.toString() !== req.user.id;
      }
      )
      post.likes = likes
    }
    await post.save()

    res.send({ msg: 'Success' })


  } catch (error) {

    console.log(error)
    return res.status(500).send(error.errors)
  }
})



/* 
  route: PUT api/posts/:post_id/comment
  desc:  Add comment to a post
  access: private

*/

router.put('/:post_id/comment', [auth, 
check('text','Text is needed').not().isEmpty()], async (req, res) => {

  let errors = validationResult(req);
  if(!errors.isEmpty()){
    res.status(422).send(errors.array())
  }
  try {
    var post = await Post.findById(req.params.post_id);
    var user = await User.findById(req.user.id).select("-password")

    if (!post) {
      return res.status(404).send({ msg: 'No post found' })
    }

    var newComment = {
      text:req.body.text, 
      name:user.name, 
      avatar:user.avatar, 
      user:req.user.id

    }
  
    post.comments.unshift(newComment)
    await post.save()

    res.send({ msg: 'Success' })
  } catch (error) {

    console.log(error)
    return res.status(500).send(error.errors)
  }
})


/* 
  route: PUT api/posts/unlike/:post_id
  desc:  remove user ID from post.like array
  access: private

*/

router.put('/:post_id/comment/:comment_id', auth, async (req, res) => {

  try {
    var post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: 'No post found' })
    }

    if (post.comments.filter(comment => comment.user.toString() === req.user.id).length > 0) {

      var comments = post.comments.filter(function (comment, index, arr) {
        return comment.id !== req.params.comment_id;
      }
      )
      post.comments = comments
     
    } else{
      return res.send({msg:'No Comment from this user'})
    }
    let queryResult = await post.save()

    res.send(queryResult)


  } catch (error) {

    console.log(error)
    return res.status(500).send(error.errors)
  }
})

module.exports = router;
