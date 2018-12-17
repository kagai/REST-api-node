const User = require('../models/Users')
const auth = require('../models/Auth')
const errors = require('restify-errors')
const rjwt = require('restify-jwt-community');
const bcrypt = require('bcryptjs')
const jwt =  require('jsonwebtoken')
const config = require('../config')

module.exports = server => {

    //REGISTER CUSTOMER
    server.post('/auth/signup', async (req, res, next) => {
        if (!req.is('application/json')){
            return next(
                new errors.InvalidContentError("Expects 'application/json'")
              );
        }

        const {name, email, username, password} = req.body;

        const user = new User({
            name,
            email,
            username,
            password
        });

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, async(err, hash) => {
                //hash password
                user.password = hash
                //save user
                try {
                    const newUser = await user.save();
                    res.send({Msg : 'Added succesfully'}, 201)
                    next();
                } catch (err) {
                    return next(new errors.InternalError(err.message));
                }
            });
        });

             
    });

    //GET USERS

    server.get('/users', rjwt({secret: config.JWT_SECRET }), async (req, res, next) => {
        try {
            const users = await User.find({});
            res.send(users)
            next();
        } catch (err) {
            return next(new errors.InvalidContentError(err));
        }
    });

    server.post('/auth/login', async (req, res, next) => {
        const { email, password } = req.body;
        try {
            // Authenticate
            const user = await auth.login_auth(email, password);
            const token = jwt.sign(user.toJSON(), config.JWT_SECRET, {
                expiresIn : '15m'
            });
            const {iat, exp} = jwt.decode(token)
            res.send({iat, exp, token})
            next();
        } catch (err) {
            // Unathorized 
            return next(new errors.UnauthorizedError(err));      
        }
    });

};

