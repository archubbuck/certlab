### Details of TypeScript Issues and Fixes

#### 1. Missing 'requiresApproval' Property
Objects are breaking type definitions because this property is required but missing.

**Fix:** Add `requiresApproval` to all relevant type definitions and object implementations where necessary. Ensure optional properties are marked correctly in interfaces like this:

```typescript
interface Resource {
    id: string;
    resourceType: "template" | "quiz" | "lecture";
    requiresApproval: boolean; // Add missing property
}
```

#### 2. Incompatible Method Signature for `getUserEnrollments`
The signature in `FirestoreStorage` and `StorageRouter` needs to align with the `IClientStorage` interface by adding the `tenantId` parameter:

```typescript
getUserEnrollments(userId: string, tenantId: number, resourceType?: "template" | "quiz" | "lecture"): Promise<Enrollment[]> {
    // Ensure the implementation matches the interface contract
}
```

#### 3. Incorrect Comparisons
There are instances where comparisons between incompatible types (e.g., `EnrollmentStatus` and strings) are causing issues:

```typescript
// Current problematic code
if (enrollmentStatus === "dropped") {
    //...
}
```

Adjust to explicitly cast or allow overlap in type unions:

```typescript
if ((enrollmentStatus as string) === "dropped") {
    //...
}
```

#### 4. Nonexistent Properties in Interfaces
Errors such as `Property 'createdAt' does not exist on type 'Assignment'` indicate missing definitions. Update the `Assignment` interface (or any affected type) like this:

```typescript
interface Assignment {
    createdAt: Date; // Ensure relevant properties exist
}
```

Similarly, add or correct properties like `groupId` in the `Group` interface and others as indicated.

#### 5. Other Implementation Gaps
Ensure methods like `unenrollUser`, `rejectEnrollment`, `createAssignment`, etc., are implemented in classes extending `IClientStorage`:

```typescript
class FirestoreStorage implements IClientStorage {
    unenrollUser(): void {
        // Implement missing methods
    }
}
```

### Strategy
Fix all indicated issues systematically and rerun the workflow to validate fixes. Update the workflow file `.github/workflows/type-check.yml` to enforce stricter linting rules during validation.