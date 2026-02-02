const express = require('express');
const mongoose = require('mongoose');
const todo = require('./model');
const UserData = require('./User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

/* =======================
   MongoDB Connection
======================= */
mongoose
  .connect('mongodb+srv://keerthanapuppala46_db_user:jlaCO8EsHFPYyi1V@cluster0.zmjj3wj.mongodb.net/')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

/* =======================
   JWT Middleware
======================= */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, 'this is my secret key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // { id: userId }
    next();
  });
};

/* =======================
   Signup
======================= */
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await UserData.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserData({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      'this is my secret key',
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      message: 'User signup successful',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error' });
  }
});

/* =======================
   Login
======================= */
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const foundUser = await UserData.findOne({ email });
    if (!foundUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: foundUser._id },
      'this is my secret key',
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'User login successful',
      token,
      user: {
        id: foundUser._id,
        username: foundUser.username,
        email: foundUser.email
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error' });
  }
});

/* =======================
   Create Todo
======================= */
app.post('/create_task', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    const newTodo = new todo({
      title,
      description,
      userId: req.user.id
    });

    await newTodo.save();

    return res.status(201).json({
      message: 'TODO created successfully',
      todo: newTodo
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error' });
  }
});

/* =======================
   Get Todos
======================= */
app.get('/todos', authenticateToken, async (req, res) => {
  try {
    const todos = await todo
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Todos fetched successfully',
      todos
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error' });
  }
});

/* =======================
   Update Todo
======================= */
app.put('/todo/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const foundTodo = await todo.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!foundTodo) {
      return res.status(404).json({
        message: 'Todo not found or access denied'
      });
    }

    foundTodo.title = title || foundTodo.title;
    foundTodo.description = description || foundTodo.description;
    await foundTodo.save();

    return res.status(200).json({
      message: 'Todo updated successfully',
      todo: foundTodo
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error' });
  }
});

/* =======================
   Delete Todo
======================= */
app.delete('/todo/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTodo = await todo.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!deletedTodo) {
      return res.status(404).json({
        message: 'Todo not found or access denied'
      });
    }

    return res.status(200).json({
      message: 'Todo deleted successfully',
      todo: deletedTodo
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error' });
  }
});

/* =======================
   Server
======================= */
app.listen(3000, () =>
  console.log('Server running on http://localhost:3000')
);
