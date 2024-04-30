
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.set("view engine", "hbs");
app.set('views', path.join(__dirname, 'views'));


mongoose.connect('mongodb://localhost/imageGallery')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Error connecting to MongoDB:', err));
   
    const LogInSchema=new mongoose.Schema({
        name:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:true
        }
    })
 
const imageSchema = new mongoose.Schema({
    name: String,
    imagePath: String
});

const Image = mongoose.model('Image', imageSchema);
const collection=new mongoose.model("LogInCollection",LogInSchema) 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: false }));

module.exports=collection

app.get('/', (req, res) => {
    res.render('login');
});

app.get("/signup", (req, res) => {
    res.render("signup");
  });

app.get('/home', (req, res) => {
    res.render('home'); // Render the home page
});



app.get('/login', (req, res) => {
    const errorMessage = 'Test error message'; 
    console.log('errorMessage:', errorMessage); 
    res.render('login', { errorMessage: errorMessage }); 
});


// Route to handle user authentication
app.post("/signup", async (req, res) => {
    const { name, password } = req.body;
  
    if (password.length < 7) {
      return res.render("signup", {
        error: "Password must be at least 7 characters long.",
      });
    }
  
    const data = {
      name,
      password,
    };
  
    await collection.insertMany([data]);
  
    res.render("home");
  });

app.all("/login", async (req, res) => {
    if (req.method === "GET") {
      res.render("login");
    } else if (req.method === "POST") {
      try {
        const check = await collection.findOne({ name: req.body.name });
  
        if (check.password === req.body.password) {
          res.render("home");
        } else {
          res.send("Wrong Password!");
        }
      } catch {
        res.send("Wrong Details!");
      }
    }
  });



app.get('/gallery', (req, res) => {
    Image.find({})
        .then(images => {
            res.render('gallery', { images: images });
        })
        .catch(err => {
            console.error('Error fetching images from MongoDB:', err);
            res.status(500).send('Internal server error');
        });
});

app.post('/upload', upload.single('image'), (req, res) => {
    const { originalname, filename } = req.file;

    const newImage = new Image({
        name: originalname,
        imagePath: `/uploads/${filename}`
    });

    newImage.save()
        .then(() => res.redirect('/gallery'))
        .catch(err => console.error('Error saving image to MongoDB:', err));
});

app.post('/delete/:imageId', (req, res) => {
    const { imageId } = req.params;

    Image.deleteOne({ _id: imageId })
        .then(result => {
            if (result.deletedCount === 0) {
                console.error('Image not found');
                return res.status(404).send('Image not found');
            }

            const imagePath = path.join(__dirname, 'uploads', image.imagePath);

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('Image removed successfully from file system');
            } else {
                console.error('Image file not found:', imagePath);
            }

            console.log('Image removed successfully from MongoDB');

            res.redirect('/gallery');
        })
        .catch(err => {
            console.error('Error deleting image:', err);
            res.status(500).send('Internal server error');
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
