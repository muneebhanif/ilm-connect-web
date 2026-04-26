# Graph Report - ilm-web  (2026-04-27)

## Corpus Check
- 28 files · ~577,195 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 103 nodes · 107 edges · 7 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 15 edges
2. `TeacherDashboard()` - 7 edges
3. `normalizeTeacherProfileResponse()` - 5 edges
4. `BookTeacher()` - 5 edges
5. `getTeacherCoverImage()` - 4 edges
6. `DashboardLayout()` - 4 edges
7. `pickSubjectArt()` - 3 edges
8. `getCourseThumbnail()` - 3 edges
9. `TeacherDetail()` - 3 edges
10. `CourseCard()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `ParentDashboard()` --calls--> `useAuth()`  [INFERRED]
  src/pages/dashboard/ParentDashboard.jsx → src/lib/auth.jsx
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  src/App.jsx → src/lib/auth.jsx
- `DashboardRedirect()` --calls--> `useAuth()`  [INFERRED]
  src/App.jsx → src/lib/auth.jsx
- `BookTeacher()` --calls--> `normalizeTeacherProfileResponse()`  [INFERRED]
  src/pages/BookTeacher.jsx → src/lib/api.js
- `TeacherDashboard()` --calls--> `normalizeTeacherProfileResponse()`  [INFERRED]
  src/pages/dashboard/TeacherDashboard.jsx → src/lib/api.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (9): AdminDashboard(), DashboardRedirect(), ProtectedRoute(), useAuth(), ClassRoom(), Login(), Navbar(), Signup() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (8): apiFetch(), authFetch(), getCourseThumbnail(), normalizeTeacher(), normalizeTeacherProfileResponse(), pickSubjectArt(), CourseCard(), TeacherDetail()

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (5): buildProfileChecklist(), getVerificationTone(), mapErr(), normalizeAvailabilityMap(), TeacherDashboard()

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (3): getTeacherCoverImage(), FeaturedTeacherCard(), TeacherCard()

### Community 7 - "Community 7"
Cohesion: 0.6
Nodes (3): DashboardLayout(), getRoleLabel(), getTabsForRole()

### Community 8 - "Community 8"
Cohesion: 0.6
Nodes (3): BookTeacher(), extractSlotsForDay(), getPackageUnitPrice()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (1): ParentDashboard()

## Knowledge Gaps
- **Thin community `Community 9`** (4 nodes): `formatDate()`, `PageHeader()`, `ParentDashboard()`, `ParentDashboard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 0` to `Community 1`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.330) - this node is a cross-community bridge._
- **Why does `TeacherDashboard()` connect `Community 4` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `normalizeTeacherProfileResponse()` connect `Community 1` to `Community 8`, `Community 4`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `DashboardRedirect()`) actually correct?**
  _`useAuth()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `TeacherDashboard()` (e.g. with `useAuth()` and `normalizeTeacherProfileResponse()`) actually correct?**
  _`TeacherDashboard()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `normalizeTeacherProfileResponse()` (e.g. with `TeacherDetail()` and `BookTeacher()`) actually correct?**
  _`normalizeTeacherProfileResponse()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BookTeacher()` (e.g. with `useAuth()` and `normalizeTeacherProfileResponse()`) actually correct?**
  _`BookTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._