const express = require('express')
const multer = require('multer')

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
// { dest: 'uploads/products/' }


const { middleware } = require('../middleware/authMiddleware')

const {
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
} = require('../controllers/userController')


// /api/users
// Note: parameter-links should be below the non-parameter ones

router.post('/registration', upload.fields([{ name: 'data' }, { name: 'images', maxCount:1}]), registerUser)
router.post('/login', middleware, loginUser)
router.get('/logout', middleware, logoutUser)

router.route('/profile').get(middleware, getUserProfile).put(middleware, updateUserProfile)
router.route('/profile/images/profilepic').post(middleware, upload.fields([{ name: 'images', maxCount:1}]), updateUserProfilePic).delete(middleware, deleteUserProfilePic)

router.post('/passwordchange', middleware, changeUserPassword)
router.post('/passwordresetrequest', requestResetUserPassword)
router.post('/passwordreset', resetUserPassword)

router.route('/wishlist').get(middleware, getWish).put(middleware, setUpdateWish)
router.delete('/wishlist/:product_id', middleware, deleteWish)

router.route('/cart').get(middleware, getCart).put(middleware, setUpdateCart)
router.delete('/cart/:product_id', middleware, deleteCart)

router.get('/orders', middleware, userOrders)

router.post('/admincreation', middleware, createAdmin)
router.post('/staffcreation', middleware, createStaff)

module.exports = router