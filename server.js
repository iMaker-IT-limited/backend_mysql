const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const async = require("async");

const app = express();

var corsOptions = {
  origin: "http://localhost:8100",
  // origin: "https://invoice-13rwef23r.web.app",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// const db_ = mysql.createConnection({
//   host: "team-dev-uat-db.cckrz61nf7go.ap-east-1.rds.amazonaws.com",
//   user: "a4develop",
//   password: "pHGqDsHhdgfR2evBUYAKPNxWSSufxdb2",
//   database: "dev_a4lution_cowork",
//   multipleStatements: true,
// });

var db_config = {
  host: "team-dev-uat-db.cckrz61nf7go.ap-east-1.rds.amazonaws.com",
  user: "a4develop",
  password: "pHGqDsHhdgfR2evBUYAKPNxWSSufxdb2",
  database: "dev_a4lution_cowork",
  multipleStatements: true,
};

var db_;

function handleDisconnect() {
  db_ = mysql.createConnection(db_config); // Recreate the connection, since
  // the old one cannot be reused.

  db_.connect(function (err) {
    // The server is either down
    if (err) {
      // or restarting (takes a while sometimes).
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  db_.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

// db_.connect(function (err) {
//   if (err) {
//     throw err;
//   }
//   console.log("Connected to the database!!");
// });

const db = require("./app/models");

db.sequelize.sync();

app.get("/", (req, res) => {
  res.json({ message: "Welcome to AVO application." });
});

app.get("/sales-report", function (request, response) {
  async.series(
    [
      // // all data
      // function (callback) {
      //   db_.query(
      //     `select * from data_dashboard_source`,
      //     function (err, rows, fields) {
      //       console.log("Connection result error " + err);
      //       data = rows;
      //       callback();
      //     }
      //   );
      // },
      // lineChart_1
      function (callback) {
        db_.query(
          `
         SELECT YEAR(report_date) as Year, MONTH(report_date) as Month, client_code, TOTAL_SALES_AMOUNT
         FROM billing_statements
         GROUP BY client_code, YEAR(report_date), MONTH(report_date)
          `,

          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data1 = rows;
            callback();
          }
        );
      },
      // barChart_2
      function (callback) {
        db_.query(
          `
      Select platform, count(id) as count 
      FROM 
      (
      SELECT
		    s.platform,
		    o.*
	    FROM
	    	order_products o
		  JOIN order_sku_cost_details s ON s.op_platform_sales_sku = o.sku
      ) sub
      GROUP BY platform 
          `,
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data2 = rows;
            callback();
          }
        );
      },
      // barChart_3
      function (callback) {
        db_.query(
          `	Select count(id) as count, sku from order_products group by sku ORDER BY count(id) DESC LIMIT 5`,
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data3 = rows;
            callback();
          }
        );
      },
      // lineChart_4
      function (callback) {
        db_.query(
          `SELECT YEAR(report_date) as Year, MONTH(report_date) as Month, client_code, a4_account_advertisement 
          FROM billing_statements
          GROUP BY client_code, YEAR(report_date), MONTH(report_date)
         `,
          // group by EXTRACT(month FROM column_S),EXTRACT(year FROM column_S), avg(column_R)
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data4 = rows;
            callback();
          }
        );
      },
      // Send the response
    ],
    function (error, results) {
      response.json({
        // all: data,
        lineChart_1: data1,
        barChart_2: data2,
        barChart_3: data3,
        lineChart_4: data4,
      });
    }
  );
});

app.get("/data-dashboard", function (request, response) {
  async.series(
    [
      // all data
      function (callback) {
        db_.query(
          // `
          // select *
          // from data_dashboard_source
          // `,

          `  SELECT d.*
          FROM data_dashboard_source d
          WHERE EXISTS (SELECT 1 FROM tutorials t
          WHERE d.subcategory REGEXP CONCAT('[[:<:]]', t.description, '[[:>:]]'))
          `,
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data = rows;
            callback();
          }
        );
      },

      /*   
        SELECT d.*
          FROM data_dashboard_source d
          WHERE EXISTS (SELECT 1 FROM tutorials t
                       WHERE d.subcategory REGEXP CONCAT('[[:<:]]', t.title, '[[:>:]]'));)

       */
      // check table 'tutorials' get title = "Car Electronics Accessories"
      // boxplot_1
      function (callback) {
        db_.query(
          `
SELECT
	product_name,
	price_HKD,
	category,
	subcategory
FROM (
	SELECT
		d.*
	FROM
		data_dashboard_source d
	WHERE
		EXISTS (
			SELECT
				1
			FROM
				tutorials t
			WHERE
				d.subcategory REGEXP CONCAT('[[:<:]]', t.description, '[[:>:]]'))) sub
          `,

          // `
          // SELECT MAX(price_HKD) AS high,
          // MAX(q3) AS q3,
          // MAX(median) AS median,
          // MAX(q1) AS q1,
          // MIN(price_HKD) AS low

          // FROM (
          //   SELECT price_HKD,
          //   PERCENTILE_CONT(0.25) WITHIN GROUP(ORDER BY price_HKD) over () AS q1,
          //   MEDIAN(price_HKD) OVER () AS median,
          //   PERCENTILE_CONT(0.75) WITHIN GROUP(ORDER BY price_HKD) over () AS q3
          //   FROM data_dashboard_source
          // )
          // `,
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data1 = rows;
            callback();
          }
        );
      },
      // barChart_2
      function (callback) {
        db_.query(
          `
         SELECT
	category,
	subcategory,
	COUNT(product_name) AS count
FROM (
	SELECT
		d.*
	FROM
		data_dashboard_source d
	WHERE
		EXISTS (
			SELECT
				1
			FROM
				tutorials t
			WHERE
				d.subcategory REGEXP CONCAT('[[:<:]]', t.description, '[[:>:]]'))) sub
GROUP BY
	subcategory
ORDER BY
	COUNT(product_name)
	DESC
          `,
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data2 = rows;
            callback();
          }
        );
      },
      // barChart_3
      function (callback) {
        db_.query(
          `
          SELECT
	category,
	subcategory,
	COUNT(discount) AS count
FROM (
	SELECT
		d.*
	FROM
		data_dashboard_source d
	WHERE
		EXISTS (
			SELECT
				1
			FROM
				tutorials t
			WHERE
				d.subcategory REGEXP CONCAT('[[:<:]]', t.description, '[[:>:]]'))) sub
GROUP BY
	subcategory
ORDER BY
	COUNT(discount)
	DESC
          `,
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data3 = rows;
            callback();
          }
        );
      },
      // lineChart_4
      function (callback) {
        db_.query(
          `
         SELECT YEAR(extract_date) as year, MONTH(extract_date) as month, AVG(price_HKD) as AVP FROM (
	SELECT
		d.*
	FROM
		data_dashboard_source d
	WHERE
		EXISTS (
			SELECT
				1
			FROM
				tutorials t
			WHERE
				d.subcategory REGEXP CONCAT('[[:<:]]', t.description, '[[:>:]]'))) sub

          GROUP BY YEAR(extract_date), MONTH(extract_date)
         `,
          // group by EXTRACT(month FROM column_S),EXTRACT(year FROM column_S), avg(column_R)
          function (err, rows, fields) {
            console.log("Connection result error " + err);
            data4 = rows;
            callback();
          }
        );
      },
      // Send the response
    ],
    function (error, results) {
      response.json({
        all: data,
        boxplot_1: data1,
        barChart_2: data2,
        barChart_3: data3,
        lineChart_4: data4,
      });
    }
  );
});

require("./app/routes/turorial.routes")(app);

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
