let express = require('express');
let app = express();
const bodyParser = require('body-parser');

let PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = { //my browser is setting the key to lowercase automatically, and i don't know why, so all shortURLs must be lowercase only
  "b2xvn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.end("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
  let fullURL = urlDatabase[shortURL];
  let templateVars = {shortURL, fullURL};
  res.render('urls_show', templateVars);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("Ok");
});

app.listen(PORT, () => {
  console.log(`Example listening on port ${PORT}`);
});



function generateRandomString() {
  let possibleChars = "abcdefghijklmnopqrstuvwxyz123456789";
  possibleChars = possibleChars.split('');
  let alphaNumer = [];
  for (let i = 0; i < 6; i++) {
    let randChar = Math.floor(Math.random()*34);
    alphaNumer.push(possibleChars[randChar])
  }
  alphaNumer = alphaNumer.join('');

  if (!urlDatabase[alphaNumer]) {
    return alphaNumer;
  } else {
    return false;
  }
}

