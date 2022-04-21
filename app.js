import {fileURLToPath} from "url";
import path from "path";
import express from 'express';
import mysql from 'mysql';

const app = express();
const PORT = 9000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname + '/public')));

const pool = mysql.createPool({
    host: "localhost",
    database: "classicmodel",
    user: "root",
    password: "",
});

console.log(`connected to ${pool.config.connectionConfig.database}`);

app.get('/', (req, res) => {

    pool.query('SELECT * FROM orders ORDER BY orderDate', function (error, results, fields){
        if(error){
            throw Error;
        } else {
            console.log(results);
            res.render("layout", {template: "home", data: results})
        }
    });
})

app.get('/detail/:id', (req, res)=>{
    let id = req.params.id;
    
    pool.query(`
            SELECT customerName, contactLastName, contactFirstName, addressLine1, city
            FROM customers
            JOIN orders 
            ON orders.customerNumber = customers.customerNumber
            WHERE orderNumber = ?
        `, [id], (err, customer) => {
                console.log(customer);
        pool.query(`
                    SELECT productName, priceEach, quantityOrdered, priceEach *quantityOrdered AS totalPrice 
                    FROM orderDetails
                    JOIN products
                    ON products.productCode = orderDetails.productCode
                    WHERE orderNumber = ?
                `, [id], function (err, orderDetail){
                    console.log(orderDetail);

                    pool.query('SELECT SUM(priceEach * quantityOrdered) AS totalAmount FROM orderDetails WHERE orderNumber = ?', [id], function (err, result){

                        let totalAmount = result[0].totalAmount                        
                        console.log(totalAmount);
                        res.render('layout', {
                            template: "detail",
                            customer: customer[0],
                            orderDetail: orderDetail,
                            totalAmount: totalAmount,
                            orderNumber: id,
                        })

                    })
                }
        )

    })
})

app.listen(PORT, ()=>{
    console.log(`Listening at http://localhost:${PORT}`);
})