# 02. List Users (Admin)

```http
GET /users
Authorization: Bearer {{accessToken}} (SUPER_ADMIN)
```

> Comprehensive user list with card counts, specialties, and subscription status.

## Implementation
- **Route**: [user.route.ts](file:///src/app/modules/user/user.route.ts)
- **Controller**: [user.controller.ts](file:///src/app/modules/user/user.controller.ts) — `getAllUserRoles`
- **Service**: [user.service.ts](file:///src/app/modules/user/user.service.ts) — `getAllUserRolesFromDB`

### Business Logic (`getAllUserRolesFromDB`)
1. **Filtering**: Supports `search` (name/email), `email`, `role`, `status`, and `specialty`.
2. **Preference Card Stats**: Joins with `PreferenceCard` collection to calculate:
    - `cardsCount`: Total number of cards created by the user.
    - `specialties`: A unique list of specialties derived from the user's cards.
3. **Subscription Info**: Joins with `Subscription` collection to get:
    - `subscriptionStatus`: Defaults to `inactive` if no subscription found.
    - `subscriptionPlan`: Defaults to `FREE`.
4. **Pagination & Sorting**: Implements custom aggregation pipeline with `$facet` for data and total count.
5. **Projection**: Removes sensitive fields like `password` and `authentication`.

## Query Parameters
| Parameter | Description | Default |
| :--- | :--- | :--- |
| `search` | Name or email regex search | — |
| `email` | Exact or regex email match | — |
| `role` | Filter by role (`SUPER_ADMIN`, `USER`) | `USER` |
| `status` | Filter by status (`ACTIVE`, `INACTIVE`, `RESTRICTED`, `DELETE`) | — |
| `specialty` | Filter by specialty (regex match on calculated list) | — |
| `page` | Pagination page number | `1` |
| `limit` | Pagination limit | `10` |
| `sortBy` | Field name for sorting | `createdAt` |
| `sortOrder` | Sort direction (`asc` or `desc`) | `desc` |

## Responses

### Scenario: Success (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User list fetched",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Dr. John Doe",
      "email": "dr.john@example.com",
      "phone": "+123456789",
      "specialty": "Cardiology",
      "hospital": "City Hospital",
      "status": "ACTIVE",
      "verified": true,
      "role": "USER",
      "profilePicture": "https://i.ibb.co/z5YHLV9/profile.png",
      "specialties": ["Cardiology", "Surgery"],
      "cardsCount": 5,
      "subscriptionStatus": "active",
      "subscriptionPlan": "PREMIUM",
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  ]
}
```
