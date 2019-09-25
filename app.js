var express = require('express');
var logger = require('morgan');

//
const dbConnect = require('./config/db')
//

var usersRoute = require('./routes/users');
var profileRoute = require('./routes/profile');
var authRoute = require('./routes/auth');
var postRouter = require('./routes/posts');


var app = express();

const PORT = process.env.PORT || 5000
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/profiles', profileRoute);
app.use('/api/posts', postRouter);

dbConnect();




app.listen(PORT, ()=>{
    console.log(`Server started on PORT ${PORT}`)
})

// module.exports = app;
