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
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
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


/* ----------------------------------------------------------------- PRODUCTS ------------------------------------------------------------------ */
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
    const deleteProdQ = `
        DELETE FROM products WHERE product_id = ${req.params.id};
        ALTER TABLE products AUTO_INCREMENT = 1;
    `

    db.query(deleteProdQ, (err, results)=>{
        if (err) throw err
        res.send('Product Deleted')
    })
})

// EDIT PRODUCT
router.put('/products/:id', bodyParser.json(), (req, res)=>{
    const editProdQ = `
        UPDATE products
        SET title = ?, category = ?, description = ?, image = ?, price = ?
        WHERE product_id = ${req.params.id}
    `

    db.query(editProdQ, [req.body.title, req.body.category, req.body.description, req.body.image, req.body.price], (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            results: 'The product has been edited succesfully'
        })
    })
})

/* ---------------------------------------------------------------- USERS ---------------------------------------------------------------------- */
// REGISTER USER
router.post('/users', bodyParser.json(), async(req, res)=>{
    let bd = req.body
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
            let date = {
                date: new Date().toLocaleDateString(),
              };
            bd.join_date = date.date;  

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

// EDIT USER
router.put('/users/:id', bodyParser.json(), (req, res)=>{
    const editUserQ = `
        UPDATE users
        SET user_fullname = ?, email = ?, phone_number = ?
        WHERE user_id = ${req.params.id}
    `

    db.query(editUserQ, [req.body.user_fullname, req.body.email, req.body.phone_number], (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            results: 'The user has been edited successfully'
        })
    })

})

/* ---------------------------------------------------------------- CART ----------------------------------------------------------------------- */
// GET CART PRODUCTS
router.get('/users/:id/cart', (req, res)=>{
    const cartQ = `
        SELECT cart FROM users 
        WHERE user_id = ${req.params.id}
    `

    db.query(cartQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            cart: JSON.parse(results[0].cart)
        })
    })
})


// ADD PRODUCT TO CART
router.post('/users/:id/cart', bodyParser.json(),(req, res)=>{
    let bd = req.body
    const cartQ = `
        SELECT cart FROM users 
        WHERE user_id = ${req.params.id}
    `

    db.query(cartQ, (err, results)=>{
        if (err) throw err
        if (results.length > 0) {
            let cart;
            if (results[0].cart == null) {
                cart = []
            } else {
                cart = JSON.parse(results[0].cart)
            }
            let product = {
                "cart_id" : cart.length + 1,
                "title" : bd.title,
                "category" : bd.category,
                "description" : bd.description,
                "image" : bd.image,
                "price" : bd.price,
                "created_by" : bd.created_by
            }
            cart.push(product);
            const query = `
                UPDATE users
                SET cart = ?
                WHERE user_id = ${req.params.id}
            `

            db.query(query , JSON.stringify(cart), (err, results)=>{
                if (err) throw err
                res.json({
                    status: 200,
                    results: 'Product successfully added into cart'
                })
            })
        } else {
            res.json({
                status: 404,
                results: 'There is no user with that id'
            })
        }
    })
})

// DELETE CART
router.delete('/users/:id/cart', (req,res)=>{
    const delCart = `
        SELECT cart FROM users 
        WHERE user_id = ${req.params.id}
    `
    db.query(delCart, (err,results)=>{
        if(err) throw err;
        if(results.length >0){
            const query = `
                UPDATE users 
                SET cart = null 
                WHERE user_id = ${req.params.id}
            `
            db.query(query,(err,results)=>{
                if(err) throw err
                res.json({
                    status:200,
                    results: `Successfully cleared the cart`
                })
            });
        }else{
            res.json({
                status:400,
                result: `There is no user with that ID`
            });
        }
    })
})