const jsonwebtoken = require('jsonwebtoken');
const mysql2 = require('mysql2/promise');
const configuration = require('../config');

const SECRET_KEY = 'Mani';
const REFRESH_SECRET_KEY = 'Mani_refresh'; 

const pool = mysql2.createPool(configuration.mysql);

const controllerAuth = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      const [users] = await pool.execute('SELECT * FROM users WHERE `Username` = ?', [username]);

      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const user = users[0];

      // Compare passwords in plain text
      if (password !== user.Password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const token = jsonwebtoken.sign({ id: user.id, username: user.Username }, SECRET_KEY, { expiresIn: '10m' });

      const refreshToken = jsonwebtoken.sign({ id: user.id, username: user.Username }, REFRESH_SECRET_KEY, { expiresIn: '5m' });
      res.json({ token, refreshToken });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  refreshAccessToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      const newAccessToken = authenticationService.verifyRefreshToken(refreshToken);
  
      res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error('Token refresh error:', error);
  
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token has expired' });
      }
  
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  },

  register: async (req, res) => {
    try {
      const { username, password, fullName } = req.body;

      const [existingUsers] = await pool.execute('SELECT * FROM users WHERE `Username` = ?', [username]);

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Store password in plain text
      await pool.execute('INSERT INTO users (`Fullname`, `Username`, `Password`) VALUES (?, ?, ?)', [fullName, username, password]);
      res.json({ message: 'Registration successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};

module.exports = controllerAuth;
