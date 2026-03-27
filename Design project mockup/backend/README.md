# SmartSlot Backend Documentation

This backend is built using Node.js, Express.js, and PostgreSQL (via the Sequelize ORM). 

This guide acts as a map to help you understand exactly what each file does, how the database connects, and how the entire flow works when a user books a slot from the frontend.

## 📂 Project Structure Explained

Here is an overview of what happens in every folder and file:

### 1. The Core Setup
*   **`.env`**: Stores all secret configurations. The most important line here is `DATABASE_URL=...` which tells the backend exactly where your PostgreSQL database is located and what username/password to use.
*   **`server.js`**: The starting point of the whole backend application. It does three major things:
    1.  Starts the Express server on port 5000.
    2.  Links all the API routes (URLs) so the frontend can talk to them.
    3.  Calls `sequelize.sync()`. **This is where automatic table creation happens.** When the server boots up, it looks at all your Models and automatically creates the SQL tables inside your PostgreSQL database if they don't exist yet!

### 2. Database Connection (`config/`)
*   **`config/db.js`**: **This is the database connection page.** It uses the Sequelize library to read your `DATABASE_URL` from the `.env` file and securely logs into your PostgreSQL database. Every other file that needs to talk to the database imports `sequelize` from this file.

### 3. Database Tables (`models/`)
These files define the exact structure of your PostgreSQL tables. Sequelize reads these blueprints and creates real SQL tables out of them.
*   **`User.js`**: Stores registered user accounts (Name, Email, Password).
*   **`Turf.js`**: Stores all the physical courts/salons/services that users can browse.
*   **`Booking.js`**: Stores the actual reservations made by users. It establishes a relationship connecting the `User` who booked it with the `Turf` they booked.
*   **`Payment.js`**: Stores raw payment transactions linked to a specific booking.

### 4. API Endpoints (`routes/`)
Routes act as the "doors" to your backend. They listen for HTTP requests from your frontend and pass them exactly to the right Controller.
*   **`authRoutes.js`**: Listens for `/api/auth/login` and `/api/auth/register`.
*   **`turfRoutes.js`**: Listens for `/api/turfs` (gets all turfs to show on the homepage).
*   **`bookingRoutes.js`**: Listens for `/api/bookings`.

### 5. Business Logic (`controllers/`)
These files contain the actual JavaScript logic. Whenever the frontend calls a Route, the Route passes the data to the Controller, and the Controller interacts with the Database (Models).
*   **`authController.js`**: Hashes passwords, checks if users exist, and generates secure JWT tokens.
*   **`turfController.js`**: Fetches turf data from the Postgres table and sends it back as JSON to the frontend.
*   **`bookingController.js`**: Takes the `serviceId`, `date`, and `time` sent from the frontend and inserts a new row into the `Bookings` Postgres table. 

### 6. Security (`middleware/`)
*   **`authMiddleware.js`**: A protective checkpoint. If the frontend tries to call a protected route (like creating a booking), this file checks if the request contains a valid JWT login token. If it doesn't, it blocks the request.

---

## 🔄 Example Flow: How an End-to-End Booking Works

When a user on your frontend clicks **"Confirm Booking"**, here is exactly how the files talk to each other to save it to PostgreSQL:

1.  **Frontend**: Sends a `POST` request containing `{ date: '...', time: '...', serviceId: '...' }` to `http://localhost:5000/api/bookings`.
2.  **`server.js`**: Receives the request and forwards it to `bookingRoutes.js`.
3.  **`bookingRoutes.js`**: Validates the JWT token using `authMiddleware.js`, then hands the data over to `bookingController.js`.
4.  **`bookingController.js`**: Receives the data and uses Sequelize (`Booking.create(...)`) to write a new SQL row.
5.  **`models/Booking.js`**: Sequelize uses this blueprint to insert the raw data correctly into the PostgreSQL `Bookings` table.
6.  **Response**: The controller sends a successful JSON reply back to the Frontend.

---

## 🚀 How to Run the Backend
1. Ensure your PostgreSQL database named `smartslot` is running locally.
2. Open a terminal inside the `backend` folder.
3. Run `npm install` (only required once).
4. Run `npm start` (or `npm run dev` for automatic reloading).
5. Watch the terminal output; you should see `"PostgreSQL Models Synced - Automatic Table Creation Complete"`.
