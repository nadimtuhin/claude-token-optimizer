# Angular Setup Example

**Quick setup for Angular projects - Copy and customize**

---

# Setup Claude Code Documentation for [Angular Project Name]

## Project Context

**Project Type**: Angular Application
**Tech Stack**:
- Angular 17+ (Standalone Components)
- TypeScript
- [State: NgRx / Signals / Services]
- [Styling: Angular Material / Tailwind / SCSS]
- [Testing: Jasmine + Karma / Jest]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Angular-specific content below.

## Angular-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (Angular 17+ Standalone)

src/
├── app/
│   ├── components/       # Standalone components
│   ├── services/         # Injectable services
│   ├── guards/           # Route guards
│   ├── interceptors/     # HTTP interceptors
│   ├── pipes/            # Custom pipes
│   ├── directives/       # Custom directives
│   ├── models/           # TypeScript interfaces/types
│   ├── app.routes.ts     # Route configuration
│   ├── app.config.ts     # App configuration
│   └── app.component.ts  # Root component
├── assets/               # Static assets
└── environments/         # Environment configs

## Key Patterns

### Component Structure
- Standalone components (recommended in Angular 17+)
- Component composition with inputs/outputs
- OnPush change detection for performance
- Smart/Container vs Presentational components

### State Management
- Services with RxJS for simple state
- Signals for reactive state (Angular 16+)
- NgRx for complex application state

### Routing
- Standalone route configuration
- Lazy loading with loadComponent
- Route guards for authentication
- Resolvers for pre-loading data
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Angular Mistakes

### 1. Not Unsubscribing from Observables

**Symptom**: Memory leaks, duplicate API calls, performance degradation

**Anti-pattern:**
```typescript
export class MyComponent implements OnInit {
  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
    // ❌ Subscription never cleaned up!
  }
}
```

**Correct (Option 1 - takeUntilDestroyed):**
```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class MyComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.userService.getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => this.users = users);
  }
}
```

**Correct (Option 2 - async pipe):**
```typescript
export class MyComponent {
  users$ = this.userService.getUsers();
}

// Template:
// <div *ngFor="let user of users$ | async">{{ user.name }}</div>
```

### 2. Mutating Input Properties

**Anti-pattern:**
```typescript
@Component({
  selector: 'app-user-card',
  template: `<button (click)="updateName()">Update</button>`
})
export class UserCardComponent {
  @Input() user!: User;

  updateName() {
    this.user.name = 'New Name';  // ❌ Mutating input!
  }
}
```

**Correct:**
```typescript
@Component({
  selector: 'app-user-card',
  template: `<button (click)="updateName()">Update</button>`
})
export class UserCardComponent {
  @Input() user!: User;
  @Output() userChange = new EventEmitter<User>();

  updateName() {
    this.userChange.emit({ ...this.user, name: 'New Name' });
  }
}
```

### 3. Not Using OnPush Change Detection

**Symptom**: Unnecessary re-renders, poor performance

**Anti-pattern:**
```typescript
@Component({
  selector: 'app-user-list',
  // ❌ Default change detection checks on every event
  template: `...`
})
export class UserListComponent {}
```

**Correct:**
```typescript
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅
  template: `...`
})
export class UserListComponent {
  @Input() users: User[] = [];  // Works with immutable inputs
}
```

### 4. Importing Entire NgModule Instead of Standalone Components

**Anti-pattern (Angular 17+):**
```typescript
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],  // ❌ Imports everything!
  template: `<div *ngIf="show">Content</div>`
})
```

**Correct:**
```typescript
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgIf],  // ✅ Import only what you need
  template: `<div *ngIf="show">Content</div>`
})
```

### 5. Not Using trackBy in *ngFor

**Anti-pattern:**
```typescript
@Component({
  template: `
    <div *ngFor="let item of items">  <!-- ❌ Re-renders all on change -->
      {{ item.name }}
    </div>
  `
})
```

**Correct:**
```typescript
@Component({
  template: `
    <div *ngFor="let item of items; trackBy: trackById">
      {{ item.name }}
    </div>
  `
})
export class MyComponent {
  trackById(index: number, item: any) {
    return item.id;  // ✅ Track by unique ID
  }
}
```
```

### docs/learnings/

Create these Angular-specific files:

**component-patterns.md:**
```markdown
# Angular Component Patterns

## Standalone Components (Angular 17+)

### Basic Component
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>{{ title }}</h2>
      <button (click)="increment()">Count: {{ count }}</button>
    </div>
  `,
  styles: [`
    .card { padding: 1rem; border: 1px solid #ddd; }
  `]
})
export class UserCardComponent {
  title = 'My Component';
  count = 0;

  increment() {
    this.count++;
  }
}
```

### Input/Output Communication
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-user-form',
  standalone: true,
  template: `
    <input [value]="name" (input)="onNameChange($event)">
    <button (click)="submit()">Submit</button>
  `
})
export class UserFormComponent {
  @Input() name: string = '';
  @Output() nameChange = new EventEmitter<string>();
  @Output() submitForm = new EventEmitter<void>();

  onNameChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.nameChange.emit(value);
  }

  submit() {
    this.submitForm.emit();
  }
}
```

### Signals (Angular 16+)
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>Count: {{ count() }}</div>
    <div>Double: {{ double() }}</div>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);

  increment() {
    this.count.update(value => value + 1);
  }
}
```

## Services (Dependency Injection)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Singleton service
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}

// Usage in component:
export class MyComponent {
  private userService = inject(UserService);  // Modern inject()

  users$ = this.userService.getUsers();
}
```
```

**state-management.md:**
```markdown
# Angular State Management

## Simple State (Services + RxJS)

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  setUser(user: User) {
    this.userSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  logout() {
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
```

## Signals (Angular 16+)

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStore {
  // State
  private userSignal = signal<User | null>(null);
  private loadingSignal = signal(false);

  // Selectors
  user = this.userSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  isAuthenticated = computed(() => this.user() !== null);

  // Actions
  setUser(user: User) {
    this.userSignal.set(user);
  }

  setLoading(loading: boolean) {
    this.loadingSignal.set(loading);
  }
}
```

## NgRx (Complex State)

```typescript
// State
export interface AppState {
  users: User[];
  loading: boolean;
}

// Actions
export const loadUsers = createAction('[Users] Load Users');
export const loadUsersSuccess = createAction(
  '[Users] Load Users Success',
  props<{ users: User[] }>()
);

// Reducer
export const userReducer = createReducer(
  initialState,
  on(loadUsers, state => ({ ...state, loading: true })),
  on(loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false
  }))
);

// Effects
@Injectable()
export class UserEffects {
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        this.userService.getUsers().pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(() => of(loadUsersFailure()))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private userService: UserService
  ) {}
}

// Selectors
export const selectUsers = (state: AppState) => state.users;
export const selectLoading = (state: AppState) => state.loading;
```
```

**routing-patterns.md:**
```markdown
# Angular Routing Patterns

## Route Configuration (Standalone)

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./components/user/user.component')
      .then(m => m.UserComponent),
    resolve: {
      user: userResolver
    }
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes)
  ]
};
```

## Route Guards

```typescript
// guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

## Route Resolvers

```typescript
// resolvers/user.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { UserService } from '../services/user.service';

export const userResolver: ResolveFn<User> = (route, state) => {
  const userService = inject(UserService);
  const userId = route.paramMap.get('id')!;
  return userService.getUser(userId);
};
```

## Programmatic Navigation

```typescript
import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user',
  standalone: true,
  template: `<button (click)="goToEdit()">Edit</button>`
})
export class UserComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  goToEdit() {
    const userId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/users', userId, 'edit']);

    // Or with query params:
    this.router.navigate(['/users'], {
      queryParams: { page: 2, filter: 'active' }
    });
  }
}
```
```

**testing-patterns.md:**
```markdown
# Angular Testing Patterns

## Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card.component';

describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]  // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user name', () => {
    component.user = { id: 1, name: 'John Doe' };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.name')?.textContent).toContain('John Doe');
  });

  it('should emit event on button click', () => {
    spyOn(component.userChange, 'emit');

    const button = fixture.nativeElement.querySelector('button');
    button?.click();

    expect(component.userChange.emit).toHaveBeenCalled();
  });
});
```

## Service Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch users', () => {
    const mockUsers = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ];

    service.getUsers().subscribe(users => {
      expect(users.length).toBe(2);
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});
```

## Testing with Signals

```typescript
import { TestBed } from '@angular/core/testing';
import { UserStore } from './user.store';

describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserStore]
    });
    store = TestBed.inject(UserStore);
  });

  it('should update user', () => {
    const user = { id: 1, name: 'John' };

    store.setUser(user);

    expect(store.user()).toEqual(user);
    expect(store.isAuthenticated()).toBe(true);
  });
});
```
```

### QUICK_REFERENCE.md

```markdown
## Angular Quick Commands

# Development
ng serve              # Start dev server
ng build              # Production build
ng build --watch      # Watch mode
ng test               # Run tests (Karma/Jest)
ng lint               # ESLint
ng e2e                # E2E tests

# Generation
ng generate component <name> --standalone
ng generate service <name>
ng generate guard <name>
ng generate pipe <name>
ng generate directive <name>

# Common Patterns

### Standalone Component
```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  template: `<div>{{ data }}</div>`
})
export class MyComponent {}
```

### Service with DI
```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(private http: HttpClient) {}
}
```

### Signal State
```typescript
count = signal(0);
double = computed(() => this.count() * 2);
this.count.set(5);
this.count.update(n => n + 1);
```

### Route Navigation
```typescript
this.router.navigate(['/users', userId]);
```

### Environment Variables
```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```
```

## Expected Structure After Setup

```
my-angular-project/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Angular-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (Angular structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Angular commands)
│   ├── learnings/
│   │   ├── component-patterns.md
│   │   ├── state-management.md
│   │   ├── routing-patterns.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── guards/
│   │   └── app.routes.ts
│   └── environments/
└── angular.json
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For component work, load:
docs/learnings/component-patterns.md (~600 tokens)

# 3. For state management, load:
docs/learnings/state-management.md (~500 tokens)

# 4. For routing, load:
docs/learnings/routing-patterns.md (~400 tokens)

Total: ~1,300-1,500 tokens (vs 9,000+ before)
```

---

**Last Updated**: 2025-11-11
