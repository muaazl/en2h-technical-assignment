# EN2H Software Engineer Intern - Booking Platform API

**Author**: Abdul Lattif Muaaz

---

## Project Overview
This project is a robust, production-ready Booking Platform API built using NestJS. It provides key features for managing services and booking appointments, incorporating secure user registration and JWT-based authentication for administrative and management access. The application is designed to be highly scalable, performant, and secure, ensuring client personal identifiable information (PII) is protected at all stages.

---

## Tech Stack
- **Framework**: NestJS (v11)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Containerization**: Docker
- **Language**: TypeScript

---

## Installation Steps
To install the project dependencies, ensure you have [pnpm](https://pnpm.io/) installed, then run:

```bash
pnpm install
```

---

## Environment Variables
Create a `.env` file in the root directory and populate it with the required configurations. You can use the following `.env.example` content as a template:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/booking_platform?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgrespassword
POSTGRES_DB=booking_platform

# JWT Configuration
JWT_SECRET="super-secret-access-key-should-be-changed"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="super-secret-refresh-key-should-be-changed"
JWT_REFRESH_EXPIRATION="7d"
```

---

## Database Setup & Running the Application

1. **Spin up the PostgreSQL database container**:
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations/sync database schema**:
   ```bash
   pnpm prisma db push
   ```

3. **Start the application in development mode**:
   ```bash
   pnpm run start:dev
   ```

---

## API Documentation
The API is documented using Swagger. To view and interact with the endpoints:
1. Start the application.
2. Open your browser and navigate to `http://localhost:3000/api`.

This interactive UI allows you to explore detailed request schemas, query parameters, authentication options, and execute test requests directly against your local server.

<img width="2910" height="4152" alt="localhost_3000_api(Macbook Air)" src="https://github.com/user-attachments/assets/fdd01e60-582f-434e-b71d-1566a8b36b52" />

---

## Assumptions Made
* **Single-Role Authentication**: A single-role administrative/management model was implemented to avoid over-engineering the application at this scale. Registered users represent the administrative and management personnel, avoiding complex multi-role systems (such as distinct manager, supervisor, and clerk roles) while still keeping configuration simple and clean.
* **Public Booking Creation**: Booking creation has been left public. This decision allows end-customers to freely schedule bookings without requiring registration.
* **Protected Management Endpoints**: Endpoints for viewing, listing, updating, and deleting bookings or services are secured using JWT guards. This ensures customer PII (e.g., email, phone, name) is not exposed to the public internet and can only be accessed by authenticated personnel.

---

## Future Improvements
* **Role-Based Access Control (RBAC)**: Expand the authentication system to support multiple user roles (e.g., Admin, Receptionist, Customer) with fine-grained access levels.
* **Notification System**: Integrate an email or SMS notification system (e.g., using SendGrid, Amazon SES, or Twilio) to automatically notify customers when booking creations, updates, or cancellations occur.
* **Service Availability Rules**: Implement robust scheduling rules, including checking calendar availability, blackout dates, opening hours, and staff schedules to prevent overbooking or bookings during non-operational hours.
* **Unit and Integration Test Expansion**: Add comprehensive E2E (End-to-End) tests for controllers and database-level integrations, and further expand unit test coverage across all guards and modules.
