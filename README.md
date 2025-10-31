# Event Grid Platform

A full-stack event management platform for creating, discovering, and managing events with ticket sales and attendee management.

##  Live Demo

Explore our live demo:

- **Frontend**: https://event-grid-gilt.vercel.app/
- **API Documentation**: https://event-grid.onrender.com



### Test Credentials
- **Admin Account**:
  - Email: admin@eventgrid.com
  - Password: Admin@123
- **Organizer Account**:
  - Email: organizer@eventgrid.com
  - Password: Organizer@123
- **User Account**:
  - Email: user1@eventgrid.com
  - Password: User@123

##  Features

- **User Authentication** - Secure JWT-based authentication system
- **Event Management** - Create, update, and manage events with rich details
- **Ticket Types** - Multiple ticket types with customizable pricing and quantities
- **QR Code Check-in** - Mobile-friendly check-in system for event organizers
- **Dashboard** - Real-time analytics and management for organizers
- **Responsive Design** - Works on desktop and mobile devices
- **File Uploads** - Cloudinary integration for media management

## 🛠 Tech Stack

### Backend
- **Framework**: [Python Flask](https://flask.palletsprojects.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy ORM](https://www.sqlalchemy.org/)
- **Authentication**: [JWT (JSON Web Tokens)](https://jwt.io/)
- **Payments**: [Safaricom M-Pesa API](https://developer.safaricom.co.ke/)(incomplete integration)
- **File Storage**: [Cloudinary](https://cloudinary.com/)
- **API Documentation**: [OpenAPI/Swagger](https://swagger.io/)

### Frontend
- **Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Form Handling**: [Formik](https://formik.org/) with [Yup](https://github.com/jquense/yup)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **QR Code**: [react-qr-code](https://www.npmjs.com/package/react-qr-code) & [html5-qrcode](https://github.com/mebjas/html5-qrcode)

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis (for caching and background tasks)
- Cloudinary account (for file storage)

## Getting Started

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/event-grid.git
   cd event-grid/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Initialize the database:
   ```bash
   flask db upgrade
   ```

6. Run the development server:
   ```bash
   flask run --port=5000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## API Documentation

Once the backend is running, access the interactive API documentation at:
```
http://localhost:5000/api/docs
```

## Environment Variables

### Backend (`.env`)
```
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/eventgrid
JWT_SECRET_KEY=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
#MPESA_CONSUMER_KEY=your-mpesa-key
#MPESA_CONSUMER_SECRET=your-mpesa-secret
#MPESA_PASSKEY=your-mpesa-passkey
#MPESA_SHORTCODE=your-shortcode
```

### Frontend (`.env`)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```
## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This project was made possible thanks to these amazing open-source projects:

- [Flask](https://flask.palletsprojects.com/) - The web framework for Python
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Formik](https://formik.org/) - Build forms in React, without the tears
- [Yup](https://github.com/jquense/yup) - JavaScript schema validation
- [React Router](https://reactrouter.com/) - Declarative routing for React
- [Axios](https://axios-http.com/) - Promise based HTTP client
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icon toolkit
- [M-Pesa API](https://developer.safaricom.co.ke/) - Mobile Payment Integration(incomplete)
- [Cloudinary](https://cloudinary.com/) - Cloud-based image and video management
- [PostgreSQL](https://www.postgresql.org/) - The World's Most Advanced Open Source Relational Database
- [SQLAlchemy](https://www.sqlalchemy.org/) - The Database Toolkit for Python
