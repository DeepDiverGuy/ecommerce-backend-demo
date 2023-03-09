const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')
const cloudinary = require('../config/cloudinary')
let streamifier = require('streamifier')
const {extractPublicId} = require('cloudinary-build-url')

const {User} = require('../models/userModel')
const {Product, Category, Order} = require('../models/productModel')
// const { text } = require('express')



// description: Get products
// route: POST /api/products/getproducts
// access: Public
// body: {"start_from": Number, "limit": Number}
const getAllProducts = asyncHandler(async (req, res) => {

    try {

        start_from = parseInt(req.body.start_from)
        limit = parseInt(req.body.limit)

        if (!start_from || !limit || start_from<1 || limit<1) {
            res.status(422).json({message: 'request body invalid'})
        } else {
            products_count = await Product.countDocuments()
            const products = await Product.find(
                {}, 
                'name brand price deducted_price rating category images_urls stock'
                ).skip(start_from-1).limit(limit).sort({createdAt: -1})

            res.json({total_products: products_count, products})
        }
        
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Get a single product
// route: GET /api/products/product/:id
// access: Public
const getSingleProduct = asyncHandler(async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select('-user').sort('-reviews.createdAt')
        if (!product) {
            res.status(404).json('product not found')
        }

        detailed_reviews = []
        detailed_reviews_setter =  product.reviews.map(async (review) => {
            const user = await User.findById(review.user).select('name image_url')

            user_rate_value = 0
            product.rated_users.some((rated_user) => {
                if (user.id == rated_user.user) {
                    user_rate_value = rated_user.rate_value
                    return true
                }
            })
            item = {
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "image_url": user.image_url,
                    "rate_value": user_rate_value
                },
                "text": review.text,
                "_id": review.id
            }
            detailed_reviews.push(item)
        })
        await Promise.all(detailed_reviews_setter)

        product.reviews = []
        rated_users_count = product.rated_users.length
        product.rated_users = []

        res.json({product, rated_users_count, detailed_reviews})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Get flash-deal products
// route: POST /api/products/flashdeals
// access: Public
// body: {"start_from": Number, "limit": Number}
const getFDProducts = asyncHandler(async (req, res) => {
    try {

        start_from = parseInt(req.body.start_from)
        limit = parseInt(req.body.limit)

        if (!start_from || !limit || start_from<1 || limit<1) {
            res.status(422).json({message: 'request body invalid'})
        } else {
            products_count = await Product.countDocuments({'deducted_price.flash_deal': true})
            const products = await Product.find(
                {'deducted_price.flash_deal': true}, 
                'name brand price stock deducted_price rating category images_urls'
                ).skip(start_from-1).limit(limit).sort({createdAt: -1})

            res.json({total_fd_products: products_count, products})
        }
        
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Get products rating-wise
// route: POST /api/products/toprated
// access: Public
// body: {"start_from": Number, "limit": Number}
const getTRProducts = asyncHandler(async (req, res) => {
    try {

        start_from = parseInt(req.body.start_from)
        limit = parseInt(req.body.limit)

        if (!start_from || !limit || start_from<1 || limit<1) {
            res.status(422).json({message: 'request body invalid'})
        } else {
            products_count = await Product.countDocuments()
            const products = await Product.find(
                {}, 
                'name brand price deducted_price stock rating category images_urls'
                ).skip(start_from-1).limit(limit).sort({rating: -1})

            res.json({total_products: products_count, products})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Get products category-wise
// route: POST /api/products/category/:category
// access: Public
// body: {"start_from": Number, "limit": Number}
const getCProducts = asyncHandler(async (req, res) => {
    try {

        start_from = parseInt(req.body.start_from)
        limit = parseInt(req.body.limit)
        const category = req.params.category

        if (!start_from || !limit || start_from<1 || limit<1) {
            res.status(422).json({message: 'request body invalid'})
        } else {
            products_count = await Product.countDocuments({category})
            const products = await Product.find(
                {category}, 
                'name brand price deducted_price rating stock category images_urls'
                ).skip(start_from-1).limit(limit).sort({createdAt: -1})

            res.status(200).json({total_c_products: products_count, products})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Search products
// route: POST /api/products/search
// access: Public
// body: {"search_string": String, "category": String, "detail": Boolean, "start_from": Number, "limit": Number}
const searchProducts = asyncHandler(async (req, res) => {

    try {

        search_string = req.body.search_string
        category = req.body.category
        detail = req.body.detail
        start_from = parseInt(req.body.start_from)
        limit = parseInt(req.body.limit)

        if (!search_string || !start_from || !limit || start_from<1 || limit<1) {
            res.status(422).json({message: 'request body invalid'})

        } else {

            query_products_count = await Product.countDocuments({
                $and: [
                    category ? {category} : {},
                    {$or: [
                        {name: {$regex: search_string, $options: 'i'}}, 
                        {description: {$regex: search_string, $options: 'i'}},
                        {brand: {$regex: search_string, $options: 'i'}},
                    ]},
                ],
            })

            query_products = await Product.find({
                $and: [
                    category ? {category} : {},
                    {$or: [
                        {name: {$regex: search_string, $options: 'i'}}, 
                        {description: {$regex: search_string, $options: 'i'}},
                        {brand: {$regex: search_string, $options: 'i'}},
                    ]},
                ],
            }, 
            detail ? 'name brand price stock deducted_price rating category images_urls' : 'name',
            ).skip(start_from-1).limit(limit).sort({rating: -1})

            res.json({found: query_products_count, query_products})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }

})

// description: Set product
// route: POST /api/products/create [form-data: data, images]
// access: adminstaff-level-protection
// body.data: {"name": String, "description":String, "brand":String, "price":String, "deducted_price":{"price":String, "flash_deal": Boolean}, "stock":String, "category":String}
const setProduct = asyncHandler(async (req, res) => {

    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }

        const data = JSON.parse(req.body.data)

        // Check for product details
        if (!data.name || !data.description || !data.price || !data.stock || !data.category) {
            res.status(400).json({message: 'required fields missing'})
            return
        }

        const created_product = await Product.create({
            user: req.user.id,
            name: data.name,
            description: data.description,
            brand: data.brand,
            price: data.price,
            deducted_price: data.deducted_price,
            stock: data.stock,
            category: data.category,
            images_urls: []
        })

        const product = await Product.findById(created_product.id).select('-user')

        let images = req.files.images

        if (images) {           
            if(!Array.isArray(images)){
                images = [images]
            }
    
            options = {
                // public_id: String,
                overwrite: false,
                unique_filename: true,
                use_filename: true,
                folder: `products/images/${product.id}/`,             
                resource_type: 'image',
                // transformation: [{if: "w_gt_500_or_h_gt_500", height: 500, width: 500, crop: 'fit' }], 
                access_control: {access_type: "anonymous"},
            }

            i = 0
            images.forEach((image) => {

                // options.public_id = `image-${index}`

                cloudinary_upload_stream = cloudinary.uploader.upload_stream(
                    options, 
                    async (error, result) => {
                        if (error && !res.headersSent) {res.status(201).json({message: "product created, but images didn't upload properly"})}
                        i += 1
                        product.images_urls.push(result.secure_url)
                        if (images.length==i) {
                            await product.save()
                            res.status(201).json({message: "product created"})
                        }
                    }
                    
                )
                streamifier.createReadStream(image.buffer).pipe(cloudinary_upload_stream)
            })

        } else {
            res.status(201).json({message: "product created"})
        }
        

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Update product
// route: PUT /api/products/product/:id
// access: adminstaff-level-protection
// body: {"name": String, "description":String, "brand":String, "price":String, "deducted_price":{"price":String, "flash_deal": Boolean}, "stock":String, "category":String}
const updateProduct = asyncHandler(async (req, res) => {

    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }

        const product = await Product.findById(req.params.id).select('-user')
        if (!product) {
            res.status(404).json('product not found')
        }

        product.name = req.body.name || product.name,
        product.description = req.body.description || product.description,
        product.brand = req.body.brand || product.brand,
        product.price = req.body.price || product.price,
        product.deducted_price = req.body.deducted_price || product.deducted_price,
        product.stock = req.body.stock || product.stock,
        product.category = req.body.category || product.category

        await product.save()

        res.json({message: "product updated"})
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Update images of a product
// route: PUT /api/products/images/:id [form-data: images]
// access: adminstaff-level-protection
const updateProductImages = asyncHandler(async (req,res) => {

    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }

        let images = req.files.images
        let product_id = req.params.id

        if (images) {

            if(!Array.isArray(images)){
                images = [images]
            }

            const product = await Product.findById(product_id).select('-user')
    
            options = {
                // public_id: String,
                overwrite: false,
                unique_filename: true,
                use_filename: true, 
                folder: `products/images/${product_id}/`,               
                resource_type: 'image',
                // transformation: [{ if: "w_gt_500_or_h_gt_500", height: 500, width: 500, crop: 'fit' }], 
                access_control: {access_type: "anonymous"},
            }


            i = 0

            images.forEach((image) => {

                // options.public_id = `image-${index}`
                let cloudinary_upload_stream = cloudinary.uploader.upload_stream(
                    options,
                    async (error, result) => {
                        if (error && !res.headersSent) {res.status(500).json({message: "error occurred"})}
                        i += 1
                        product.images_urls.push(result.secure_url)
                        if (images.length==i) {
                            await product.save()
                            res.status(200).json({images_urls: product.images_urls})
                        }
                    }
                )
                streamifier.createReadStream(image.buffer).pipe(cloudinary_upload_stream)
            })

        } else {
            res.json({message: "no image provided"})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Delete a single image of a product
// route: DELETE /api/products/images/delete
// access: adminstaff-level-protection
// body: {"image_url": String}
const deleteProductImage = asyncHandler(async (req, res) => {
    
    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }

        image_url = req.body.image_url

        if (image_url) {

            const publicId = extractPublicId(image_url)
            const productId = publicId.split('/')[2]
            const product = await Product.findById(productId)


            cloudinary.api.delete_resources(
                publicId, 
                async function(error, result) { 
                    if (result.deleted[`${publicId}`] == 'deleted') {
                        // image_url_index = product.images_urls.indexOf(image_url)
                        // product.images_urls.splice(image_url_index, 1)
                        product.images_urls.pull(image_url)
                        await product.save()
                        res.status(204).json({ message: `image deleted successfully` })

                    } else if (result.deleted[`${publicId}`] == 'not_found') {
                        // image_url_index = product.images_urls.indexOf(image_url)
                        // if (image_url_index != -1) {
                        //     product.images_urls.splice(image_url_index, 1)
                        //     await product.save()
                        // }
                        product.images_urls.pull(image_url)
                        res.status(404).json({ message: `image not found` })

                    } else {
                        res.status(500).json({ message: `operation failed`, error })
                    }              
                }
            )  
        } else {
            res.json({message: "no image-link provided"})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Delete product
// route: DELETE /api/products/product/:id
// access: adminstaff-level-protection
const deleteProduct = asyncHandler(async (req, res) => {
    
    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }

        const product = await Product.findById(req.params.id).select('-user')

        // Check for product
        if (!product) {
            res.status(404).json({message: 'product not found'})
            return
        }

        await product.remove()  // deleted_product = await product.remove()
        cloudinary.api.delete_resources_by_prefix(`products/images/${req.params.id}/`, 
            // function(error, result){
            //     console.log(result);
            //   }
            )
        res.status(204).json({ message: "the product and affiliated media files are deleted permanently" })
        // res.status(204).json({ deleted_product })

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Get all categories
// route: GET /api/products/categories
// access: Public
const getAllCategories = asyncHandler(async (req, res) => {
    try {
        const categories = await Category.find()
        res.json(categories)
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})
// description: Create category
// route: POST /api/products/categories
// access: adminstaff-level-protection
// body: {"name": String}
const setCategory = asyncHandler(async (req, res) => {

    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }
        
        if (!req.body.name) {
            res.status(400).json({message: 'required fields missing'})
        }

        new_category = await Category.create({name: req.body.name})
        const categories = await Category.find()
        res.json(categories)

    } catch (error) {
        res.json({message: 'category already exists or other error occurred'})
    }
})

// description: Delete category
// route: DELETE /api/products/categories/:name
// access: adminstaff-level-protection
const deleteCategory = asyncHandler(async (req, res) => {
    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }

        if (!req.params.name) {
            res.status(400).json({message: 'required parameter missing'})
        }

        const category = await Category.findOneAndRemove({name: req.params.name})
        if (category) {
            res.status(200).json({message: `${category} deleted`})
        } else {
            res.status(404).json({message: 'category not found'})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Get orders
// route: GET /api/products/orders
// access: adminstaff-level-protection
const getOrders = asyncHandler(async (req, res) => {
    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }

        const orders = await Order.find().sort({createdAt: -1})
        res.json(orders)
    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Create order
// route: POST /api/products/orders
// access: user-level-protection
// body: {"product_info": [{"product": String, "quantity": Number}, ], "name": String, "phone": String, "delivery_address": String, "district": String, "country": String, "paymentmethod":String(cash/online)}
const setOrder = asyncHandler(async (req, res) => {

    try {

        let user = req.user

        // Check for logged-in user
        if (user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const { product_info, name, phone, delivery_address, district, country, paymentmethod} = req.body

        if (!product_info || !name || !phone || !delivery_address || !district || !country ||!paymentmethod) {
            res.status(400).json({message: "required fields missing"})
            return
        }

        // The code below checks if the ordered products are available in stock, also calculates the products' price

        out_of_stock = []
        products_price = 0
        product_info_iterator = product_info.map( 
            async (item) => {
                const product = await Product.findById(item.product, 'name stock price deducted_price')
                if (product.stock < item.quantity) {
                    item.available_stock = product.stock
                    out_of_stock.push(item)
                }
                if (product.deducted_price.price) {
                    products_price += product.deducted_price.price*item.quantity
                } else {
                    products_price += product.price*item.quantity
                }
            }
        )
        
        await Promise.all(product_info_iterator)

        if (out_of_stock[0]) {
            res.json({out_of_stock})
            return
        }

        payment_status = 'not paid'

        if (paymentmethod == 'online') {

            paid = true  // WARNING, NOTE: You need to validate the payment here

            if (paid) {
                payment_status = 'paid'
            } else {
                res.json({message: 'payment not received'})
                return  // If we want to still create the order with <payment_status = 'not paid'>, then we can comment out this <return>
            }
        }

        shipping_cost = 100

        await Order.create({product_info, ordered_by: user.id, name, phone, delivery_address, district, country, products_price, shipping_cost, payment_method: paymentmethod, payment_status})

        product_info.forEach(item => {
            user.cart.pull({product: item.product})
        })

        await user.save()

        res.status(201).json({message: "order creation successful"})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Complete order
// route: PUT /api/products/orders/:id
// access: adminstaff-level-protection
// body: {"status": String(pending/completed/cancelled)}
const updateOrder = asyncHandler(async (req, res) => {

    try {

        // Check for Admin or Staff
        if (!req.user.is_admin || !req.user.is_staff) {
            res.status(403).json({message: 'not authorized, not admin nor staff'})
            return
        }
        
        if (req.body.status == 'completed') {
            const completedorder = await Order.findByIdAndUpdate(req.params.id, {status: req.body.status, payment_status: 'paid', completion_date: Date.now()}, {new: true})

            completedorder.product_info.forEach(async(item) => {
                const sold_product = await Product.findById(item.product)
                sold_product.sold += item.quantity
                sold_product.stock -= item.quantity
                await sold_product.save()
            })
            
        } else if (req.body.status == 'cancelled') {
            await Order.findByIdAndUpdate(req.params.id, {status: 'cancelled'}, {new: true})
        }
        res.status(200).json(completedorder)

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description:  Rate a product
// route: POST /api/products/rate
// access: user-level-protection
// body: {"product": String, "rate_value": Number}
const rateProduct = asyncHandler(async (req,res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const product = await Product.findById(req.body.product)
        const user = req.user
        const rate_value = req.body.rate_value

        try {
            product_with_info = await Product.findOne({_id: req.body.product}).select({rated_users: {$elemMatch: {user: user.id}}})
            previous_rate_value = product_with_info.rated_users[0].rate_value
        } catch (error) {
            previous_rate_value = 0
        }

        const updated_product = await Product.updateOne(
            {_id: req.body.product, 'rated_users.user': req.user.id}, 
            {
                '$set': 
                {
                    'rated_users.$.rate_value': req.body.rate_value, 
                }
            }
        )
        
        if (updated_product.modifiedCount == 0) {
            product.rated_users.push({user: user.id, rate_value: rate_value})
            product.total_rate_value += rate_value
        } else if (updated_product.modifiedCount == 1) {
            product.total_rate_value = product.total_rate_value - previous_rate_value + rate_value
        }

        product.rating = parseFloat((product.total_rate_value/product.rated_users.length).toFixed(2))
        await product.save()

        res.json({"rating": parseFloat(`${product.rating}`)})

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description:  Remove rating from a product
// route: POST /api/products/rateremove
// access: user-level-protection
// body: {"product": String}
const removeRating = asyncHandler(async (req, res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const product = await Product.findById(req.body.product)
        const user = req.user

        try {
            product_with_info = await Product.findOne({_id: req.body.product}).select({rated_users: {$elemMatch: {user: user.id}}})
            previous_rate_value = product_with_info.rated_users[0].rate_value
        } catch (error) {
            previous_rate_value = 0
        }

        if (previous_rate_value != 0) {
            product.total_rate_value -= previous_rate_value
            product.rated_users.pull({user: user.id})
            product.rating = parseFloat((product.total_rate_value/(product.rated_users.length-1)).toFixed(2))
            await product.save()
            res.json({"rating": parseFloat(`${product.rating}`)})
        } else {
            res.status(404).json({message:"rating not found"})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }

})

// description: Create a review
// route: POST /api/products/reviews
// access: user-level-protection
// body: {"product": String, "text": String}
const createReview = asyncHandler(async (req,res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const product = await Product.findById(req.body.product)
        const user = req.user
        const text = req.body.text
        
        if (user && (text!='')) {
            review = product.reviews.push({user: user.id, text})
            await product.save()
            res.json(product.reviews)
        } else {
            res.status(400).json({message:"required fields missing"})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description: Update a review
// route: PUT /api/products/reviews/:id
// access: user-level-protection
// body: {"product": String, "text": String}
const updateReview = asyncHandler(async (req,res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const updated_text = req.body.text
        const user = req.user

        if (!updated_text || updated_text=='') {
            res.status(400).json({message:"required fields missing"})
        }

        const product_with_info = await Product.findOne({_id: req.body.product}).select({reviews: {$elemMatch: {_id: req.params.id}}})

        const review = product_with_info.reviews[0]

        if (!review) {
            res.status(404).json({message: 'review not found'})
        }

        if (review.user == user.id) {
            const updated_product = await Product.updateOne(
                {_id: req.body.product, 'reviews._id': req.params.id}, 
                {
                    '$set': 
                    {
                        'reviews.$.text': updated_text, 
                    }
                }
            )

            if (updated_product.modifiedCount == 1) {
                const product = await Product.findById(req.body.product)
                res.json(product.reviews)
            } else {
                if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
            }
            
        } else {
            res.status(403).json({message: 'permission denied'})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }
})

// description:  Remove review from a product
// route: DELETE /api/products/reviews/:id
// access: user-level-protection
// body: {"product": String}
const deleteReview = asyncHandler(async (req, res) => {

    try {

        // Check for logged-in user
        if (req.user == 'anonymous') {
            res.status(403).json({message: 'not logged in'})
            return
        }

        const product = await Product.findOne({_id: req.body.product})
        const user = req.user

        const product_with_info = await Product.findOne({_id: req.body.product}).select({reviews: {$elemMatch: {_id: req.params.id}}})

        const review = product_with_info.reviews[0]
        
        if (!review) {
            res.status(404).json({message: 'review not found'})
        }

        if (review.user == user.id) {
            product.reviews.pull({_id: review._id})
            await product.save()
            res.status(204).json({deleted:`${review.text}`})
        } else {
            res.status(403).json({message: 'permission denied'})
        }

    } catch (error) {
        if (!res.headersSent) {res.status(500).json({message: "error occurred"})}
    }

})

module.exports = {
    getAllProducts,
    getSingleProduct,
    getFDProducts,
    getTRProducts,
    getCProducts,
    searchProducts,
    setProduct,
    updateProduct,
    updateProductImages,
    deleteProductImage,
    deleteProduct,
    getAllCategories,
    setCategory,
    deleteCategory,
    getOrders,
    setOrder,
    updateOrder,
    rateProduct,
    removeRating,
    createReview,
    updateReview,
    deleteReview,
}


