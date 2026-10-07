# Relay — Real-Time Chat Application

A full-stack real-time chat application built with **React, Node.js, Express, MongoDB, and Socket.IO**.

## Features

- JWT authentication & protected routes
- Real-time one-to-one messaging
- Online/offline status & last seen
- Typing indicators
- Delivered & read receipts
- Edit, delete & reply to messages
- User search & profiles
- Image/file sharing with Cloudinary
- Responsive dark/light UI

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Socket.IO  
**Backend:** Node.js, Express, Socket.IO, MongoDB, Mongoose, JWT  
**Services:** MongoDB Atlas, Cloudinary  
**Deployment:** Vercel, Render

## Setup

### Clone

~~~bash
git clone https://github.com/Virus-0000/realtime-chat.git
cd realtime-chat
~~~

### Backend

~~~bash
cd backend
npm install
npm start
~~~

Create `backend/.env`:

~~~env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5001
~~~

### Frontend

~~~bash
cd frontend
npm install
npm run dev
~~~

Create `frontend/.env`:

~~~env
VITE_API_URL=http://localhost:5001
~~~

## Production

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas
- **Storage:** Cloudinary

## Project Structure

~~~text
realtime-chat/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   └── server.js
├── frontend/
│   └── src/
├── .gitignore
└── README.md
~~~

## Live Demo

**Frontend:** https://realtime-chat-zeta-three.vercel.app

**Backend:** https://realtime-chat-backend-lgot.onrender.com

## Author

**Divyanshu Raj**

[GitHub](https://github.com/Virus-0000) · [LinkedIn](https://www.linkedin.com/in/divyanshu0506/)