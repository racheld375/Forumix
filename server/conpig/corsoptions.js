const whitelist = [
  "http://localhost:3000",
  "http://localhost:3003",
  "http://localhost:3002",
  "http://localhost:3004",
  "https://mydomain.com",
  "https://another-allowed-site.com"
];

const corsoptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true); 
    } else {
      callback(new Error("Not allowed by CORS")); 
    }
  },
  credentials: true 
};

module.exports = corsoptions;
