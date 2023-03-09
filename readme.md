# E-Commerce Backend (MERN Stack API Server)


## Description
This is an API Server, enough to run a big E-Commerce site. Created in MERN stack. Development is still in progress. This is an ongoing project of mine. Please see the 'Features' section below to understand this server's capabilities. 

NOTE: You need to use Postman or other services to send requests after you've started the development server. The API Documentation is available here: https://docs.google.com/spreadsheets/d/1L9ITnaV0bEz1Q37mKeS4ktmurd_sDOcJdDMYUkASYJQ. Also, the server won't start without setting the virtual environments inside '.env' file. For security reasons, I'm not sharing mine publicly. You can easily set-up those with your own configurations inside the file. Just provide values for the specified fields inside '.env' file, currently these are empty. [You only need to set MongoDB & Cloudinary configurations. Look inside the file]


## Installing dependencies & Starting The Server

```
# Installing Backend dependencies
npm install

# Start the backend development server
npm run dev_backend

# If you start the server without setting the environment variables, you will get errors. Look inside "NOTE" from the 'Description' section.
```


# Features

## Tools used

- Node.js & Express.js: for backend server (up-to-date codes)
- JWT (JasonWebToken) & bcrypt.js: for authentication system
- Mongoose.js: for interacting with MongoDB (used complex queries for faster permformance)
- MongoDB: as the database
- Cloudinary: Media storage (conditional optimization has been used)
- Multer: for handling Media files in the backend (in-memory storage has been used)
- Nodemailer: for handling Emails
- .env file: for using Environment Variables (just for the development)
- Appropriate Request Methods (GET, POST, PUT, DELETE) & Status-codes have been used
- Brief documentations with codes


## Functionalities

<b>PRODUCTS HANDLING Functionalities</b>
- Admin & User protections on relavant routes
- 'Retrieving Products Information' APIs using different filterations (MongoDB), with request-controlled-pagination. Filterations include: category-based, sorting with timestamps, sorting by checking boolean values etc.
- PRODUCTS-SEARCHING API (using different fields)
- Creating, Updating & Deleting product informations (Admin protected route)
- Handling Media files for the products (using CLOUDINARY)
- Setting & updating orders with user informations
- Rating Products & storing each user's ratings
- Reviewing Products & storing each user's reviews
- Auto-updating stocks and carts upon succcessful orders
- & MUCH MORE

<b> AUTHENTICATION & USER Functionalities: </b>
- Used JWT authentication. It has its own BUILT-IN AUTHENTICATION SYSTEM (NO third-party auth system has been used like firebase oauth, oauth2.0 etc)
- User registration, login, logout system, Updating profiles with appropriate permissions
- Uploading or deleting profile pictures from Cloudinary & MongoDB (image link)
- Changing user password
- Resetting password with email verification using OTP
- Setting, updating, deleting from User-CART (connected to MongoDB)
- Setting, updating, deleting from User-WISHLIST (connected to MongoDB)
- Creating Admin (Admin-protected route)
- Creating Staff (Admin-protected route)
- & MORE

<b>Middlewares:</b>
- authMiddleware.js detects if the request has any valid user and populates the "request" dictionary accordingly
- errorMiddleware.js handles errors

<b>Models:</b>
- productModel.js has 3 mongoose.Schema currently: productSchema, orderSchema, categorySchema
- userModel.js has 2 mongoose.Schema currently: userSchema, otpSchema

<b>Config Files</b>
- I have set-up different configuration files explicitly (inside 'config' folder). It's a proper way of following the 'DRY' principal.


## Backend API Documentation

Spreadsheet Link: https://docs.google.com/spreadsheets/d/1L9ITnaV0bEz1Q37mKeS4ktmurd_sDOcJdDMYUkASYJQ


## To connect to MongoDB explicitly

- Mongo URI: [Private, not needed]


## To use cloudinary console

Go to cloudinary website and sign-in with below credentials

- email = [Private, not needed]
- password = [Private, not needed]


## To get Mock Emails (otp, which are sent from this backend)

Go to https://ethereal.email and sign-in with below credentials:

- email = general.nikolaus17@ethereal.email
- password = hbwCXtXtKQ3TCmArz3


## Production checks (backend)

- Remove .env file & set virtual environments in the production server host
- & More Coming


## JSON formats for testing common APIs

- user registraion:
```
    {
        "name": "name",
        "email": "",
        "phone": "",
        "password": "",
        "b_date": "2002-01-01",
        "address": "Bangladesh"
    }
```

- user/admin login:
```
    {
        "email": "",
        "password": ""
    }
```

- product registration:
```
    {
        "name": "product-name",
        "description": "product-description",
        "brand": "brand-1",
        "price": 10000,
        "deducted_price": {
        "price": 8000,
        "flash_deal": false
        },
        "stock": 25,
        "category": "cat-1"
    }
```
