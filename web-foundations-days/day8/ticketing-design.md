# TicketHub System Architecture & Design Document

## 1. Requirements

### Functional Requirements

1. **Event Browsing & Search:** Users can browse, search, and filter upcoming concerts and events by category, date, and location.
2. **Seat Selection:** Users can view a real-time seating map for an event and select available seats.
3. **Temporary Seat Hold:** When a user selects specific seats, the system places a temporary lock (hold) on those seats for a limited time (e.g., 10 minutes) to allow time for checkout without interference.
4. **Payment & Order Processing:** Users can complete secure checkout and payment processing to confirm ticket purchases, generating an official order and digital tickets.
5. **Ticket Management & Viewing:** Users can view their purchased tickets, complete with unique QR codes or barcodes for event entry validation.

### Non-Functional Requirements

1. **Correctness (Zero Double-Booking):** Absolute consistency; under no circumstances can two users successfully purchase or be assigned the exact same seat for an event.
2. **Fairness:** First-come, first-served access during high-demand sales, supported by virtual waiting rooms (queuing) to prevent bot domination and race conditions.
3. **Performance & Speed:** Seat selection requests and page loads must respond under 300 ms on normal days. During peak traffic, core API endpoints (such as seat holding and payment checkout) must scale horizontally to handle extreme throughput with minimal latency.
4. **Reliability & Availability:** The checkout and payment pathways must maintain 99.99% availability during major ticket drops.

---

## 2. Traffic Estimates

### Baseline (Normal Traffic)

- **Registered Users:** 2,000,000
- **Daily Active Visitors:** 50,000 people/day
- **Page Views per User:** 10 pages/day
- **Total Daily Page Views:** 50,000 \* 10 = 500,000 page views/day
- **Average Request Rate (QPS):**
  - $500,000 views / 86,400 seconds = **5.8 QPS**$
- **Ticket Sales (Normal):** 5,000 tickets sold/day

### Peak Traffic ("Big Sale" Event)

- **Event Scenario:** A very popular concert goes on sale.
- **Surge Volume:** 200,000 eager fans attempt to buy 20,000 seats within the first 10 minutes.
- **Duration:** 10 minutes = 600 seconds.
- **Peak Request Rate (QPS):**
  - $200,000 users / 600 seconds = 333 requests/second$ (average burst rate at gateway, with peak spikes potentially hitting 1,000+ QPS during the exact second of release).
- **Comparison:** Peak traffic represents roughly a **50x to 100x surge** over normal baseline QPS, heavily concentrating database write operations around seat locks and order placements.

---

## 3. API Endpoints

1. **`GET /api/events`**
   - _Description:_ Browse or search upcoming events with filtering options.
   - _Response:_ List of event objects (ID, title, date, venue, thumbnail).

2. **`GET /api/events/{eventId}/seats`**
   - _Description:_ Retrieve the live seating map and availability status for a specific event.
   - _Response:_ List of seats with their current status (`AVAILABLE`, `HELD`, `BOOKED`).

3. **`POST /api/seats/hold`**
   - _Description:_ Temporarily lock selected seats for a user during checkout (typically 10 minutes).
   - _Request Body:_ `{"userId": "string", "seatIds": ["string"], "eventId": "string"}`
   - _Response:_ Hold confirmation token and expiration timestamp.

4. **`POST /api/orders`**
   - _Description:_ Process payment and finalize ticket purchase for held seats.
   - _Request Body:_ `{"holdToken": "string", "paymentDetails": {...}}`
   - _Response:_ Generated order object and ticket identifiers.

5. **`GET /api/users/{userId}/tickets`**
   - _Description:_ Retrieve all active and past tickets owned by a user.
   - _Response:_ List of confirmed tickets and QR code access tokens.

---

## 4. Data Model (Database Schema)

### Users Table (`users`)

- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `created_at` (Timestamp)

### Events Table (`events`)

- `id` (UUID, Primary Key)
- `title` (String)
- `description` (Text)
- `start_time` (Timestamp)
- `venue` (String)

### Seats Table (`seats`)

- `id` (UUID, Primary Key)
- `event_id` (UUID, Foreign Key referencing `events.id`)
- `seat_number` (String, e.g., "A-12")
- `status` (Enum: `AVAILABLE`, `HELD`, `BOOKED`)
- `held_until` (Timestamp, nullable)
- `version` (Integer, for optimistic locking)

### Orders Table (`orders`)

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key referencing `users.id`)
- `event_id` (UUID, Foreign Key referencing `events.id`)
- `total_amount` (Decimal)
- `status` (Enum: `PENDING`, `COMPLETED`, `CANCELLED`)
- `created_at` (Timestamp)

---

## 5. Preventing Double-Booking

To guarantee that two users can never purchase the same seat, TicketHub employs a multi-layered concurrency control strategy:

1. **Database Transactions with Row-Level Locking (`SELECT ... FOR UPDATE`):**
   When a user attempts to hold or purchase a seat, the application initiates an explicit database transaction with serializable or repeatable read isolation. It executes a lock query:

   ```sql
   SELECT status FROM seats WHERE id = 'seat_uuid' FOR UPDATE;
   ```

   This immediately locks the specific seat row in the database. Any concurrent transaction trying to access the same seat will block until the first transaction commits or rolls back.

2. **Conditional Status Check:**
   Inside the locked transaction, the system checks whether `status == 'AVAILABLE'`. If true, it updates the status to `HELD` (or `BOOKED`) and sets a `held_until` timestamp. If the status is already `HELD` or `BOOKED`, the transaction aborts and rejects the request.

3. **Database Constraints & Expiration Workers:**
   Unique constraints on booked seats prevent duplicate entries in order-item mappings. Additionally, background worker processes periodically release expired holds (`held_until < NOW()` where status is `HELD`), reverting them back to `AVAILABLE`.

---

## 6. Architecture & High-Traffic Scaling

```
[ Clients / Users ]
        │
        ▼
[ Cloudflare / CDN (Static Assets & DDoS Protection) ]
        │
        ▼
[ API Gateway / Load Balancer (Nginx / ALB) ]
        │
        ├───────────────────────────────┐
        ▼                               ▼
[ Waiting Room Queue (Redis) ]   [ App Servers Cluster (Node.js / Express) ]
                                        │
                                        ├───────────────┬───────────────┐
                                        ▼               ▼               ▼
                                 [ Read Cache ]   [ Primary DB ]  [ Background Workers ]
                                 (Redis / Memcached) (PostgreSQL)  (Expired Hold Cleanup)
```

### Component Explanation

- **CDN & Load Balancer:** Distributes incoming user traffic across multiple application servers, absorbing initial connection spikes and caching static assets.
- **Waiting Room Queue (Redis):** During major ticket drops (e.g., 200,000 users attempting to buy 20,000 seats), a virtual waiting room queue throttles incoming traffic, letting users through in controlled batches to protect the backend from being overwhelmed.
- **App Servers Cluster:** Stateless Node.js servers handling business logic, user authentication, and API routing.
- **Read Cache (Redis):** Caches event details, seating maps, and user profiles to serve read-heavy browsing requests without touching the primary database.
- **Primary Relational Database (PostgreSQL):** Handles ACID-compliant transactions, row-level locks, and persistent storage for users, events, seats, and orders.
- **Background Workers:** Scheduled cron jobs or worker queues that scan for expired seat holds and transition them back to available status.

---

## 7. Trade-Offs

1. **Strong Consistency vs. Eventual Consistency:**
   - _Trade-off:_ We chose **Strong Consistency** (ACID transactions with row-level locks) for seat selection and checkout. While this introduces minor locking overhead and potential connection queue wait times during high concurrency, it is non-negotiable for ticketing systems where double-booking destroys user trust and business integrity.
2. **Virtual Waiting Room vs. Direct Unlimited Access:**
   - _Trade-off:_ Implementing a virtual waiting room queue during high-demand sales frustrates some users who experience wait times. However, the alternative—allowing unrestricted simultaneous access—causes database connection exhaustion, severe latency, and server crashes, ultimately degrading the experience for everyone.

---
