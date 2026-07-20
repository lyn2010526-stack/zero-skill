# Authorization Test Protocol

## Fixture Matrix

Create synthetic principals and resources:

| Principal | Tenant | Role | Resource ownership |
| --- | --- | --- | --- |
| anonymous | none | none | none |
| user-a | tenant-a | member | resource-a |
| user-b | tenant-a | member | resource-b |
| user-c | tenant-b | member | resource-c |
| admin-a | tenant-a | admin | tenant-a scope |

## Required Assertions

- Anonymous requests receive the documented denial response.
- Owners can perform explicitly allowed operations.
- Same-tenant non-owners receive denial where ownership is required.
- Cross-tenant principals receive denial at the service or query boundary.
- Members cannot invoke administrator operations.
- Administrators remain bounded to their documented tenant or global scope.
- Missing, malformed, expired, and revoked synthetic sessions fail closed.
- Denial responses avoid disclosing resource existence when required.
- Batch, export, indirect-reference, and nested-resource paths apply the same policy.

## Test Construction

Use the framework's local test client, in-memory service, or loopback mock. Seed deterministic IDs. Assert status, stable response fields, data-store side effects, emitted audit events, and query ownership filters.

Test the route guard and the deeper service or data-access invariant where possible. A route-only assertion provides incomplete coverage when internal callers can reach the operation.

## Evidence Output

For each matrix cell record test ID, principal class, resource class, operation, expected decision, actual decision, source locator, response hash, side-effect assertion, and result. Store synthetic credentials only in test scope.
