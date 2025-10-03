const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/register', async (req, res) => {
  const {name, email, password} = req.body;
  if(!email || !password) return res.status(400).json({error:'email & password required'});
  try {
    const existing = await User.findOne({email});
    if(existing) return res.status(400).json({error:'user exists'});
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const user = new User({name, email, passwordHash: hash});
    await user.save();
    const token = jwt.sign({id:user._id, email:user.email}, JWT_SECRET, {expiresIn:'7d'});
    res.json({token, user:{id:user._id, name:user.name, email:user.email}});
  } catch(err){
    console.error(err);
    res.status(500).json({error:'server'});
  }
});

router.post('/login', async (req, res) => {
  const {email, password} = req.body;
  if(!email || !password) return res.status(400).json({error:'email & password required'});
  try {
    const user = await User.findOne({email});
    if(!user) return res.status(400).json({error:'invalid'});
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if(!ok) return res.status(400).json({error:'invalid'});
    const token = jwt.sign({id:user._id, email:user.email}, JWT_SECRET, {expiresIn:'7d'});
    res.json({token, user:{id:user._id, name:user.name, email:user.email}});
  } catch(err){
    console.error(err);
    res.status(500).json({error:'server'});
  }
});

module.exports = router;
