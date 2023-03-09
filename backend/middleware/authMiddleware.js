const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const {User} = require('../models/userModel')

// Header Example - "authorization": "Bearer <Token>" [For all protected views]
// Of course, end-client must store the token somewhere for this to work. 
// Also, the backend server sets a cookie (site_name_token) having the token.



const middleware = asyncHandler(async (req, res, next) => {

    let token

    if (req.headers.authorization) {
        if (req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }
    } else if (req.cookies.site_name_token) {
            token = req.cookies.site_name_token.split(' ')[1]
        }

    try {

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Get user from the token
        req.user = await User.findById(decoded.id).select('-password')

    } catch (error) {
        req.user = 'anonymous'
        // console.log("couldn't verify token")
    }

    next()

})

module.exports = { middleware }


