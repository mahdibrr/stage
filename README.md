# dispatching Delivery Management System

- A full-stack delivery management system with real-time messaging capabilities built with React, Node.js, MySQL, and Centrifugo.

## Project Structure

- **Web/**: React frontend application with Vite
- **shared/**: Node.js backend API server with TypeScript

## Features

- User authentication and authorization
- Real-time messaging with Centrifugo WebSocket
- Delivery management system
- Driver tracking and management
- MySQL database integration
- Role-based access control

## Technologies

### Frontend (Web/)
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Real-time WebSocket connection

### Backend (shared/)
- Node.js with Express
- TypeScript
- MySQL with mysql2
- JWT authentication
- Centrifugo integration
- Real-time messaging

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- Centrifugo server

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```bash
   cd Web
   npm install
   
   cd ../shared
   npm install
   ```

3. Set up environment variables (copy .env.example to .env in both folders)

4. Start MySQL server and create database

5. Start Centrifugo server

6. Run the applications:
   ```bash
   # Backend
   cd shared
   npm run dev
   
   # Frontend
   cd Web
   npm run dev
   ```
