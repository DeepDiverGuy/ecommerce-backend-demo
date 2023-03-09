const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');

const dotenv = require('dotenv').config();
const path = require('path');

const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');



// Connecting to MongoDB
connectDB();

// Declaring express app
const app = express();

app.use(cors());
app.use(cookieParser()); // cookie parser
app.use(express.json());  // body parser
app.use(express.urlencoded({ extended: false }));

app.use(errorHandler);

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// // Serve frontend
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '../frontend/build')));

//     app.get('*', (req, res) =>
//     res.sendFile(
//         path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')
//     )
//     );
// } else {
//     app.get('/', (req, res) => res.send('Please set to production'));
// }

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));