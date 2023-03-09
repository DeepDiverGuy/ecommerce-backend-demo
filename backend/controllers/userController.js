const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const sendEmail = require("../utils/sendEmail")
const otpGenerator = require('otp-generator')
const cloudinary = require('../config/cloudinary')
let streamifier = require('streamifier')

const {Product, Order} = require('../models/productModel')
const {User, OTP} = require('../models/userModel')


// description: Register new user
// route: POST /api/users/registration [form-data: data, images]
// access: Public
// body.data: {"name":String, "email":String, "phone":String, "password":String, "b_date":String, "address":String}
const registerUser = asyncHandler(async (req, res) => {
    try {

        if (req.user != 'anonymous') {
            res.status(400).json({message: "log out first"})
            return 
        }

        const data = JSON.parse(req.body.data)
        
        const { name, email, phone, password, b_date, address } = data

        if (!name || !email || !password || !b_date) {
            res.status(400).json({message: "required fields missing"})
            return
        }

        // Check if user exists
        const userExists = await User.findOne({ email })

        if (userExists) {
            res.status(422).json({message: 'user with the given email exists'})
            return
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            b_date: b_date,
            address,
            image_url: ''
        })

        if (user) {

            // token = generateToken(user._id)
            const image = req.files.images

            if (image) {
        
                options = {
                    public_id: `${user.id}`,
                    resource_type: 'image',
                    overwrite: true,
                    unique_filename: true,
                    use_filename: false,
                    folder: `users/profile/images/profilepic/`,  
                    transformation: [{if: "w_gt_500_or_h_gt_500", height: 500, width: 500, crop: 'fit' }],
                    access_control: {access_type: "anonymous"},
                }

                let cloudinary_upload_stream = cloudinary.uploader.upload_stream(
                    options,
                    async function(error, result) {
                        if (error) {
                            if (!res.headersSent) res.status(201).json({message: "user created, but image didn't upload", user})
                        } else {
                            user.image_url = result.secure_url
                            await user.save()
                            res.status(201).json({message: "user creation successful"})
                        }
                    }
                )
                streamifier.createReadStream(image[0].buffer).pipe(cloudinary_upload_stream)

            } else {
                res.status(201).json({message: "user creation successful"})
            }

        } else {
            res.status(422).json({message: 'invalid data, user not created.'})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Authenticate a user
// route: POST /api/users/login
// access: Public
// body: {"email": String, "password": String}
const loginUser = asyncHandler(async (req, res) => {

    try {

        if (req.user != 'anonymous') {
            res.json({message: "already logged in"})
            return
        }
    
        const { email, password } = req.body
    
        const user = await User.findOne({email})
    
        if (user && (await bcrypt.compare(password, user.password))) {
            token = generateToken(user._id)
            res.cookie('site_name_token', 'Bearer '+token).json({message: "logged in", token})
        } else {
            res.json({message: "invalid credentials"})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Get user data
// route: GET /api/users/profile 
// access: user-level-protection
const getUserProfile = asyncHandler(async (req, res) => {
    try {

        const user = req.user

        if (user == 'anonymous') {
           res.status(403).json({message: "not logged in"})

        } else {

            user_id = user.id
            user_name = user.name
            user_email = user.email
            user_phone = user.phone
            user_b_date = user.b_date
            user_address = user.address
            user_createdAt = user.createdAt
            user_updatedAt = user.updatedAt

            res.json({
                "_id": user_id, 
                "name": user_name, 
                "email": user_email, 
                "phone": user_phone, 
                "b_date": user_b_date, 
                "address": user_address, 
                "createdAt": user_createdAt,
                "updatedAt": user_updatedAt
            })
        }
        
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
    
})

// description: Update user profile data
// route: PUT /api/users/profile
// access: user-level-protection
// body: {"name":String, "email":String, "phone":String, "b_date":String, "address":String}
const updateUserProfile = asyncHandler(async (req,res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }
        
        updateduser = req.user
        
        updateduser.name = req.body.name || req.user.name
        updateduser.email = req.body.email || req.user.email
        updateduser.phone = req.body.phone || req.user.phone
        updateduser.b_date = req.body.b_date || req.user.b_date
        updateduser.address = req.body.address || req.user.address

        await updateduser.save()
        // const updateduser = await User.findByIdAndUpdate(req.user.id, req.body, {new: true,})

        res.status(200).json(updateduser)
        
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }

})


// description: Update profile picture
// route: POST /api/users/profile/images/profilepic [form-data: images]
// access: user-level-protection
const updateUserProfilePic = asyncHandler(async (req,res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        let image = req.files.images

        if (image) {

            let user = req.user
        
            options = {
                public_id: `${req.user.id}`,
                resource_type: 'image',
                overwrite: true,
                unique_filename: true,
                use_filename: false,
                folder: `users/profile/images/profilepic/`,  
                transformation: [{if: "w_gt_500_or_h_gt_500", height: 500, width: 500, crop: 'fit' }],
                access_control: {access_type: "anonymous"},
            }

            let cloudinary_upload_stream = cloudinary.uploader.upload_stream(
                options,
                async function(error, result) {
                    if (error) {
                        if (!res.headersSent) res.status(500).json({message: "image didn't upload, error occurred"})
                    } else {
                        user.image_url = result.secure_url
                        await user.save()
                        res.status(200).json({image_url: user.image_url})
                    }   
                }
            )
            streamifier.createReadStream(image[0].buffer).pipe(cloudinary_upload_stream)

        } else {
            res.status(400).json({message: "no image provided"})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})


// description:   Delete profile picture
// route:   DELETE /api/users/profile/images/profilepic
// access:  user-level-protection
const deleteUserProfilePic = asyncHandler(async (req, res) => {
    
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const publicId = `users/profile/images/profilepic/${req.user.id}`
        const user = req.user

        cloudinary.api.delete_resources(
            publicId,
            async function(error, result) { 
                if (result.deleted[`${publicId}`] == 'deleted') {
                    user.image_url = ''
                    await user.save()
                    res.status(204).json({ message: `profile picture deleted successfully` })
                } else if (result.deleted[`${publicId}`] == 'not_found') {
                    user.image_url = ''
                    await user.save()
                    res.status(404).json({ message: `profile picture not found` })
                } else {
                    res.status(500).json({ message: `operation failed`, error })
                }                
            }
        )

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})


// description: Adding products to wishlist's array
// route: PUT /api/users/wishlist
// access: user-level-protection
// body: {"product": String}
const setUpdateWish = asyncHandler(async (req,res) => {
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        product_id = req.body.product

        user.wishlist.forEach(item => {
            if (product_id == item) {
                res.json({message: 'already added'})
                return
            }
        })
        user.wishlist.push(product_id)
        await user.save()

        res.json({message: "added to wishlist"})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Getting wishlist's array
// route: GET /api/users/wishlist
// access: user-level-protection
const getWish = asyncHandler(async (req,res) => {
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        detailed_wishlist = []

        detailed_wishlist_setter = user.wishlist.map(async (product_id) => {
            const product = await Product.findById(product_id).select('name stock images_urls price deducted_price rating')
            detailed_wishlist.push(product)
        })

        await Promise.all(detailed_wishlist_setter)

        res.json(detailed_wishlist)

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Deleting products from wishlist's array
// route: DELETE /api/users/wishlist/:product_id
// access: user-level-protection
const deleteWish = asyncHandler(async (req,res) => {
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        user.wishlist.pull(req.params.product_id)
        await user.save()

        res.json({message: "operation done"})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Adding products to cart's array
// route: PUT /api/users/cart
// access: user-level-protection
// body: {"cart_item": {"product": String, "quantity": Number}}
const setUpdateCart = asyncHandler(async (req,res) => {
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        cart_item = req.body.cart_item

        if (cart_item.quantity <=0) {
            res.status(422).json({message: "invalid quantity"})
        }

        product_exists = false
        user.cart.forEach(item => {
            if (cart_item.product == item.product) {
                product_exists = true
            }
        })
        if (product_exists) {
            res.json({message: 'already added'})
            return
        }

        user.cart.push(cart_item)
        await user.save()
        
        res.json({message: "added to cart"})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Getting cart's array
// route: GET /api/users/cart
// access: user-level-protection
const getCart = asyncHandler(async (req,res) => {
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        detailed_cart = []

        detailed_cart_setter = user.cart.map(async (item) => {
            const product = await Product.findById(item.product).select('name stock images_urls price deducted_price rating')
            detailed_cart.push(product)
        })

        await Promise.all(detailed_cart_setter)

        res.json(detailed_cart)

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Deleting products from cart's array
// route: DELETE /api/users/cart/:product_id
// access: user-level-protection
const deleteCart = asyncHandler(async (req,res) => {
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        user.cart.pull({product: req.params.product_id})
        await user.save()

        res.json({message: "operation done"})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Getting a user's orders
// route: GET /api/users/orders
// access: user-level-protection
const userOrders = asyncHandler(async (req,res) => {
    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        const user_orders = await Order.find({ordered_by: user.id})
        res.json(user_orders)

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Change user password
// route: POST /api/users/passwordchange
// access: user-level-protection
// body: {"old_password":String, "new_password":String}
const changeUserPassword = asyncHandler(async (req,res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const user = req.user
        const {old_password, new_password} = req.body

        if (await bcrypt.compare(old_password, user.password)) {

            // Hash password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(new_password, salt)
    
            await User.findByIdAndUpdate(user.id, {password: hashedPassword}, {
                new: true,
                })
    
            res.status(200).json({message: "password changed successfully"})
    
        } else {
        res.json({message: "invalid password"})
        }
    
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
    
})

// description: Request a password reset
// route: POST /api/users/passwordresetrequest
// access: Public
// body: {"email" : String}
const requestResetUserPassword = asyncHandler(async(req,res) => {

    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user) return res.json({message: "user doesn't exist"})

        const otp_model_exists = await OTP.findOne({ userId: user._id })
        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false })

        if (otp_model_exists) {
            otp_model_exists.otp = otp
            otp_model = await otp_model_exists.save()
        } else {
            otp_model = await new OTP({userId: user._id, otp:otp,}).save()
        }

        await sendEmail(user.email, "Password reset", `Your confirmation code is: ${otp_model.otp}. Please keep in mind that this code expires after 1 hour.`)

        res.json({message: "email sent"})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description:  Reset user password
// route: POST /api/users/passwordreset
// access: Public
// body: {"email" : String, "otp": String, "new_password": String}
const resetUserPassword = asyncHandler(async(req,res) => {
    try {

        const {email, otp, new_password} = req.body

        const user = await User.findOne({email})
        if (!user) return res.json({message: "user doesn't exist"})

        const otp_model = await OTP.findOne({userId: user._id})

        if (!otp_model) return res.json({message: "otp invalid or expired"})

        if (otp_model.otp==otp) {

            // Hash password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(new_password, salt)

            await User.findByIdAndUpdate(user.id, {password: hashedPassword}, {new: true,})
            await otp_model.delete()

            res.json({message:"password reset sucessfully."})
        } else {
            res.json({message: "incorrect otp, try again"})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Log-out a user
// route: GET /api/users/logout
// access: user-level-protection
const logoutUser = asyncHandler(async(req,res) => {

    // Check for logged-in user
    if (req.user == 'anonymous') {
        res.status(403).json({message: 'not logged in'})
        return
    }

    res.clearCookie('site_name_token')
    res.status(200).json({message: "logged out"})
})

// description: Create an admin
// route: POST /api/users/admincreation
// access: admin-level-protection
// body: {"email": String, "phone": String, "password": String}
const createAdmin = asyncHandler(async(req,res) => {

    // Check for Admin
    if (!req.user.is_admin) {
        res.status(403).json({message: 'not authorized, not admin'})
        return
    }
    
    const { email, password } = req.body

    if (!email || !password) {
        res.status(400).json({message: 'required fields missing'})
        return
    }

    // Check if user exists
    const userExists = await User.findOne({ email }) 
    if (userExists) {
        res.status(400).json({message: 'user with the given email exists'})
        return
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = await User.create({
        email,
        phone,
        is_admin: true,
        is_staff: true,
        password: hashedPassword,
    },)

    if (user) {
        res.status(201).json({
            _id: user.id,
            email: user.email,
            phone: user.phone,
            message: "admin created"
    })
    } else {
        res.status(422).json({message: 'invalid data'})
    }

})

// description: Create an admin
// route: POST /api/users/staffcreation
// access: admin-level-protection
// body: {"email": String, "phone":String, "password": String}
const createStaff = asyncHandler(async(req,res) => {

    // Check for Admin
    if (!req.user.is_admin) {
        res.status(403).json({message: 'not logged in'})
        return
    }
    
    const { email, password } = req.body

    if (!email || !password) {
        res.status(400).json({message: 'required fields missing'})
        return
    }

    // Check if user exists
    const userExists = await User.findOne({ email }) 
    if (userExists) {
        res.status(422).json({message: 'user with the given email exists'})
        return
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = await User.create({
        email,
        phone,
        is_staff: true,
        password: hashedPassword,
    },)

    if (user) {
        res.status(201).json({
            _id: user.id,
            email: user.email,
            phone: user.phone,
            message: "staff created"
    })
    } else {
        res.status(422).json({message: 'invalid data'})
    }

})

// Generating JasonWebToken
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
    })
}

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserProfilePic,
    deleteUserProfilePic,
    setUpdateWish,
    getWish,
    deleteWish,
    setUpdateCart,
    getCart,
    deleteCart,
    userOrders,
    changeUserPassword,
    logoutUser,
    requestResetUserPassword,
    resetUserPassword,
    createAdmin,
    createStaff,
}