# NestJS Setup Example

**Quick setup for NestJS projects - Copy and customize**

---

# Setup Claude Code Documentation for [NestJS Project Name]

## Project Context

**Project Type**: NestJS Application
**Tech Stack**:
- NestJS 10.x
- TypeScript
- [Database: PostgreSQL / MongoDB / MySQL]
- [ORM: TypeORM / Prisma / Mongoose]
- [API: REST / GraphQL]
- [Testing: Jest]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with NestJS-specific content below.

## NestJS-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (NestJS)

src/
├── main.ts               # Application entry point
├── app.module.ts         # Root module
├── modules/              # Feature modules
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── users.controller.spec.ts
│   └── posts/
├── common/               # Shared code
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── filters/
│   └── interfaces/
├── config/               # Configuration
│   └── configuration.ts
└── database/
    └── migrations/

## Key Patterns

### Module Organization
- Feature modules (users, posts, auth)
- Shared modules (database, config)
- Core modules (common utilities)
- Each module is self-contained

### Dependency Injection
- Providers (services, repositories)
- Controllers consume providers
- Module imports/exports
- Singleton by default (can be scoped)

### Request Lifecycle
1. Middleware
2. Guards (auth, roles)
3. Interceptors (before)
4. Pipes (validation, transformation)
5. Controller handler
6. Interceptors (after)
7. Exception filters

### Decorators
- @Module, @Controller, @Injectable
- @Get, @Post, @Put, @Delete
- @Body, @Param, @Query
- @UseGuards, @UseInterceptors, @UsePipes
```

### COMMON_MISTAKES.md

```markdown
## Top 5 NestJS Mistakes

### 1. Not Providing Dependencies in Module

**Symptom**: "Nest can't resolve dependencies" error

**Anti-pattern:**
```typescript
// users.module.ts
@Module({
  controllers: [UsersController],
  // ❌ UsersService not provided!
})
export class UsersModule {}

// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}  // Error!
}
```

**Correct:**
```typescript
// users.module.ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],  // ✅ Provide the service
  exports: [UsersService],    // Export if other modules need it
})
export class UsersModule {}
```

### 2. Not Using DTOs with Validation

**Symptom**: Invalid data reaches your handlers, runtime errors

**Anti-pattern:**
```typescript
@Post()
create(@Body() body: any) {  // ❌ No validation!
  return this.usersService.create(body);
}
```

**Correct:**
```typescript
// create-user.dto.ts
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// users.controller.ts
@Post()
create(@Body() createUserDto: CreateUserDto) {  // ✅ Validated!
  return this.usersService.create(createUserDto);
}

// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,  // Strip unknown properties
  forbidNonWhitelisted: true,  // Throw error for unknown properties
  transform: true,  // Transform to DTO instance
}));
```

### 3. Business Logic in Controllers

**Symptom**: Fat controllers, hard to test, code duplication

**Anti-pattern:**
```typescript
@Controller('users')
export class UsersController {
  constructor(
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    // ❌ Business logic in controller!
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(user.email);

    return user;
  }
}
```

**Correct:**
```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // ✅ Business logic in service
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(user.email);

    return user;
  }
}

// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);  // ✅ Thin controller
  }
}
```

### 4. Not Handling Exceptions Properly

**Anti-pattern:**
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.usersService.findOne(id);
  if (!user) {
    return { error: 'User not found' };  // ❌ Returns 200 with error!
  }
  return user;
}
```

**Correct:**
```typescript
// users.service.ts
async findOne(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);  // ✅
  }

  return user;
}

// Or create custom exception filter:
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: exception.message,
    });
  }
}

// main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

### 5. Not Using ConfigModule for Environment Variables

**Anti-pattern:**
```typescript
// Accessing process.env directly everywhere
const dbHost = process.env.DB_HOST;  // ❌ Not type-safe!
const apiKey = process.env.API_KEY;  // ❌ No validation!
```

**Correct:**
```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});

// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // ✅ Available everywhere
      load: [configuration],
      validationSchema: Joi.object({  // ✅ Validate env vars
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}

// Using config in service:
@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  getJwtSecret(): string {
    return this.configService.get<string>('jwt.secret');  // ✅ Type-safe!
  }
}
```
```

### docs/learnings/

Create these NestJS-specific files:

**modules-and-di.md:**
```markdown
# NestJS Modules and Dependency Injection

## Module Structure

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // Import repositories
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // Export for other modules
})
export class UsersModule {}
```

## Dependency Injection

```typescript
// Constructor injection (recommended)
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
```

## Provider Scopes

```typescript
// Singleton (default) - one instance for entire app
@Injectable()
export class UsersService {}

// Request-scoped - new instance per request
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject(REQUEST) private request: Request) {}
}

// Transient - new instance each time it's injected
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}
```

## Custom Providers

```typescript
// Value provider
const mockUserService = {
  findAll: () => [/* mock data */],
};

@Module({
  providers: [
    {
      provide: UsersService,
      useValue: mockUserService,
    },
  ],
})

// Factory provider
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const config = configService.get('database');
        return createConnection(config);
      },
      inject: [ConfigService],
    },
  ],
})

// Class provider
@Module({
  providers: [
    {
      provide: 'IUsersService',
      useClass: UsersService,
    },
  ],
})
```

## Dynamic Modules

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_OPTIONS',
          useValue: options,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}

// Usage:
@Module({
  imports: [
    DatabaseModule.forRoot({
      host: 'localhost',
      port: 5432,
    }),
  ],
})
export class AppModule {}
```
```

**controllers-and-routes.md:**
```markdown
# NestJS Controllers and Routes

## Basic Controller

```typescript
import { Controller, Get, Post, Body, Param, Query, Delete, Put, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('users')  // Route prefix
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('limit') limit?: number) {
    return this.usersService.findAll(limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

## Request Decorators

```typescript
@Controller('posts')
export class PostsController {
  // Get request object
  @Get()
  findAll(@Req() request: Request) {}

  // Get response object
  @Get()
  findAll(@Res() response: Response) {}

  // Get headers
  @Get()
  findAll(@Headers() headers: Record<string, string>) {}

  // Get specific header
  @Get()
  findAll(@Headers('authorization') auth: string) {}

  // Get IP address
  @Get()
  findAll(@Ip() ip: string) {}

  // Get session
  @Get()
  findAll(@Session() session: Record<string, any>) {}
}
```

## Guards (Authentication/Authorization)

```typescript
// auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// Usage:
@Controller('posts')
@UseGuards(AuthGuard)  // Apply to all routes
export class PostsController {
  @Get()
  findAll(@CurrentUser() user: User) {  // Custom decorator
    return this.postsService.findAllForUser(user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')  // Only admins can create
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }
}
```

## Interceptors

```typescript
// logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();

    console.log(`Before... ${request.method} ${request.url}`);

    return next.handle().pipe(
      tap(() => console.log(`After... ${Date.now() - now}ms`)),
    );
  }
}

// Transform response
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// Usage:
@Controller('users')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class UsersController {}
```

## Pipes (Validation/Transformation)

```typescript
// Built-in pipes
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.findOne(id);
}

// Custom pipe
@Injectable()
export class ParseIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const id = parseInt(value, 10);
    if (isNaN(id)) {
      throw new BadRequestException('Invalid ID');
    }
    return id;
  }
}
```
```

**database-patterns.md:**
```markdown
# NestJS Database Patterns

## TypeORM Setup

```typescript
// app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,  // Use migrations in production!
        logging: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Entity Definition

```typescript
// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })  // Don't include in queries by default
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];
}
```

## Repository Patterns

```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Basic queries
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  // With relations
  async findWithPosts(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['posts', 'roles'],
    });
  }

  // Query builder
  async searchUsers(searchTerm: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :search', { search: `%${searchTerm}%` })
      .orWhere('user.email ILIKE :search', { search: `%${searchTerm}%` })
      .leftJoinAndSelect('user.posts', 'posts')
      .getMany();
  }

  // Transaction
  async createUserWithPosts(userData: CreateUserDto): Promise<User> {
    return this.userRepository.manager.transaction(async (manager) => {
      const user = manager.create(User, userData);
      await manager.save(user);

      const posts = userData.posts.map(postData =>
        manager.create(Post, { ...postData, author: user })
      );
      await manager.save(posts);

      return user;
    });
  }
}
```

## Custom Repository

```typescript
// users.repository.ts
@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.find({ where: { isActive: true } });
  }
}

// Register in module:
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
```

## Prisma Setup

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: { posts: true },
    });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }
}
```
```

**testing-patterns.md:**
```markdown
# NestJS Testing Patterns

## Unit Tests (Services)

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: '1', name: 'John', email: 'john@example.com' }];
      jest.spyOn(repository, 'find').mockResolvedValue(users as User[]);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = { name: 'John', email: 'john@example.com', password: 'pass123' };
      const user = { id: '1', ...dto };

      jest.spyOn(repository, 'create').mockReturnValue(user as User);
      jest.spyOn(repository, 'save').mockResolvedValue(user as User);

      const result = await service.create(dto);
      expect(result).toEqual(user);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(user);
    });
  });
});
```

## Controller Tests

```typescript
// users.controller.spec.ts
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: '1', name: 'John' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(users as User[]);

      expect(await controller.findAll()).toBe(users);
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = { name: 'John', email: 'john@example.com', password: 'pass' };
      const user = { id: '1', ...dto };

      jest.spyOn(service, 'create').mockResolvedValue(user as User);

      expect(await controller.create(dto)).toBe(user);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});
```

## E2E Tests

```typescript
// users.e2e-spec.ts
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users (POST)', () => {
    it('should create a user', () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(dto.name);
          expect(res.body.email).toBe(dto.email);
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ name: 'J' })  // Missing email, password too short
        .expect(400);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user', async () => {
      // Create user first
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Jane', email: 'jane@example.com', password: 'pass123' });

      const userId = createRes.body.id;

      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.name).toBe('Jane');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/non-existent-id')
        .expect(404);
    });
  });
});
```

## Testing Guards

```typescript
// auth.guard.spec.ts
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test' });
    guard = new AuthGuard(jwtService);
  });

  it('should allow request with valid token', async () => {
    const token = jwtService.sign({ userId: '1' });
    const context = createMockExecutionContext({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException without token', async () => {
    const context = createMockExecutionContext({
      headers: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
```
```

### QUICK_REFERENCE.md

```markdown
## NestJS Quick Commands

# CLI
nest new project-name         # Create new project
nest generate module users    # Generate module
nest generate controller users
nest generate service users
nest generate resource users  # Generate CRUD resource

# Development
npm run start                 # Start app
npm run start:dev             # Watch mode
npm run start:debug           # Debug mode

# Testing
npm run test                  # Unit tests
npm run test:watch            # Watch mode
npm run test:cov              # Coverage
npm run test:e2e              # E2E tests

# Build
npm run build                 # Build for production
npm run start:prod            # Run production build

## Common Patterns

### Controller
```typescript
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
```

### Service
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findAll() {
    return this.userRepository.find();
  }
}
```

### DTO with Validation
```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}
```

### Environment Variables
```typescript
// .env
DATABASE_URL=postgresql://localhost:5432/mydb
JWT_SECRET=your-secret-key

// Usage:
this.configService.get<string>('DATABASE_URL');
```
```

## Expected Structure After Setup

```
my-nestjs-app/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (NestJS-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (NestJS structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (NestJS commands)
│   ├── learnings/
│   │   ├── modules-and-di.md
│   │   ├── controllers-and-routes.md
│   │   ├── database-patterns.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── modules/
├── test/
└── package.json
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For modules/DI, load:
docs/learnings/modules-and-di.md (~600 tokens)

# 3. For controllers/routes, load:
docs/learnings/controllers-and-routes.md (~700 tokens)

# 4. For database, load:
docs/learnings/database-patterns.md (~600 tokens)

Total: ~1,300-1,900 tokens (vs 10,000+ before)
```

---

**Last Updated**: 2025-11-11
