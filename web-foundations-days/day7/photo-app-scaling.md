# SnapShare Scaling Plan

## 1. Assumptions & Daily Active Users (DAU)

- **Registered Users:** 10,000,000
- **Activity Rate:** 10% active per day
- **Daily Active Users (DAU):** 1,000,000 DAU
- **Content Generation:** Each active user uploads **1 photo per day**.
- **Consumption:** Each active user views **50 feed pages per day**.
- **File Sizes:** Average original photo size is **2 MB**, and each generated thumbnail is **50 KB**
- **Time Conversion:** Using the standard back-of-the-envelope estimate of **100,000 seconds per day** for simplified math.

---

## 2. Calculations

- **Uploads Per Second:**
  $$\frac{1,000,000 \text{ uploads/day}}{100,000 \text{ seconds/day}} = \mathbf{10 \text{ uploads/sec}}$$

- **Feed Views Per Second (Average):**
  $$\frac{1,000,000 \text{ users} \times 50 \text{ feed views/day}}{100,000 \text{ seconds/day}} = \frac{50,000,000 \text{ views/day}}{100,000 \text{ seconds/day}} = \mathbf{500 \text{ views/sec}}$$

- **Feed Views Per Second (Peak - $5\times$ multiplier):**
  $$500 \text{ views/sec} \times 5 = \mathbf{2,500 \text{ views/sec}}$$

- **Total Storage Per Year:**
  - Size per photo item = $2 \text{ MB (original)} + 0.0488 \text{ MB (thumbnail)} = 2.0488 \text{ MB}$
  - Daily storage = $1,000,000 \text{ uploads} \times 2.0488 \text{ MB} = 2,048,800 \text{ MB/day} \approx 2.05 \text{ TB/day}$
  - Yearly storage = $2.05 \text{ TB/day} \times 365 \text{ days} = \mathbf{748.25 \text{ TB/year}}$ _(or ~713 TiB)_

---

## 3. Read-Heavy vs. Write-Heavy Analysis

- **System Classification:** **Read-Heavy**.
- **Design Implications:** With 500 average (and 2,500 peak) reads per second compared to only 10 writes per second, the read-to-write ratio is 50:1. This means the architecture must prioritize read scalability through aggressive caching layers, Content Delivery Networks (CDNs), and database read replicas to prevent database bottlenecks, while write traffic remains relatively easy to handle on primary nodes.

---

## 4. Why Photos Should Not Be Stored in the Database

Relational or NoSQL databases are optimized for structured transactional data, indexing, and fast querying—not for storing large binary objects (BLOBs). Storing 2 MB photo files directly inside a database would bloat database size, severely degrade backup and migration times, consume expensive RAM for caching table pages instead of index keys, and quickly cause performance bottlenecks. Instead, photos should be stored in **Object Storage** (such as Google Cloud Storage), which is infinitely scalable, cost-effective for binary blobs, and designed to serve large media files efficiently.

---

## 5. Architecture Diagram

```text
       [ Clients (Web / Mobile) ]
                   │
                   ▼
             [ CDN (Edge) ] ── (Cached Images / Static Assets)
                   │
                   ▼
          [ Load Balancer (LB) ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
 [ App Server 1 ]    [ App Server 2 ]
         │                   │
         ├───────────────────┼──────────────┐
         ▼                   ▼              ▼
    [ Redis Cache ]   [ Primary DB ]   [ Message Queue ]
                             │              │
                     [ Read Replica ]  [ Background Worker ]
                                            │
                                            ▼
                                   [ Object Storage ]
```

## 6. Component Explanations

1. CDN(Content Delivery Network): Caches and serves static photo assets and thumbnails from edge locations closest to users to drastically reduce latency and server bandwidth.

2. Load Balancer: Distributes incoming user traffic evenly across multiple application servers to ensure high availability and prevent any single server from becoming a bottleneck.

3. App Servers: Stateless application nodes that handle API requests, authenticate users, and coordinate data flow between storage, cache, and databases.

4. Cache (Redis): In-memory data store that holds hot data such as user sessions, recent feed timelines, and profile metadata to serve reads with sub-millisecond latency.

5. Primary Database: Handles all write transactions (user signups, photo metadata records, follows, and likes) to maintain strict consistency.

6. Database Read Replica: Synchronized copy of the primary database dedicated to handling heavy read traffic for feeds and user profiles, offloading the primary write node.

7. Object Storage: Scalable cloud storage bucket repository optimized to securely store raw image files and generated thumbnails.

8. Message Queue: Asynchronous task buffer (e.g., RabbitMQ or SQS) that decouples time-consuming media processing tasks from the primary HTTP request-response cycle.

9. Background Worker: Consumer service that pulls tasks from the message queue to resize uploaded images and generate optimized thumbnails without blocking user requests.

##. 7. Step-by-Step Upload Flow

1. Initiate Upload: The client app sends an HTTP POST request containing the image binary to the Load Balancer, which routes it to an active App Server.

2. Store Binary File: The App Server uploads the raw, full-size 2 MB image file directly into Object Storage, receiving back a public object URL/key.

3. Save Metadata: The App Server inserts a new record into the Primary Database containing the image URL, user ID, caption, and timestamp.

4. Queue Thumbnail Job: The App Server pushes a lightweight background job payload (containing the image reference ID and storage path) onto the Message Queue and immediately returns an HTTP 201 "Upload Successful" response to the client.

5. Asynchronous Processing: A Background Worker picks up the job from the queue, downloads the raw photo from Object Storage, compresses it into a 50 KB thumbnail, and uploads the thumbnail back to Object Storage.

## 8. Trade-offs

- **Consistency vs. Immediate Thumbnail Availability:** By using a message queue to generate thumbnails asynchronously so the user gets an instant upload response, the thumbnail may fail to appear for a split second after the photo is posted.

- **Storage Cost vs. Read Perfomance:** Caching pre-computed user feed timelines in Redis speeds up read requests significantly, but requires extra memory and complex cache-invalidation logic whenever a followed user uploads a new photo.
