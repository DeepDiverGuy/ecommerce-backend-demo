const express = require('express')
const multer = require('multer')

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
// { dest: 'uploads/products/' }


const { middleware } = require('../middleware/authMiddleware')

const {
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
} = require('../controllers/productController')



// /api/products
// Note: parameter-links should be below the non-parameter ones

router.route('/getproducts').post(getAllProducts)
router.route('/create').post(middleware, upload.fields([{ name: 'data' }, { name: 'images'}]), setProduct)
router.get('/product/:id', getSingleProduct)
router.route('/product/:id').put(middleware, updateProduct).delete(middleware, deleteProduct)
router.post('/flashdeals', getFDProducts)
router.post('/toprated', getTRProducts)
router.post('/category/:category', getCProducts)

router.post('/search', searchProducts)

router.route('/images/delete').delete(middleware, deleteProductImage)
router.route('/images/:id').put(middleware, upload.fields([{ name: 'images' }]), updateProductImages)

router.route('/categories').get(getAllCategories).post(middleware, setCategory)
router.delete('/categories/:name', middleware, deleteCategory)

router.route('/orders').get(middleware, getOrders).post(middleware, setOrder)
router.put('/orders/:id', middleware, updateOrder)

router.post('/rate', middleware, rateProduct)
router.post('/rateremove', middleware, removeRating)

router.post('/reviews', middleware, createReview)
router.put('/reviews/:id', middleware, updateReview)
router.delete('/reviews/:id', middleware, deleteReview)

module.exports = router