let express = require('express');
let app = express();
const bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
app.use(cookieParser());

let PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  'b2xvn2': {link: 'http://www.lighthouselabs.ca', user_ID: 'abcdef'},
  '9sm5xk': {link: 'http://www.google.com', user_ID: '123456'}
};

const users = {
  "abcdef": {
    id: "abcdef",
    email: "brandontday7@gmail.com",
    password: "bigfatpassword"
  },
 "123456": {
    id: "123456",
    email: "frankocean@wolfgang.com",
    password: "whiteferrari"
  }
}

let errorMessage = undefined;

app.get('/', (req, res) => {
  res.end("Hello!");
});

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// app.get('/hello', (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });


//**********************************************
app.get("/urls/new", (req, res) => {
  let loggedIn = req.cookies.user_ID;
  if (loggedIn) {
    let templateVars = {user_ID: req.cookies.user_ID}
    res.render("urls_new", templateVars);
  } else {
    res.render('login');
  }
});

app.get('/urls/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send("That short URL does not exist!");
    return;
  }
  let shortURL = req.params.id;
  let fullURL = urlDatabase[shortURL].link;
  let templateVars = {shortURL, fullURL, user_ID: req.cookies.user_ID};
  res.render('urls_show', templateVars);
});

app.get('/urls', (req, res) => {
  let templateVars = {urlDatabase: urlDatabase, user_ID: req.cookies.user_ID}; //root of delete problem is here
  res.render('urls_index', templateVars);
});



//***********************************************
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send("That short URL does not exist!");
  }
  let longURL = urlDatabase[req.params.shortURL].link;
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  res.render('register', {errorMessage: errorMessage});
});

app.get('/login', (req, res) => {
  res.render('login', {errorMessage: errorMessage});
});

//***********************************************
app.post('/urls/:id/delete', (req, res) => {
  let deleteKey = req.params.id;
  if (urlDatabase[deleteKey].user_ID === req.cookies.user_ID.id) {
    delete urlDatabase[deleteKey];
    res.redirect('/urls');
  }
  else {
    errorMessage = "You may only delete links that you have added!";
    let templateVars = {errorMessage, urlDatabase, user_ID: req.cookies.user_ID}
    res.render('urls_index', templateVars);
  }
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id].link = req.body.newURL;
  res.redirect('http://localhost:8080/urls');
})

app.post("/urls", (req, res) => {
  let newKey = generateRandomString();
  while (newKey === false) {
    generateRandomString();
  }
  let newDataObj = {link: req.body.longURL, user_ID: req.cookies.user_ID.id};
  urlDatabase[newKey] = newDataObj;
  console.log(urlDatabase);

  res.redirect(`http://localhost:8080/urls/${newKey}`);

});

app.post('/login', (req, res) => {
  let email = req.body.user_email;
  let user_ID = findUserID(email);
  let password = req.body.user_password;
  if ((user_ID === 0) || (users[user_ID].password !== password)) {
    res.status(403);
    let errorMessage = "Invalid login information. Please try again";
    res.render('login', {errorMessage: errorMessage});
    return;
  }
  res.cookie('user_ID', users[user_ID]);
  res.redirect('http://localhost:8080/');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_ID');
  res.redirect('http://localhost:8080/login');
});

app.post('/register', (req, res) => {
  for (member in users) {
    if (users[member].email === req.body.email) {
      res.status(400);
      errorMessage = "That email is already taken. Please use another";
      res.render('register', {errorMessage: errorMessage});
      return;
    }
  }


  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    errorMessage = "Please input a valid email and password";
    res.render('register', {errorMessage: errorMessage});
  } else {
  let newID = generateRandomString();
  while (newID === false) {
    generateRandomString();
  }
  let newUser = {id: newID, email: req.body.email, password: req.body.password};
  users[newID] = newUser;
  res.cookie('user_ID', users[newID]);
  res.redirect('http://localhost:8080/urls');
}
})


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

  if (!urlDatabase[alphaNumer] && !users[alphaNumer]) {
    return alphaNumer;
  } else {
    return false;
  }
}



function findUserID(email) {
  for (member in users) {
    if (users[member].email === email) {
      return users[member].id;
    }
  }
  return 0;
}

