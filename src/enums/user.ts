export enum USER_ROLES {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
}

export enum USER_STATUS {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RESTRICTED = 'RESTRICTED',
  // Key renamed to `DELETED` (past-participle — consistent with other
  // terminal states like `CANCELED` / `EXPIRED`). The stored string value
  // stays `'DELETE'` so no DB migration is needed.
  DELETED = 'DELETE',
}
