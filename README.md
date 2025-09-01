# TripNow Backend API Documentation

## Overview
TripNow is a full-stack ride-hailing application backend built with Node.js, Express, and MongoDB. It provides RESTful APIs for user/captain authentication, ride management, location services, and real-time communication via Socket.io. The backend integrates with Google Maps API for geocoding, distance calculations, and place suggestions, and Razorpay for secure payments.

## Features
- **Authentication**: JWT-based auth for users and captains with password hashing (bcrypt)
- **Ride Management**: Create, track, and manage rides with OTP verification
- **Location Services**: Google Maps integration for geocoding, distance/time, and autocomplete
- **Payment Integration**: Razorpay for UPI payments
- **Real-Time Updates**: Socket.io for live communication between users and captains
- **Input Validation**: Express-validator for secure data handling
- **Database**: MongoDB with Mongoose ODM for data modeling

## Tech Stack
- **Node.js** with **Express** (v5.1.0) - Server framework
- **MongoDB** with **Mongoose** (v8.16.1) - Database and ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Axios** - HTTP client for external APIs
- **Razorpay** - Payment gateway
- **CORS** & **Cookie Parser** - Cross-origin and cookie handling

## Project Structure
```
Backend/
├── controllers/          # Route handlers (e.g., user.controller.js)
├── models/               # MongoDB schemas (e.g., user.model.js)
├── routes/               # API routes (e.g., user.routes.js)
├── services/             # Business logic (e.g., maps.service.js)
├── middlewares/          # Express middlewares (e.g., auth.middleware.js)
├── db/                   # Database connection (db.js)
├── socket.js             # Socket.io setup
├── app.js                # Express app configuration
├── server.js             # Server entry point
└── package.json          # Dependencies and scripts
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation
1. Navigate to Backend directory: `cd Backend`
2. Install dependencies: `npm install`
3. Create `.env` file with required variables (see Environment Variables section)
4. Start server: `npm run dev` (runs on port 4000 by default)

### Environment Variables
Create `Backend/.env`:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/tripnow
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=http://localhost:5173
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## API Endpoints

### Authentication
- **POST /api/users/register**: Register user (requires fullName, email, password)
- **POST /api/users/login**: Login user (requires email, password)
- **GET /api/users/profile**: Get user profile (auth required)
- **GET /api/users/logout**: Logout user (auth required)
- **POST /api/captains/register**: Register captain (requires fullName, email, password, vehicle details)
- **POST /api/captains/login**: Login captain (requires email, password)
- **GET /api/captains/profile**: Get captain profile (auth required)
- **GET /api/captains/logout**: Logout captain (auth required)

### Maps Management
- **GET /api/maps/geocode**: Get coordinates from address (auth required)
- **GET /api/maps/distance-time**: Get distance and duration (auth required)
- **GET /api/maps/suggestions**: Get place autocomplete suggestions (auth required)

### Ride Management
- **POST /api/rides/create**: Create ride request (auth required, calculates fare automatically)
- **GET /api/rides/:id**: Get ride details (auth required)
- **PUT /api/rides/:id/status**: Update ride status (captain auth required)
- **POST /api/rides/:id/accept**: Accept ride (captain auth required)
- **POST /api/rides/:id/start**: Start ride with OTP (captain auth required)
- **POST /api/rides/:id/end**: End ride (captain auth required)

### Payment Management
- **POST /api/payments/create-order**: Create Razorpay order (auth required)
- **POST /api/payments/verify**: Verify payment (auth required)

All endpoints require JWT authentication via `Authorization: Bearer <token>` header or cookie. Responses include status codes (200/201 for success, 400 for validation errors, 401 for auth issues, 500 for server errors).

## Sample API Requests & Responses

### User Registration
**Request:**
```bash
POST /api/users/register
Content-Type: application/json

{
  "fullName": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "user": {
    "_id": "64f8b1c2d4e5f6a7b8c9d0e1",
    "fullName": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "email": "john.doe@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create Ride
**Request:**
```bash
POST /api/rides/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickup": "Times Square, New York, NY, USA",
  "dropoff": "Central Park, New York, NY, USA",
  "vehicleType": "car"
}
```

**Response (201):**
```json
{
  "_id": "64f8b1c2d4e5f6a7b8c9d0e1",
  "userId": "64f8b1c2d4e5f6a7b8c9d0e0",
  "pickupLocation": "Times Square, New York, NY, USA",
  "dropoffLocation": "Central Park, New York, NY, USA",
  "fare": 125.75,
  "status": "pending",
  "otp": "1234"
}
```

### Geocode Address
**Request:**
```bash
GET /api/maps/geocode?address=Times Square, New York
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "latitude": 40.7589,
  "longitude": -73.9851
}
```

### Distance & Time Calculation
**Request:**
```bash
GET /api/maps/distance-time?origin=Times Square, New York&destination=Central Park, New York
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "distance": "3.2 km",
  "duration": "15 mins"
}
```

## Data Models
- **User**: fullName, email, password (hashed), socketId, timestamps
- **Captain**: fullName, email, password (hashed), socketId, status, vehicle (color, numberPlate, capacity, type), location, timestamps
- **Ride**: userId, captainId, pickup/dropoff locations, fare, status, duration, distance, paymentId, orderId, signature, otp, timestamps
- **BlacklistToken**: token, createdAt (for logout)

## External APIs
- **Google Maps API**: For geocoding, distance matrix, and places autocomplete
- **Razorpay API**: For UPI payment processing

## Real-Time Features
- Socket.io handles user/captain connections, ride updates, and live tracking
- Events: join, ride-request, ride-accepted, ride-started, ride-ended, location-update

## Fare Calculation
Dynamic pricing based on vehicle type, distance (km), and duration (min):
- Auto: Base ₹25 + ₹12/km + ₹2/min
- Car: Base ₹50 + ₹15/km + ₹3/min
- Bike: Base ₹20 + ₹8/km + ₹1.5/min

## Testing
Use Postman for API testing. Example: Register user with JSON body, then use returned token for authenticated requests. Refer to detailed endpoint docs for request/response examples.

## Error Handling
- Validation errors: Array of error objects with msg, param, location
- Auth errors: 401 with message
- Server errors: 500 with generic message
- All responses include appropriate HTTP status codes

## Best Practices
- Validate inputs with express-validator
- Hash passwords with bcrypt
- Use JWT for secure auth
- Implement rate limiting for Maps API calls
- Monitor MongoDB connections and API usage
- Handle Socket.io disconnections gracefully

## Contributing
- Follow RESTful conventions
- Add validation for new endpoints
- Update models and services as needed
- Test thoroughly before deployment

## License
For educational purposes. Ensure compliance with external API terms.
