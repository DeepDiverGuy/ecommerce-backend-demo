// const { v4: uuidv4 } = require('../../node_modules/uuid');
const mongoose = require('mongoose')
// const { stringify } = require('querystring')
// const { boolean } = require('webidl-conversions')

const userSchema = mongoose.Schema(
    {
    name: {
        type: String,
        required: [false, 'Please add a name'],
    },
    is_admin: {
        type: Boolean,
        default: false,
    },
    is_staff: {
        type: Boolean,
        default: false,
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
    },
    phone: {
        type: String,
        required: [false, 'Please add your phone number'],
        unique: false
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    b_date: {
        type: Date,
        required: [false, 'Please add your birth date'],
    },
    address: {
        type: String,
        required: [false, 'Please add your address']
    },
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product',
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        }
    }],
    wishlist: [String],
    image_url: {
        type: String,
        required: false
    }
    },

    {
    timestamps: true,
    }
)

const otpSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600,
    },
})

const User = mongoose.model('User', userSchema)
const OTP = mongoose.model('OTP', otpSchema)

module.exports = {User, OTP}



// Pale data here ~~~~~~~

// orders: [{
//     product: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: 'Product',
//     },
//     quantity: {
//         type: Number,
//         required: true,
//         default: 1,
//     }
// }],