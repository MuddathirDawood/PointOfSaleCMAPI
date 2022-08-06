const express = require('express');
const cors = require('cors');
const db = require('./config/connection.js');
require('dotenv').config();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.static('view'))
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

const router = express.Router();

const port = parseInt(process.env.PORT) || 4000;
app.use(router, cors(), express.json(), bodyParser.urlencoded({ extended: true }));
app.listen(port, ()=> {console.log(`Server is running on port ${port}`)});

// DISPLAY ALL ENDPOINTS
app.get('/',(req, res)=>{
    res.sendFile(__dirname + "/view/endpoints.html")
})


/* /////////////////////////////////////////////////////////////////// PRODUCTS //////////////////////////////////////////////////////////////// */
// DISPLAY ALL PRODUCTS
router.get('/products', (req, res)=>{
    const productsQ = `
        SELECT * FROM products
    `

    db.query(productsQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            products: results
        })
    })
})

// DISPLAY SINGLE PRODUCT
router.get('/products/:id', (req, res)=>{
    const singleProdQ = `
        SELECT * FROM products WHERE product_id = ${req.params.id}
    ` 

    db.query(singleProdQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            product: results
        })
    })
})

// CREATE A PRODUCT
router.post('/products', bodyParser.json(), (req, res)=>{
    let bd = req.body;
    const createProdQ = `
        INSERT INTO products(title, category, description, image, price, created_by)
        VALUES(?, ?, ?, ?, ?, ?)
    `

    db.query(createProdQ, [bd.title, bd.category, bd.description, bd.image, bd.price, bd.created_by], (err,results)=>{
        if (err) throw err
        res.send('The Product has been added correctly')
    })
})

// DELETE PRODUCT
router.delete('/products/:id', (req, res)=>{
    const deleteUserQ = `
        DELETE FROM products WHERE product_id = ${req.params.id};
        ALTER TABLE products AUTO_INCREMENT = 1;
    `

    db.query(deleteUserQ, (err, results)=>{
        if (err) throw err
        res.send('Product Deleted')
    })
})

/* /////////////////////////////////////////////////////////////////// USERS //////////////////////////////////////////////////////////////// */
// REGISTER USER
router.post('/users', bodyParser.json(), async(req, res)=>{
    const emailQ = `
        SELECT email FROM users WHERE ?
    `
    let email = {
        email: req.body.email
    }

    db.query(emailQ, email, async(err, results)=>{
        if (err) throw err
        // VALIDATION
        if (results.length > 0) {
            res.send("The provided email exists. Please enter another one")
        } else {
            let generateSalt = await bcrypt.genSalt()
            req.body.password = await bcrypt.hash(req.body.password, generateSalt)
            const registerQ = `
                INSERT INTO users(user_fullname, email, password, phone_number, join_date)
                VALUES(?, ?, ?, ?, ?)
            `
        
            db.query(registerQ, [bd.user_fullname, bd.email, bd.password, bd.phone_number, bd.join_date], (err, results)=>{
                if (err) throw err
                res.send('Register Successful')
            })
            
        }
    })

})


// LOGIN USER
router.patch('/users', bodyParser.json(), (req, res)=>{
    const loginQ =`
        SELECT * FROM users WHERE ?
    `
    let user = {
        email: req.body.email
    };

    db.query(loginQ, user, async(err, results)=>{
        if (err) throw err

        if (results.length === 0) {
            res.send('Email Not Found. Please register')
        } else {
            if (await bcrypt.compare(req.body.password, results[0].password) == false) {
                res.send('Password is Incorrect')
            } else {
                const payload = {
                    user: {
                        user_fullname: results[0].user_fullname,
                        email: results[0].email,
                        password: results[0].password,
                        phone_number: results[0].phone_number,
                        join_date: results[0].join_date,
                    }
                };

                jwt.sign(payload, process.env.jwtsecret, {expiresIn: "7d"}, (err, token)=>{
                    if (err) throw err
                    res.json({
                        status: 200,
                        user: results,
                        token: token
                    })
                })
            }
            
        }
    })
})

// GET ALL USERS
router.get('/users', (req, res)=>{
    const allUsersQ = `
        SELECT * FROM users
    `

    db.query(allUsersQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            users: results
        })
    })
})

// GET SINGLE USER
router.get('/users/:id', (req, res)=>{
    const singleUserQ = `
        SELECT * FROM users WHERE user_id = ${req.params.id}
    `

    db.query(singleUserQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            user: results
        })
    })
})

// DELETE USER
router.delete('/users/:id', (req, res)=>{
    const deleteUserQ = `
        DELETE FROM users WHERE user_id = ${req.params.id};
        ALTER TABLE users AUTO_INCREMENT = 1;
    `

    db.query(deleteUserQ, (err, results)=>{
        if (err) throw err
        res.send('User Deleted')
    })
})