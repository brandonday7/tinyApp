let express = require('express');
let app = express();
const bodyParser = require('body-parser');
let cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['user_ID', 'visitor'] //this is the name of that encrypted cookie that will be used
}));
const bcrypt = require('bcrypt');

let PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

let methodOverride = require('method-override');
app.use(methodOverride('X-HTTP-Method-Override'))

let urlDatabase = {
  'b2xvn2': {link: 'http://www.lighthouselabs.ca', user_ID: 'abcdef', visits: 0},
  '9sm5xk': {link: 'http://www.google.com', user_ID: '123456', visits: 0}
};

const users = {
  "abcdef": {
    id: "abcdef",
    email: "brandontday7@gmail.com",
    password: bcrypt.hashSync("bigfatpassword", 10) //these are hardcoded tester accounts, passwords are visible but that's ok
  },
 "123456": {
    id: "123456",
    email: "frankocean@wolfgang.com",
    password: bcrypt.hashSync("whiteferrari", 10)
  }
}

let errorMessage = undefined; //this will be used throughout the code to present an error message in the .ejs files

app.get('/', (req, res) => {
  let loggedIn = req.session.user_ID;
  if (loggedIn) {
    res.redirect('/urls');
    return;
  } else {
    res.redirect('/login');
  }
});

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// app.get('/hello', (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });


//********************************************** //this seperates the categories of gets/posts to make sure orders are correct
app.get("/urls/new", (req, res) => {
  let loggedIn = req.session.user_ID;
  if (loggedIn) {
    let templateVars = {user_ID: req.session.user_ID} //send cookie data to .ejs to show user we know they're signed in
    res.render("urls_new", templateVars);
  } else { //otherwise, make them sign in
    errorMessage = "You must be logged in to access links!";
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) { //if id is not recognized, tell the user
    res.send("That short URL does not exist!");
    return;
  } else if (!req.session.user_ID) { //if user is not signed in, let them know and redirect them
    errorMessage = "You must be logged in to access that link!";
    res.redirect('/login');
    return;
  }
  let shortURL = req.params.id;
  if (req.session.user_ID.id !== urlDatabase[shortURL]['user_ID']) { //if the id exists but doesn't belong to the user, let them know they can't do that
    res.send("You are not authorized to access that link!");
    return;
  }

  let fullURL = urlDatabase[shortURL].link; //otherwise direct them to the url_show page with their cookie info/urls
  let visits = urlDatabase[shortURL].visits;
  //if visitor cookie is not empty, fire it to the urls_show page, if not, send something with length 0;
  let visitors = req.session.visitor ? req.session.visitor : [];
  visitors = Object.keys(visitors).length;
  let templateVars = {shortURL, fullURL, user_ID: req.session.user_ID, visitors, visits};
  res.render('urls_show', templateVars);
});

app.get('/urls', (req, res) => {
  let loggedIn = req.session.user_ID; //obtain cookie info
  if (!loggedIn) { //if they're not logged in, let them know they need to log in
    errorMessage = "You must be logged in to access links!";
    res.render('login', {errorMessage});
    return;
  } else { //otherwise, present them with the urls that belong to them, and send them with cookie info to the index page
    let urls = urlsForUser(loggedIn.id) //this function filters the "database" to just the user's own links
    let templateVars = {urls: urls, user_ID: req.session.user_ID};
    res.render('urls_index', templateVars);
  }
});

//***********************************************
app.get("/u/:shortURL", (req, res) => { //anyone can do this, no need to tell if they are logged in
  if (!urlDatabase[req.params.shortURL]) { //if database doesn't recognize the link, let the user know
    res.send("That short URL does not exist!");
  }

  let cookieObj = generateRandomString();
  if (req.session.user_ID !== null) {
    cookieObj = req.session.user_ID.id;
  }


  //this is where my problem is with adding another cookie
  //if the visitor cookie has been defined, concatenate it with the current user, otherwise, we are in the
  //first definition of the visitor cookie, and we set it eqaul to the current user
  // req.session.visitor = req.session.visitor ?  req.session.visitor.concat(cookieObj) : [cookieObj];

//don't forget to give anyone access to u/ pages, therefore generate a new id for each of them

  if (typeof(req.session.visitor) === 'undefined') {
    let obj = {[cookieObj]: cookieObj};
    req.session.visitor = obj;
  } else if (!req.session.visitor[cookieObj]) {
    req.session.visitor[cookieObj] = cookieObj;
  }


  urlDatabase[req.params.shortURL].visits++;
  let longURL = urlDatabase[req.params.shortURL].link; //otherwise, redirect to the desired page
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  let loggedIn = req.session.user_ID;
  if (loggedIn) { //if logged in, don't let them get to this page, go back to your urls
    res.redirect('/urls');
    return;
  }
  res.render('register', {errorMessage: errorMessage}); //if not logged in, go to the register.ejs to fill out info
}); //error message can be used to tell them what they did wrong

app.get('/login', (req, res) => {
  let loggedIn = req.session.user_ID;
  if (loggedIn) { //if logged in, cannot get to login page
    res.redirect('/urls');
    return;
  }
  res.render('login', {errorMessage: errorMessage}); //otherwise, go to login page
}); //error message can help them see what they're inputting wrong

//***********************************************
app.post('/urls/:id/delete', (req, res) => {
  let deleteKey = req.params.id; //find out which shortURL we want to delete from request
  if (urlDatabase[deleteKey].user_ID === req.session.user_ID.id) { //if the link belongs to the user, delete it
    delete urlDatabase[deleteKey];
    res.redirect('/urls'); //show them their updated links page (deleted link now gone)
  }
  else { //if they try to delete someone else's page, tell them they can't (rn the browser sends a 404, which gets the job done but isn't clean...)
    errorMessage = "You may only delete links that you have added!";
    let templateVars = {errorMessage, urlDatabase, user_ID: req.session.user_ID}
    res.render('urls_index', templateVars);
  }
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id].link = req.body.newURL; //obtain the new URL and add it to the database
  res.redirect('http://localhost:8080/urls'); //show user their new page
})

app.post("/urls", (req, res) => {
  let newKey = generateRandomString(); //generate a new string for the link we are posting
  while (newKey === false) { //string generator will return false if random key already exists (fat chance)
    generateRandomString(); //run it again until the key is unique
  }
  let newDataObj = {link: req.body.longURL, user_ID: req.session.user_ID.id}; //make our new object that will go in database
  urlDatabase[newKey] = newDataObj; //put new object in the database

  res.redirect(`http://localhost:8080/urls/${newKey}`); //show the new link's page

});

app.post('/login', (req, res) => {
  const email = req.body.user_email; //take in the email
  const user_ID = findUserID(email); //find the user id associated to the email (for easier object traversal)
  if ((user_ID === 0) || !bcrypt.compareSync(req.body.user_password, users[user_ID].password)) { //if email wasn't found or password is incorrect
    res.status(403); //error
    errorMessage = "Invalid login information. Please try again";
    res.render('login', {errorMessage: errorMessage}); //send error message to .ejs to be printed
    return;
  } else {
  req.session.user_ID = users[user_ID]; //if correct information is input, log in and show them url
  res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session.user_ID = null; //upon logout, clear cookie
  res.redirect('/login'); //redirect to login page
});

app.post('/register', (req, res) => {
  for (member in users) { //look at the current user database
    if (users[member].email === req.body.email) { //if the email already exists, return error, and get them to fix it
      res.status(400);
      errorMessage = "That email is already taken. Please use another";
      res.render('register', {errorMessage: errorMessage});
      return;
    }
  }


  if (req.body.email === '' || req.body.password === '') { //if no email or password was input, return error, fix it
    res.status(400);
    errorMessage = "Please input a valid email and password";
    res.render('register', {errorMessage: errorMessage});
  } else {
  let newID = generateRandomString(); //if information input is valid, give them a new id
  while (newID === false) { //make sure id is unique
    generateRandomString();
  }
  const hashedPassword = bcrypt.hashSync(req.body.password, 10); //hash the password without ever saving it to server (for longer than necessary)
  let newUser = {id: newID, email: req.body.email, password: hashedPassword}; //make the new user object
  users[newID] = newUser; //add the user to the database
  req.session.user_ID = users[newID]; //set the cookie to this user
  res.redirect('http://localhost:8080/urls'); //show them their (hopefully empty) urls page
}
})


app.listen(PORT, () => { //listen on the port 808 and let node know server started running
  console.log(`Example listening on port ${PORT}`);
});



function generateRandomString() {
  let possibleChars = "abcdefghijklmnopqrstuvwxyz0123456789"; //list of available characters (upper case was a problem for my chrome browswer, so i eliminated those. hopefully 36^6 possibilities is enough)
  possibleChars = possibleChars.split('');
  let alphaNumer = [];
  for (let i = 0; i < 6; i++) {
    let randChar = Math.floor(Math.random()*35);
    alphaNumer.push(possibleChars[randChar]) //randomly generate 6 characters from the list and append them to this array
  }
  alphaNumer = alphaNumer.join(''); //join the array together into a string of chars

  if (!urlDatabase[alphaNumer] && !users[alphaNumer]) { //make sure the id doesn't exist already
    return alphaNumer;
  } else { //if it does, notify the function that requires a number to run the function again
    return false;
  }
}



function findUserID(email) {
  for (member in users) { //look at all the users
    if (users[member].email === email) { //if we find the email in the database, return the id number
      return users[member].id;
    }
  }
  return 0; //if email not found, return 0 to let the program know this person is an imposter or has bad spelling
}




function urlsForUser(id) {
  let urls = {}; //empty object to contain all of the user's links
  for (shortURL in urlDatabase) { //look through the database
    if (urlDatabase[shortURL].user_ID === id) { //if the link id matches the user's id
      let obj = {link: urlDatabase[shortURL].link, user_ID: id}; //create the link object again and push it to this other, personal object
      urls[shortURL] = obj;
    }
  }
  return urls; //return the user's personal list of links
}
