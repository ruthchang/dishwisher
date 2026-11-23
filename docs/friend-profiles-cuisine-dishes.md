# Cuisine dishes and claimable friend profiles

## Goal
A cuisine-level dish can be wished for, tried, and rated without any restaurant. Restaurant-level wishes and dishes can also record recommendations and ratings from friends, including people without accounts.

## Core behavior
- Separate dish scope (cuisine or restaurant) from each person's status (wish, tried-unrated, tried-rated).
- Cuisine dish requires cuisine and dish name, but not restaurant. A restaurant dish requires a restaurant association.
- Multiple people can recommend or rate the same dish. A rating belongs to a person, not to a recommendation; recommendations and ratings remain distinct.
- An unregistered friend can have a reusable profile, wishes, and attributed ratings. Mark unconfirmed, third-party-entered ratings clearly.
- On invitation and verified acceptance, a friend can claim an existing profile, review imported records, and confirm or remove them. A matching name or email alone must never transfer ownership.
- The creator of a recommendation can edit their own attribution, but cannot impersonate a registered friend's verified rating.
- Preserve existing cuisine wishes, linked tried dishes, restaurant wishes, and ratings through additive migration.

## Proposed data model
- FriendProfile: id, displayName, email (optional; private), claimedUserId (nullable, unique), createdById, createdAt, claimedAt.
- FriendInvite: id, friendProfileId, invitedById, email, tokenHash, expiresAt, acceptedAt, revokedAt. Never store raw tokens.
- Recommendation: id, authorUserId, friendProfileId (optional), dishId (optional), wishId (optional), cuisineWishId (optional), notes, createdAt, provenance (self-reported / entered-on-behalf / confirmed).
- FriendWish: id, friendProfileId, cuisine, dishName, restaurantId (optional), status, createdById, claimedConfirmedAt (optional).
- FriendRating: id, friendProfileId, dishId, value (nullable for unrated), createdById, confirmedAt (optional), createdAt.
- Extend Dish with cuisine field and explicit scope; restaurant association nullable. Do not infer cuisine from restaurant alone.
- Prefer stable IDs and uniqueness scoped to a person and dish; do not collapse distinct restaurant dishes into a cuisine-level record.

## Forms
- Both restaurant wishes and restaurant dishes: optional recommended-by friend selector, free-text create-new friend, optional friend email, optional friend rating.
- Both cuisine wishes and cuisine dishes: cuisine, dish name, friend selector, optional friend rating, notes.
- When marked tried: allow own rating or not-yet-rated; retain the wish and recommendation history.
- Show friend's rating distinctly from own rating and aggregated ratings.
- Support multiple friends' recommendations without overwriting earlier records.

## Rollout plan
1. Inspect current Prisma/Postgres and cuisine-wishes SQL usage, API routes, and auth/session handling.
2. Implement additive DB migration with indexes, foreign keys, and non-destructive backfill; verify migration against a copy of existing data.
3. Add profile, recommendation, rating, and invitation endpoints with authentication, authorization, validation, and idempotency.
4. Update existing forms and lists, preserving responsive behavior and current cuisine-wish editing/linking.
5. Add claim flow with expiring one-time tokens, verified email, explicit acceptance, and record reconciliation.
6. Test wish-to-tried transitions, unrated states, multiple friends, duplicate names, conflicting emails, expired invites, unauthorized edits, and legacy records.
7. Deploy to preview first; do not run production migration or merge without review.

## Security / privacy
- Email must be optional, private, and never used to automatically claim records.
- Only an invite recipient with verified identity and valid one-time token may claim a profile; prevent claims of already-claimed profiles.
- Track record provenance and let claimed users confirm or reject entries made on their behalf.
- Keep invitation tokens hashed at rest, expiring, single-use, and rate-limited.
