# Tic-Tac-Toe Game with Authentication

A modern, feature-rich Tic-Tac-Toe game built with React.js and Node.js, featuring user authentication, AI opponents, game statistics, and a beautiful dark theme UI.

## 🎮 Features

### Frontend Features
- **Modern React UI** with dark cyberpunk theme
- **User Authentication** (Login/Register) with JWT
- **AI Opponents** with 3 difficulty levels (Easy, Medium, Hard)
- **Game Statistics** tracking wins, losses, and win rate
- **Responsive Design** for mobile, tablet, and desktop
- **Real-time Game State** management
- **Beautiful Animations** and hover effects

### Backend Features
- **RESTful API** with Express.js
- **MongoDB Database** for user and game data
- **JWT Authentication** with secure token management
- **Password Hashing** with bcrypt
- **Input Validation** and error handling
- **Game History** tracking and statistics

### AI Features
- **Easy AI**: Random moves
- **Medium AI**: 70% strategic, 30% random
- **Hard AI**: Unbeatable Minimax algorithm

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tictactoe
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service (varies by OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get connection string
3. Replace `MONGODB_URI` in `.env` with your Atlas connection string

### 4. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend React App:**
```bash
npm start
# App runs on http://localhost:3000
```

## 📁 Project Structure

```
tic-tac-toe-game/
├── backend/                    # Node.js backend
│   ├── models/                 # MongoDB models
│   │   ├── User.js            # User model with stats
│   │   └── Game.js            # Game model with moves
│   ├── routes/                 # API routes
│   │   ├── auth.js            # Authentication routes
│   │   └── game.js            # Game routes
│   ├── middleware/             # Custom middleware
│   │   └── auth.js            # JWT authentication
│   ├── package.json
│   ├── server.js              # Express server
│   └── .env                   # Environment variables
│
├── src/                       # React frontend
│   ├── components/            # React components
│   │   ├── Auth/              # Authentication components
│   │   │   ├── AuthModal.jsx  # Login/Register modal
│   │   │   ├── UserProfile.jsx # User profile display
│   │   │   └── Auth.css       # Auth styling
│   │   ├── Game.jsx           # Main game component
│   │   └── Board.jsx          # Game board component
│   ├── contexts/              # React contexts
│   │   └── AuthContext.js     # Authentication context
│   ├── App.js                 # Main App component
│   ├── App.css                # App styling
│   └── styles.css             # Game styling
│
├── public/
└── package.json
```

## 🎯 Game Flow

1. **Welcome Screen**: User sees features and authentication options
2. **Authentication**: User registers or logs in
3. **Game Setup**: Choose game mode (Human vs Human or vs AI)
4. **AI Difficulty**: Select AI difficulty if playing against computer
5. **Gameplay**: Take turns making moves
6. **Win Detection**: Game automatically detects wins/draws
7. **Statistics**: User stats are updated after each game
8. **Game History**: View past games in user profile

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Input Validation**: Server-side validation with express-validator
- **CORS Protection**: Configured for frontend domain
- **Error Handling**: Comprehensive error handling and logging

## 🎨 UI Features

- **Dark Theme**: Cyberpunk-inspired design
- **Responsive**: Works on all device sizes
- **Animations**: Smooth transitions and effects
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: Visual feedback for all actions

## 🚀 Production Deployment

### Frontend (Vercel/Netlify)
1. Build the React app: `npm run build`
2. Deploy the `build` folder
3. Set environment variable: `REACT_APP_API_URL=your_backend_url`

### Backend (Heroku/Railway)
1. Push to git repository
2. Connect to deployment platform
3. Set environment variables
4. Deploy with automatic builds

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📝 License

This project is licensed under the MIT License.

## 🎉 Enjoy Playing!

Start your Tic-Tac-Toe journey and climb the leaderboards! 🏆

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
