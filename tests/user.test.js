const request = require('supertest')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/user')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: '56what!!',
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
}

// lifecycle methods (ex: beforeEach, afterEach, beforeAll, afterAll, etc.)
// beforeEach runs before each test case
beforeEach(async () => {
    // deletes all users in the database
    await User.deleteMany()
    // adds dummy user from above to database so tests can have a dummy user
    await new User(userOne).save()
})


// POST: Creating a new user
test('Should signup a new user', async () => {
    // gets the response from the request
    const response = await request(app).post('/users').send({
        name: 'Felipe Pineda',
        email: 'fopineda95@gmail.com',
        password: 'MyPass777!'
    }).expect(201)

    // assert that the database was changed correctly and user exists
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // assertions about the response body object
    expect(response.body).toMatchObject({
        user:{
            name: 'Felipe Pineda',
            email: 'fopineda95@gmail.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('MyPass777!')
})

// POST: login user
test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    // asserts user token provided matches second token in database
    // Second token is desired as first token was created in beforeEach and that won't be matching
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

// POST: login user
test('Should not login nonexisting user', async () => {
    await request(app).post('/users/login').send({
        email: 'bad-email',
        password: 'bad-password'
    }).expect(400)
})


// GET: get user profile
test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

// GET: get user profile
test('Should not get profile for user for unauthenticated user', async () => {
    // send without authentication token
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

// DELETE: delete user account
test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    // uses response to assert that the database was changed correctly
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

// DELETE: delete user account
test('Should not delete account for unauthenticated user', async () => {
    // send without authentication token. Also, expecting 401 as not authenticated even though route says 500 is sent
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})