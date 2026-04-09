# 🛠️ RESTful API Design Rules & Guidelines

Follow these rules for all future API development and audits to ensure consistency and scalability.

## 1. 📂 Resource-Based Naming
- **Rule**: Use plural nouns for resources.
- **Why**: APIs represent collections of things. `/users` means "the collection of users".
- **Examples**:
  - ✅ `/users`, `/preference-cards`, `/subscriptions`
  - ❌ `/user`, `/preference-card`, `/subscription`

## 2. 🚫 No Verbs in URLs
- **Rule**: URLs should only contain nouns. Actions are defined by HTTP methods.
- **Why**: RESTful design uses HTTP verbs (GET, POST, etc.) to describe the action. Adding verbs to the URL is redundant and non-standard.
- **Examples**:
  - ❌ `/get-users`, `/create-user`, `/update-status`, `/block-user`
  - ✅ `GET /users`, `POST /users`, `PATCH /users/:userId`, `PATCH /users/:userId` (with status in body)

## 3. 🚦 Correct Use of HTTP Methods
| Method | Usage |
| :--- | :--- |
| **GET** | Retrieve a resource or collection. |
| **POST** | Create a new resource or perform a complex action (like login). |
| **PUT** | Replace an entire resource. |
| **PATCH** | Update specific fields of a resource. |
| **DELETE** | Remove a resource. |

## 4. 🔗 Nested Resources
- **Rule**: Use nesting to show relationships.
- **Example**: `GET /users/:userId/preference-cards` (Get all cards belonging to a specific user).
- **Note**: Path params must be **meaningful** — use `:userId`, `:cardId`, `:bookingId` etc. Never bare `:id` (ambiguous, collides in nested routes, harder to grep).

## 5. 🛠️ Sub-Resources for Actions
- **Rule**: If an action is complex or needs to be tracked, treat it as a sub-resource.
- **Example**: Instead of `POST /preference-cards/:id/favorite`, use `POST /preference-cards/:id/favorites`.

## 6. 📁 File Handling (Binary Data)
- **Rule**: Use `multipart/form-data` for file uploads. Use specific middleware (like `fileHandler`) to process them.
- **Response**: Always return the URL or metadata of the uploaded file.

## 7. 🔢 Versioning
- **Rule**: Always prefix routes with a version.
- **Example**: `/api/v1/...`

## 8. 📝 Consistency
- Use **kebab-case** for URL segments (e.g., `/preference-cards`).
- Use **camelCase** for JSON keys in request/response bodies.
- Return a standard response format:
  ```json
  {
    "success": true,
    "message": "Success message",
    "data": {},
    "pagination": {} // Optional
  }
  ```
