const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// MONGODB CONNECTION
const MONGO_URI = process.env.MONGODB_URI || "WEKA_LINK_YAKO_HAPA";
mongoose.connect(MONGO_URI)
    .then(() => console.log("Database Imeunganishwa!"))
    .catch(err => console.error("Kuna shida ya DB:", err));

// USER SCHEMA
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 2000.00 }
});
const User = mongoose.model('User', UserSchema);

// AUTH ROUTES
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: "Usajili umefanikiwa! Login sasa." });
    } catch (e) { res.status(400).json({ error: "Jina limeshatumika!" }); }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ username: user.username, balance: user.balance });
    } else { res.status(400).json({ error: "Taarifa sio sahihi!" }); }
});

// REAL-TIME CHAT & GAME SYNC
io.on('connection', (socket) => {
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`SportyJET inafanya kazi kwenye Port ${PORT}`));
