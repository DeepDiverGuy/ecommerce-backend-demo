const mongoose = require('mongoose')

const categorySchema = mongoose.Schema(
    {
    name: {
        type: String,
        required: true,
        unique: true,
    }
    }
)

const productSchema = mongoose.Schema(
    {
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    description: {
        type: String,
        required: [false, 'Please add a description'],
    },
    brand: {
        type: String,
        required: [false, 'Please add a brand'],
        default: null,
    },
    price: {
        type: Number,
        required: [false, 'Please add a price'],
    },
    deducted_price: {
        price: {
            type: Number,
            required: [false, 'Deducted price'],
            default: 0,
        },
        flash_deal: {
            type: Boolean,
            default: false,
            required: [false, 'Is it a flash-deal?'],
        },
    },
    stock: {
        type: Number,
        required: [true, 'Stock availability'],
        default: 0,
    },
    rated_users: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'User',
            },
            rate_value: {
                type: Number,
                required: true,
            },
        }
    ],
    total_rate_value: {
        type: Number,
        default: 0,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
        required: true,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'User',
            },
            text: {
                type: String,
                required: [true, 'Please add a text'],
            },
        },
        
        {timestamps: true,}
    ],
    category: {
        type: String,
        required: [true, 'Product category'],
        ref: 'Category'

    },
    sold: {
        type: Number,
        default: 0,
        required: true,
    },
    images_urls: [String],

    },
    
    {timestamps: true,}
)

const orderSchema = mongoose.Schema(
    {
    
    product_info: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product',
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            },
        }
    ],
    ordered_by: {
        type: String,
        required: false,
        ref: 'User',
    },
    name: {
        type: String,
        required: [true, 'Please provide your name'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number to contact with'],
    },
    delivery_address: {
        type: String,
        required: [true, 'Provide a location for DELIVERY']
    },
    district: {
        type: String,
    },
    country: {
        type: String,
    },
    products_price: {
        type: Number
    },
    shipping_cost: {
        type: Number,
        default: 100
    },
    status: {
        type: String,
        required: true,
        default: 'pending',
    },
    payment_method: {
        type: String,
        required: true,
        default: 'cash',
    },
    payment_status: {
        type: String,
        required: true,
        default: 'not paid',
    },
    completion_date: {
        type: Date,
        required: false,
    },
    },

    {
        timestamps: true,
    }

)

const Product = mongoose.model('Product', productSchema)
const Order = mongoose.model('Order', orderSchema)
const Category = mongoose.model('Category', categorySchema)

module.exports = {Product, Order, Category}