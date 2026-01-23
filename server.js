const express = require('express');
const mongoose = require('mongoose');
const todo = require('./model');
const UserData = require('./User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

mongoose.connect('mongodb+srv://keerthanapuppala46_db_user:jlaCO8EsHFPYyi1V@cluster0.zmjj3wj.mongodb.net/').then(() => console.log('Connected to MongoDB')).catch(err => console.log(err));
const authenticateToken = (req,res,next)=>{
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token){
            return res.status(401).json("{ message: 'Access token required'}");
        }
        jwt.verify(token,'this is my secret key',(err,user) =>{
            if (err){
                res.status(403).json({ message: 'Invalid or expired token' });
            }req.user = user
            next();
        });
};

app.post("/signup", async (req,res)=>{
    const {username, email, password} = req.body
    try{
        const existingUser = await UserData.findOne({email})
        if (existingUser){
            return res.status (400).json({ message: "User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);
        const newUser = new UserData({username, email, password : hashed_password});
        await newUser.save();
        const token = jwt.sign({id : newUser._id},'this is my secret key',{expiresIn:'1h'});
        return res.json({
            message: "User signup successful",
            token,
            user:{
                id:newUser._id,
                username : newUser.username,
                email: newUser.email
             }
        });
    }
    
        catch (err) {
        console.log(err.message);
    }})

    app.post("/login", async (req,res) =>{
        try{
            const {email,password} = req.body
            const foundUser = await UserData.findOne({email});
            if (!foundUser){
                return res.status(401).json({ message: "Invalid credentials"})
            }
             const salt = await bcrypt.genSalt(10);
             const ismatch = await bcrypt.compare(password, foundUser.password);
             if (!ismatch){
                return res.status(401).json({ message: "Invalis password"})
             }
        
             const token = jwt.sign({id : foundUser._id},'this is my secret key',{expiresIn:'1h'});
             return res.status(201).json({
                message: "User login successful",
                 token,
                 user:{
                     id:foundUser._id,
                     username : foundUser.username,
                     email: foundUser.email
             }
        });
    }
        
    
    catch (err) {
        console.log(err.message);
    
    }
  });

app.post("/create_task", authenticateToken , async (req,res) => {
   try{
    const {title,description} = req.body;
    const newTODO = new todo({title,description,userId: req.user.id} );
    await newTODO.save();
    return res.status(201).json({
        message: "TODO created successfull",
        Todo:  newTODO
    });
   }
    catch (err){
          console.log(err.message);
        return res.status(500).json({ message: "Server error" });
    }
});


    app.listen(3000, () =>console.log('server is running on http://localhost:3000'))