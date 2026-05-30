# Stage 1

### 1. Actions

- Fetch notifications (filter by read/unread, pagination)
- Mark one or more as read
- Mark all as read
- Get unread count

### 2. Authentication

- All endpoints require `Authorization: Bearer <jwt>` and will make a middleware to check the authentication.

### 3. Notification Schema

```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "isRead": false,

},{"timestamps":true}


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
