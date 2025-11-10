# Laravel Setup Example

**Quick setup for Laravel projects - Copy and customize**

---

# Setup Claude Code Documentation for [Laravel Project Name]

## Project Context

**Project Type**: Laravel Application
**Tech Stack**:
- Laravel 10.x / 11.x
- PHP 8.1+
- [Database: MySQL / PostgreSQL / SQLite]
- [Frontend: Blade / Inertia.js / Livewire]
- [Queue: Redis / Database]
- [Testing: PHPUnit / Pest]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Laravel-specific content below.

## Laravel-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (Laravel MVC)

myapp/
├── app/
│   ├── Console/          # Artisan commands
│   ├── Exceptions/       # Exception handlers
│   ├── Http/
│   │   ├── Controllers/  # Controllers
│   │   ├── Middleware/   # Middleware
│   │   ├── Requests/     # Form requests (validation)
│   │   └── Resources/    # API resources
│   ├── Models/           # Eloquent models
│   ├── Providers/        # Service providers
│   └── Services/         # Business logic
├── bootstrap/            # Bootstrap files
├── config/               # Configuration
├── database/
│   ├── factories/        # Model factories
│   ├── migrations/       # Database migrations
│   └── seeders/          # Database seeders
├── public/               # Public assets
├── resources/
│   ├── views/            # Blade templates
│   ├── js/               # JavaScript
│   └── css/              # Stylesheets
├── routes/
│   ├── web.php           # Web routes
│   ├── api.php           # API routes
│   └── console.php       # Console routes
├── storage/              # Logs, cache, uploads
├── tests/
│   ├── Feature/          # Feature tests
│   └── Unit/             # Unit tests
├── vendor/               # Composer dependencies
├── .env                  # Environment variables
├── artisan               # Artisan CLI
└── composer.json         # PHP dependencies

## Key Patterns

### MVC Architecture
- Models: Eloquent ORM (database)
- Views: Blade templates
- Controllers: Request handling
- Routes: URL mapping

### Service Container
- Dependency injection
- Service providers
- Binding abstractions

### Eloquent ORM
- ActiveRecord pattern
- Relationships (hasMany, belongsTo, etc.)
- Query builder
- Eager loading to prevent N+1

### Middleware
- Authentication
- CSRF protection
- Rate limiting
- Custom middleware
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Laravel Mistakes

### 1. N+1 Query Problem

**Symptom**: Slow performance, hundreds of database queries

**Anti-pattern:**
```php
// UsersController.php
public function index()
{
    $users = User::all();  // ❌ Loads users only
    return view('users.index', compact('users'));
}

// In Blade:
@foreach($users as $user)
    {{ $user->posts->count() }} posts  <!-- N+1 queries! -->
@endforeach
```

**Correct:**
```php
public function index()
{
    $users = User::with('posts')->get();  // ✅ 2 queries total
    // Or with count:
    $users = User::withCount('posts')->get();

    return view('users.index', compact('users'));
}

// Enable query logging to debug:
\DB::enableQueryLog();
// ... your queries
dd(\DB::getQueryLog());
```

### 2. Not Using Form Requests for Validation

**Anti-pattern:**
```php
public function store(Request $request)
{
    // ❌ Validation in controller - hard to test, not reusable
    $request->validate([
        'name' => 'required|min:3',
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8',
    ]);

    $user = User::create($request->all());
    return redirect()->route('users.show', $user);
}
```

**Correct:**
```php
// app/Http/Requests/StoreUserRequest.php
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;  // Or check user permissions
    }

    public function rules(): array
    {
        return [
            'name' => 'required|min:3|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please provide your name',
            'email.unique' => 'This email is already registered',
        ];
    }
}

// Controller
public function store(StoreUserRequest $request)  // ✅ Clean!
{
    $user = User::create($request->validated());
    return redirect()->route('users.show', $user);
}
```

### 3. Mass Assignment Vulnerabilities

**Anti-pattern:**
```php
// User model with no protection
class User extends Model
{
    // ❌ No $fillable or $guarded!
}

// Controller
public function update(Request $request, User $user)
{
    $user->update($request->all());  // ❌ User can set ANY field!
    // Attacker could send: { "is_admin": true }
}
```

**Correct:**
```php
// User.php
class User extends Model
{
    protected $fillable = [  // ✅ Whitelist allowed fields
        'name',
        'email',
        'password',
    ];

    // Or use $guarded:
    protected $guarded = [  // Blacklist protected fields
        'id',
        'is_admin',
        'created_at',
        'updated_at',
    ];
}

// Even better - use only validated data:
public function update(UpdateUserRequest $request, User $user)
{
    $user->update($request->validated());  // ✅ Only validated fields
    return redirect()->route('users.show', $user);
}
```

### 4. Not Using Transactions for Multiple DB Operations

**Anti-pattern:**
```php
public function createOrder(Request $request)
{
    // ❌ No transaction - if any step fails, data is inconsistent!
    $order = Order::create([
        'user_id' => auth()->id(),
        'total' => $request->total,
    ]);

    foreach ($request->items as $item) {
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $item['product_id'],
            'quantity' => $item['quantity'],
        ]);
    }

    $user = auth()->user();
    $user->balance -= $request->total;
    $user->save();

    // What if this fails? Order is created but balance not deducted!
}
```

**Correct:**
```php
use Illuminate\Support\Facades\DB;

public function createOrder(Request $request)
{
    DB::transaction(function () use ($request) {  // ✅ All or nothing!
        $order = Order::create([
            'user_id' => auth()->id(),
            'total' => $request->total,
        ]);

        foreach ($request->items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
            ]);
        }

        $user = auth()->user();
        $user->balance -= $request->total;
        $user->save();

        return $order;
    });
    // If any step fails, everything rolls back
}
```

### 5. Exposing Sensitive Data in API Responses

**Anti-pattern:**
```php
public function show(User $user)
{
    return response()->json($user);  // ❌ Returns ALL fields including password!
}
```

**Correct:**
```php
// User.php
class User extends Model
{
    protected $hidden = [  // ✅ Never include in JSON
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
}

// Or use API Resources (better):
// app/Http/Resources/UserResource.php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at->toDateTimeString(),
            // Only include what you want!
        ];
    }
}

// Controller
public function show(User $user)
{
    return new UserResource($user);  // ✅ Clean, controlled response
}
```
```

### docs/learnings/

Create these Laravel-specific files:

**eloquent-orm.md:**
```markdown
# Laravel Eloquent ORM

## Model Definition

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'user_id',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_featured' => 'boolean',
    ];

    protected $hidden = [
        'user_id',
    ];

    protected $appends = [
        'excerpt',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }

    // Accessors
    public function getExcerptAttribute()
    {
        return substr($this->content, 0, 100) . '...';
    }

    // Mutators
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = \Str::slug($value);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
```

## Query Optimization

```php
// Basic queries
Post::all();
Post::find(1);
Post::where('user_id', $userId)->get();
Post::firstOrFail();

// Eager loading (prevent N+1)
Post::with('user', 'comments')->get();
Post::with(['comments' => function ($query) {
    $query->where('approved', true);
}])->get();

// Lazy eager loading
$posts = Post::all();
$posts->load('user');

// Count relationships without loading
Post::withCount('comments')->get();

// Pagination
Post::paginate(15);
Post::simplePaginate(15);

// Chunk large datasets
Post::chunk(100, function ($posts) {
    foreach ($posts as $post) {
        // Process post
    }
});

// Query builder
Post::where('views', '>', 1000)
    ->where('published_at', '<', now())
    ->orderBy('created_at', 'desc')
    ->take(10)
    ->get();

// Raw queries
Post::whereRaw('views > ?', [1000])->get();

// Aggregate functions
Post::count();
Post::max('views');
Post::avg('views');
Post::sum('views');
```

## Relationships

```php
// One to Many
class User extends Model
{
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}

class Post extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

// Many to Many
class Post extends Model
{
    public function tags()
    {
        return $this->belongsToMany(Tag::class)
            ->withPivot('order')  // Additional pivot columns
            ->withTimestamps();   // created_at, updated_at on pivot
    }
}

// Polymorphic
class Comment extends Model
{
    public function commentable()
    {
        return $this->morphTo();
    }
}

class Post extends Model
{
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

// Has Many Through
class Country extends Model
{
    public function posts()
    {
        return $this->hasManyThrough(Post::class, User::class);
    }
}
```
```

**controllers-and-routes.md:**
```markdown
# Laravel Controllers and Routes

## Resource Controller

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;

class PostController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth')->except(['index', 'show']);
    }

    public function index()
    {
        $posts = Post::with('user')
            ->published()
            ->latest()
            ->paginate(15);

        return view('posts.index', compact('posts'));
    }

    public function show(Post $post)  // Route model binding
    {
        return view('posts.show', compact('post'));
    }

    public function create()
    {
        return view('posts.create');
    }

    public function store(StorePostRequest $request)
    {
        $post = auth()->user()->posts()->create($request->validated());

        return redirect()
            ->route('posts.show', $post)
            ->with('success', 'Post created successfully!');
    }

    public function edit(Post $post)
    {
        $this->authorize('update', $post);

        return view('posts.edit', compact('post'));
    }

    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->authorize('update', $post);

        $post->update($request->validated());

        return redirect()
            ->route('posts.show', $post)
            ->with('success', 'Post updated successfully!');
    }

    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);

        $post->delete();

        return redirect()
            ->route('posts.index')
            ->with('success', 'Post deleted successfully!');
    }
}
```

## Routes

```php
// routes/web.php
use App\Http\Controllers\PostController;

// Resource routes (generates 7 routes)
Route::resource('posts', PostController::class);

// Generated routes:
// GET       /posts              posts.index
// GET       /posts/create       posts.create
// POST      /posts              posts.store
// GET       /posts/{post}       posts.show
// GET       /posts/{post}/edit  posts.edit
// PUT/PATCH /posts/{post}       posts.update
// DELETE    /posts/{post}       posts.destroy

// API resource (no create/edit)
Route::apiResource('posts', PostController::class);

// Nested resources
Route::resource('posts.comments', CommentController::class);
// Generated: /posts/{post}/comments

// Shallow nested resources
Route::resource('posts.comments', CommentController::class)->shallow();
// Generated: /posts/{post}/comments but /comments/{comment}

// Middleware
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('posts', PostController::class)->except(['index', 'show']);
});

// Route groups
Route::prefix('admin')->middleware('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::resource('users', AdminUserController::class);
});

// Named routes
Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');

// Route parameters
Route::get('/users/{user}', [UserController::class, 'show']);
Route::get('/posts/{post:slug}', [PostController::class, 'show']);  // Bind by slug

// Redirect routes
Route::redirect('/here', '/there');
Route::permanentRedirect('/here', '/there');

// View routes (no controller)
Route::view('/welcome', 'welcome', ['name' => 'Laravel']);
```

## API Controller

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\PostCollection;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with('user')->paginate(15);

        return new PostCollection($posts);
    }

    public function show(Post $post)
    {
        return new PostResource($post->load('user', 'comments'));
    }

    public function store(StorePostRequest $request)
    {
        $post = auth()->user()->posts()->create($request->validated());

        return new PostResource($post);
    }

    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->authorize('update', $post);

        $post->update($request->validated());

        return new PostResource($post);
    }

    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json(null, 204);
    }
}
```

## Middleware

```php
// app/Http/Middleware/CheckAge.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAge
{
    public function handle(Request $request, Closure $next, int $minAge = 18)
    {
        if ($request->age < $minAge) {
            return redirect('home');
        }

        return $next($request);
    }
}

// Register in app/Http/Kernel.php
protected $middlewareAliases = [
    'check.age' => \App\Http\Middleware\CheckAge::class,
];

// Use in routes
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware('check.age:21');
```
```

**api-resources.md:**
```markdown
# Laravel API Resources

## Resource Definition

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at->toDateTimeString(),

            // Conditional attributes
            'email_verified_at' => $this->when(
                $this->email_verified_at,
                $this->email_verified_at?->toDateTimeString()
            ),

            // Only for authenticated user
            'is_admin' => $this->when(
                $request->user()?->is_admin,
                $this->is_admin
            ),

            // Relationships
            'posts' => PostResource::collection($this->whenLoaded('posts')),

            // Pivot data
            'subscription' => $this->whenPivotLoaded('user_subscription', function () {
                return [
                    'expires_at' => $this->pivot->expires_at,
                ];
            }),
        ];
    }

    public function with(Request $request): array
    {
        return [
            'meta' => [
                'version' => '1.0.0',
            ],
        ];
    }
}
```

## Resource Collection

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PostCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => route('posts.index'),
            ],
        ];
    }

    public function with(Request $request): array
    {
        return [
            'meta' => [
                'total_posts' => $this->collection->count(),
            ],
        ];
    }
}
```

## Usage

```php
// Single resource
use App\Http\Resources\UserResource;

Route::get('/user/{user}', function (User $user) {
    return new UserResource($user);
});

// Collection
use App\Http\Resources\UserResource;

Route::get('/users', function () {
    return UserResource::collection(User::all());
});

// With pagination
Route::get('/users', function () {
    return UserResource::collection(User::paginate(15));
});

// Custom collection
use App\Http\Resources\PostCollection;

Route::get('/posts', function () {
    return new PostCollection(Post::all());
});
```
```

**testing-patterns.md:**
```markdown
# Laravel Testing Patterns

## Feature Tests

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_posts()
    {
        $posts = Post::factory()->count(3)->create();

        $response = $this->get('/posts');

        $response->assertStatus(200);
        $response->assertViewIs('posts.index');
        $response->assertViewHas('posts');
    }

    public function test_user_can_create_post()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/posts', [
            'title' => 'Test Post',
            'content' => 'This is test content.',
        ]);

        $response->assertRedirect('/posts');
        $this->assertDatabaseHas('posts', [
            'title' => 'Test Post',
            'user_id' => $user->id,
        ]);
    }

    public function test_guest_cannot_create_post()
    {
        $response = $this->post('/posts', [
            'title' => 'Test Post',
            'content' => 'This is test content.',
        ]);

        $response->assertRedirect('/login');
    }

    public function test_validation_errors_are_returned()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/posts', [
            'title' => '',  // Invalid
        ]);

        $response->assertSessionHasErrors(['title']);
    }

    public function test_user_can_only_delete_own_post()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->delete("/posts/{$post->id}");

        $response->assertForbidden();
    }
}
```

## Unit Tests

```php
<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_belongs_to_user()
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create();

        $this->assertInstanceOf(User::class, $post->user);
        $this->assertEquals($user->id, $post->user->id);
    }

    public function test_post_has_many_comments()
    {
        $post = Post::factory()->hasComments(3)->create();

        $this->assertCount(3, $post->comments);
    }

    public function test_post_generates_excerpt()
    {
        $post = Post::factory()->create([
            'content' => str_repeat('a', 200),
        ]);

        $this->assertEquals(100, strlen($post->excerpt) - 3);  // -3 for ...
    }
}
```

## API Tests

```php
public function test_api_returns_posts_collection()
{
    $posts = Post::factory()->count(3)->create();

    $response = $this->getJson('/api/posts');

    $response->assertStatus(200);
    $response->assertJsonCount(3, 'data');
    $response->assertJsonStructure([
        'data' => [
            '*' => ['id', 'title', 'content', 'created_at'],
        ],
    ]);
}

public function test_api_requires_authentication()
{
    $response = $this->postJson('/api/posts', [
        'title' => 'Test',
        'content' => 'Content',
    ]);

    $response->assertUnauthorized();
}

public function test_authenticated_user_can_create_post()
{
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/posts', [
            'title' => 'Test Post',
            'content' => 'Test content',
        ]);

    $response->assertCreated();
    $response->assertJson([
        'data' => [
            'title' => 'Test Post',
        ],
    ]);
}
```

## Factories

```php
<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'slug' => fake()->slug(),
            'content' => fake()->paragraphs(3, true),
            'user_id' => User::factory(),
            'published_at' => fake()->dateTimeBetween('-1 month', 'now'),
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => null,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}

// Usage:
Post::factory()->count(5)->create();
Post::factory()->unpublished()->create();
Post::factory()->for($user)->create();
Post::factory()->hasComments(3)->create();
```
```

### QUICK_REFERENCE.md

```markdown
## Laravel Quick Commands

# Artisan CLI
php artisan serve              # Start dev server
php artisan make:controller PostController --resource
php artisan make:model Post -mfc  # Model + migration + factory + controller
php artisan make:request StorePostRequest
php artisan make:resource PostResource
php artisan make:middleware CheckAge
php artisan make:policy PostPolicy --model=Post
php artisan make:seeder UserSeeder
php artisan make:factory PostFactory

# Database
php artisan migrate            # Run migrations
php artisan migrate:rollback   # Rollback last batch
php artisan migrate:fresh      # Drop all tables and re-run
php artisan migrate:fresh --seed  # + run seeders
php artisan db:seed            # Run seeders

# Tinker (REPL)
php artisan tinker

# Cache
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:clear

# Queue
php artisan queue:work         # Process queue jobs
php artisan queue:listen       # Listen for jobs

# Testing
php artisan test               # Run PHPUnit tests
php artisan test --filter=PostTest

## Common Patterns

### Route Model Binding
```php
Route::get('/posts/{post}', [PostController::class, 'show']);

public function show(Post $post) {
    // $post is automatically fetched
}
```

### Eloquent Query
```php
Post::with('user')->where('published', true)->latest()->get();
```

### Form Request
```php
php artisan make:request StorePostRequest

public function store(StorePostRequest $request) {
    Post::create($request->validated());
}
```

### API Resource
```php
return new PostResource($post);
return PostResource::collection($posts);
```

### Environment Variables
```env
# .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=laravel
APP_KEY=base64:...

# Access:
config('database.default')
env('APP_KEY')
```
```

## Expected Structure After Setup

```
my-laravel-app/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Laravel-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (Laravel structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Laravel commands)
│   ├── learnings/
│   │   ├── eloquent-orm.md
│   │   ├── controllers-and-routes.md
│   │   ├── api-resources.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   └── Models/
├── routes/
│   ├── web.php
│   └── api.php
├── database/
│   └── migrations/
├── tests/
└── composer.json
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For Eloquent/models, load:
docs/learnings/eloquent-orm.md (~700 tokens)

# 3. For controllers/routes, load:
docs/learnings/controllers-and-routes.md (~600 tokens)

# 4. For API work, load:
docs/learnings/api-resources.md (~500 tokens)

Total: ~1,300-1,800 tokens (vs 10,000+ before)
```

---

**Last Updated**: 2025-11-11
