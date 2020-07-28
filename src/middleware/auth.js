const jwt = require('jsonwebtoken')
const User = require('../models/user')

// middleware to verify authentication token
const auth = async (req, res, next) => {
    try {
        // obtains the token given in the request header
        const token = req.header('Authorization').replace('Bearer ', '')
        // verifies the token using the secret
        const decoded = jwt.verify(token, 'thisismynewcourse')
        // find the user with the correct id, who has the correct token stored.
        // this means that user is still logged in, if he/she logged out then the token wouldn't be there
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        // user with id and token was not found
        if (!user) {
            // throws error sending it to the catch
            throw new Error()
        }

        // get the route handler access to the user we already fetch, so it can be used later on
        req.user = user

        next()
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' })
    }
}

module.exports = auth