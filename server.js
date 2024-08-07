require('dotenv').config();
const express = require('express');
const { poolPromise } = require('./db');
const cors = require('cors'); // Import cors package
const app = express();
const port = 8082;

// Initialize the Blob Service Client
const { BlobServiceClient } = require('@azure/storage-blob');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
    throw new Error('Azure Storage connection string is not defined');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerName = "images";
const containerClient = blobServiceClient.getContainerClient(containerName);
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Fetch all products
app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM ListOfProducts');


        // Construct image URLs for each product
        const productsWithImageUrls = result.recordset.map(product => {
            // Debugging output to see product details

            // Assuming 'Image' is the column name for the image filenames
            const imageUrl = `https://cloudwebshopstorage.blob.core.windows.net/` + containerName + `/` + product.image;
            return {
                ...product,
                ImageUrl: imageUrl
            };
        });

        res.json(productsWithImageUrls);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Fetch product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM ListOfProducts WHERE id =' + id
        const pool = await poolPromise;
        const result = await pool.request()
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send('Product not found');
        }

        const product = result.recordset[0];
        const imageUrl = `https://cloudwebshopstorage.blob.core.windows.net/${containerName}/${product.image}`;
        const productWithImageUrl = {
            ...product,
            ImageUrl: imageUrl
        };

        res.json(productWithImageUrl);
    } catch (error) {
        console.error('Error fetching products by category:', error.message);
        res.status(500).send(error.message);
    }
});



// Fetch products by category
app.get('/api/products/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        console.log(`Fetching products in category: ${category}`);
        const pool = await poolPromise;
        const query = "SELECT * FROM ListOfProducts WHERE category='" + category + "'";
        const result = await pool.request()
            .query(query);

        // Construct image URLs for each product
        const productsWithImageUrls = result.recordset.map(product => {
            // Debugging output to see product details
            // console.log(`Product: ${JSON.stringify(product.image)}`);

            // Assuming 'Image' is the column name for the image filenames
            const imageUrl = `https://cloudwebshopstorage.blob.core.windows.net/` + containerName + `/` + product.image;

            console.log(imageUrl);
            return {
                ...product,
                ImageUrl: imageUrl
            };
        });

        res.json(productsWithImageUrls);
    } catch (error) {
        console.error('Error fetching products by category:', error.message);
        res.status(500).send(error.message);
    }
});

// Insert form data
app.post('/api/contact', async (req, res) => {
    try {
        const { username, email, phone, message } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('username', username)
            .input('email', email)
            .input('phone', phone)
            .input('message', message)
            .query('INSERT INTO ContactUS (name, email, phone, message) VALUES (@username, @email, @phone, @message)');
        res.status(201).send({ success: true, message: 'Message inserted successfully!' });
    } catch (error) {
        console.error('Error inserting message:', error.message);
        res.status(500).send(error.message);
    }
});

//Make Order
// Add order insertion endpoint
app.post('/api/orders', async (req, res) => {
    console.log(req.body)
    try {
        const { name, lastname, email, address, paymentid, quantity, productid, amount, orderdate } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', name)
            .input('lastname', lastname)
            .input('email', email)
            .input('address', address)
            .input('paymentid', paymentid)
            .input('quantity', quantity)
            .input('productid', productid)
            .input('amount', amount)
            .input('orderdate', orderdate)
            .query('INSERT INTO orders (name, lastname, email, address, paymentid, quantity, productid, amount, orderdate) VALUES (@name, @lastname, @email, @address, @paymentid, @quantity, @productid, @amount, @orderdate)');
        res.status(201).send({ success: true, message: 'Order inserted successfully!' });
    } catch (error) {
        console.error('Error inserting order:', error.message);
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
