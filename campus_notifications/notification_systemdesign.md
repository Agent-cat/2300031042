# Stage 1

### 1. Actions

- Fetch notifications (filter by read/unread, pagination)
- Mark one or more as read
- Mark all as read
- Get unread count

### 2. Authentication

- All endpoints require `Authorization: Bearer <jwt>` and will make a middleware to check the authentication.

### 3. Notification Schema

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

```

### 4. Endpoints (base: /api/v1)

- GET `/notifications` — paginated
- GET `/notifications/count` — unread count
- PATCH `/notifications/read`
- POST `/notifications/read-all`

- i will use pagination in /notifications for faster querys as the number of notifications can be higher
- i will index the `id` in the Notification Schema for faster search results
- for marking notifications as read i will use a single endpoint that accepts an array of notification ids to mark them as read in one request instead of making multiple requests for each notification

### 5. Realtime

For realtime notifications i will use Redis pub/sub to push new notifications to clients

- whenever a notification is created it publishes it all the recipents will be subscribed to the same channel in which the event is published

---

# Stage 2

### 1. Database Choice

i will use **PostgreSQL** for storing notifications. Here is why:

- It is a relation database that guarantees consistency with ACID Properties.
- Notifications require fast lookups on user IDs and read/unread status. in PostgreSQL indexes handle these perfectly.
- It integrates easily with TypeScript ORMs like Prisma
-

### 2. Database Schema

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);
```

### 3. Problems with Large Data Volume

As the platform grows and notifications build up over time:

1. **Query Degradation**: The table size will grow to millions of records. Even with indexes, querying for older notifications or running counts will slow down and use more DB memory.
2. **Counting Overhead**: Doing `COUNT(*)` for unread notifications on every page reload will become slow because the DB has to scan index nodes for large volumes of items.
3. **Storage & Index Bloat**: Old notifications (e.g. read notices from 6 months ago) are rarely viewed but they still occupy disk space and keep indexes bloated, reducing query cache efficiency.

### 4. How I Will Solve These Problems

1. **Table Partitioning**: i will partition the `notifications` table by date (monthly partitions). Since users almost always look at recent notifications, DB reads will only hit the current month's partition, keeping queries fast.
2. **Unread Count Caching**: instead of hitting the DB with `COUNT(*)` every time a page loads, i will cache the unread count in Redis
   - Increment the cache value when a notification is created.
   - Decrement the cache value when a notification is marked as read.
3. **Cron Job**: i will set up a background cron worker to automatically delete or archive notifications older than 90 days
4. **Using Queues**: For campus-wide broadcasts, instead of writing them directly to the DB synchronously, i will push them to a queue (like Redis or BullMQ) to insert them in batches, spreading the load.

### 5. SQL Queries

#### GET `/notifications` (Paginated)

i will use keyset pagination instead of `LIMIT/OFFSET` because offset pagination gets progressively slower for deep pages.

```sql

SELECT * FROM notifications
WHERE user_id = :userId
ORDER BY created_at DESC
LIMIT :limit;

SELECT * FROM notifications
WHERE user_id = :userId
  AND created_at < :cursor
ORDER BY created_at DESC
LIMIT :limit;
```

#### GET `/notifications/count` (Unread Count - query fallback if cache misses)

```sql
SELECT COUNT(*) FROM notifications
WHERE user_id = :userId
  AND is_read = FALSE;
```

#### PATCH `/notifications/read` (Mark specific notifications as read)

```sql
UPDATE notifications
SET is_read = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = :userId
  AND id = ANY(:notificationIds);
```

#### POST `/notifications/read-all` (Mark all notifications as read)

```sql
UPDATE notifications
SET is_read = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = :userId
  AND is_read = FALSE;
```

---
