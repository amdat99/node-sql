const request = require("request");
const http = require("http");
const path = require("path");
const sqlite3 = require("sqlite3");
const { transporter } = require("./emailConfig");
// Documentation for request is available at https://www.npmjs.com/package/request
// Documentation for sqlite3 is available at https://github.com/mapbox/node-sqlite3/wiki
// Retrieve a list of users on a monthly plan from the Marketing API, then add rows to the
// monthly_subscribers table.
const db = new sqlite3.Database("client.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to database");
});

db.run(
  `CREATE TABLE recipients AS SELECT email FROM newsletters WHERE promotions = 0 ORDER BY email ASC`,
  [],
  function (err) {
    if (err) {
      return console.log(err.message);
    }
    console.log("Recipients table created");
  }
);

let currentUrl;

const server = http.createServer((req, res) => {
  currentUrl = req.url;
  const path = req.url.split("?")[0];

  path === "/subscriptions" &&
    getSubscriptions((response) => {
      res.write(JSON.stringify(response));
      res.end();
    });

  path === "/email" &&
    sendMail((response) => {
      res.write(JSON.stringify(response));
      res.end();
    });
});

const token = process.env.TOKEN;

const getSubscriptions = (response) => {
  const serverUrl = `https://data-engineer-test.xara.com` + currentUrl;
  const options = {
    url: serverUrl,
    json: true,
    method: "GET",
    headers: {
      "User-Agent": "my request",
      Authorization: token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  request(options, (error, res, body) => {
    if (error) {
      console.log(error);
      response(error);
    }
    response(body);
  });
};

const sendMail = (response) => {
  const uploadDir = path.dirname(require.main.filename);
  const attachments = [
    {
      path: uploadDir + "/client.db",
      filename: "client.db",
    },
    {
      path: uploadDir + "/populate-monthly-subscribers.js",
      filename: "populate-monthly-subscribers.js",
    },
  ];
  const mailOptions = {
    from: "test334344334gggg@yahoo.com",
    to: ["aamiradat99@gmail.com", "andreacasaccia925_q8o@indeedemail.com"],
    subject: "File message",
    text: "hello",
    attachments: attachments,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return response(error);
    } else {
      console.log("Email sent: " + info.response);
      response(info.response);
    }
  });
};

server.listen(4000);
console.log(" listening on port 4000 ");
