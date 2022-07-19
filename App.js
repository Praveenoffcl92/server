const express = require("express");
const app = express();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Port = 5000;
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json()); //midilewhere

const userdb = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
const productDb = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
app.listen(Port, () => {
  console.log(`"Good" Your app is Runnig GOOD ${Port}`);
});
app.get("/", (_req,res) => {
  res.send(userdb);
});
app.get("/cartProducts", (_req,res) => {
  console.log("text+=+=+=+=+=+=",productDb);
  res.send(productDb)
});
app.post("/checkAuth", (req, res) => {
  checkAuth(req, res);
});
function isChecked({ name }) {
  return (
    productDb.findIndex((product) => product.name === name) !== -1
  );
}
app.post("/addToCart", (req, res) => {
  const { id, name, image, price_string, price_symbol, price } = req.body;
  let addToCart ={
    id: id,
    name: name,
    image: image,
    price_string: price_string,
    price_symbol: price_symbol,
    price: price,
    quantity: 1,
  }
  if (isChecked({ name })) {
    const status = 401;
    const message = "Already Added To the Cart";
    res.status(status).json({ status, message });
    return;
  }
  fs.readFile("./data.json", (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }
     data = JSON.parse(data.toString());
     
     let updatedData = Array.from(data);
     updatedData.push(addToCart)
     fs.writeFile('data.json', JSON.stringify(updatedData), 'utf8', ()=>{});
     console.log('updatedData',updatedData)
  });
  res.status(200).json(req.body);
});

app.delete("/removeCart", (req, res) => {
  const { name } = req.body;
  let removeProduct = name;
  let data = fs.readFileSync("data.json");
  let json = JSON.parse(data);
  let products = json;
  console.log("text+==++==", products);
  json = products.filter((product) => {
    return product.name !== removeProduct;
  });
  fs.writeFileSync("data.json", JSON.stringify(json, null, 2));
  const status = 200;
  const message = "Product Was Removed From Cart";
  res.status(status).json({ status, message });
});

function isAuthenticated({ userMail, userPassword }) {
  return (
    userdb.findIndex(
      (user) => user.userMail === userMail && user.Password === userPassword
    ) !== -1
  );
}

app.post("/register", (req, res) => {
  const { userMail, userPassword } = req.body;
  if (isAuthenticated({ userMail, userPassword })) {
    const status = 401;
    const message = "Email & Password already exist";
    res.status(status).json({ status, message });
    return;
  }
  fs.readFile("./db.json", (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }
    data = JSON.parse(data.toString());
    let last_item_id = data[data.length - 1].id;
    let updatedUser = Array.from(data);
    updatedUser.push({
      id: last_item_id + 1,
      userMail: userMail,
      Password: userPassword,
    })
    fs.writeFile('db.json', JSON.stringify(updatedUser), 'utf8', ()=>{});
  });
  res.status(200).json(req.body);
});

app.post("/login", (req, res) => {
  const { userEmail } = req.body;
  const data = userdb.find((val)=>val.userMail === req.body.userEmail && val.Password === req.body.userPassword)
  console.log("===========",req.body,data)
  if (data === undefined) {
    res.status(400).json({
      status: 400,
      error: { msg: "Invalid credentials" },
    });
  } else{
    const Token = jwt.sign({ userEmail }, "hdhdhdhd", { expiresIn: "1m" });
    const refreshToken = jwt.sign({ userEmail }, "hdhdhdhd", { expiresIn: "1h" });
    console.log(Token, "get login token");
    res.status(200).json({
      status: "success",
      Token,
      refreshToken,
    });
  }
});

app.post("/refresh", (req, res) => {
  console.log("refresh=========", req.body);
  const refreshToken = req.headers["x-access-token"];
  let decode = jwt.decode(refreshToken);
  console.log(decode, "curr");
  let curentMail = decode?.userEmail;
  if (curentMail) {
    const Token = jwt.sign({ curentMail }, "hdhdhdhd", { expiresIn: "50m" });
    return res.status(200).json({
        Msg: "my New Token",
        Token,
        refreshToken,
    });
  }
});
const checkAuth = (req, res) => {
  const { TokenExpiredError } = jwt;
  const catchError = (error) => {
    console.log("errorShow", error);
    if (error instanceof TokenExpiredError) {
      return res
        .status(401)
        .send({ Message: "Unauthorized! AccessToken was expired!" });
    }
    return res.status(401).send({ message: "Unauthorized!" });
  };
  const token = req.headers["x-access-token"];
  if (!token) {
    res.status(400).json({
      errors: [{ msg: " Token is not Found" }],
    });
  }
  jwt.verify(token, "hdhdhdhd", (error, decoded) => {
    console.log("decoces", decoded);
    if (error) {
      return catchError(error);
    }
  });
};
