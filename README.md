# gRPC REST API Clone

See projekt on gRPC implementatsioon olemasolevast REST API-st, mis pakub täpselt sama funktsionaalsust kasutades gRPC protokolli.

## Projekt ülevaade

Antud gRPC server reprodutseerib järgmist REST API funktsionaalsust:
- **Autentimine**: Sisselogimine ja väljalogimine JWT tokenitega
- **Kasutajate haldus**: CRUD operatsioonid kasutajatega
- **Toodete haldus**: CRUD operatsioonid toodetega
- **Tellimuste haldus**: CRUD operatsioonid tellimustega

## Tehnilised detailid

- **Programmeerimiskeel**: Node.js
- **gRPC raamistik**: @grpc/grpc-js
- **Andmebaas**: SQLite + Sequelize ORM
- **Autentimine**: JWT tokenid + bcrypt paroolide hashimiseks
- **Protokoll**: Protocol Buffers (protobuf)

## Kataloogistruktuur

```
/
├── proto/              # Protocol Buffer definitsioonid
│   ├── auth.proto      # Autentimise teenused
│   ├── users.proto     # Kasutajate teenused
│   ├── products.proto  # Toodete teenused
│   ├── orders.proto    # Tellimuste teenused
│   └── common.proto    # Üldised sõnumid
├── src/                # Lähtekood
│   ├── server.js       # Peamine gRPC server
│   ├── models.js       # Andmebaasi mudelid
│   ├── authService.js  # Autentimise teenuse implementatsioon
│   ├── userService.js  # Kasutajate teenuse implementatsioon
│   ├── productService.js # Toodete teenuse implementatsioon
│   └── orderService.js # Tellimuste teenuse implementatsioon
├── client/             # Kliendi näited
│   └── example.js      # Demo klient
├── tests/              # Automaattestid
│   ├── test.sh         # Linux/Mac testide skript
│   └── test.bat        # Windows testide skript
├── scripts/            # Käivitusskriptid
│   ├── run.sh          # Linux/Mac käivitusskript
│   └── run.bat         # Windows käivitusskript
├── docker-compose.yml  # Docker Compose konfiguratsioon
├── Dockerfile          # Docker konteiner
├── package.json        # Node.js projekti konfiguratsioon
└── README.md          # See fail
```

## Eeltingimused

Järgmised tööriistad peavad olema paigaldatud:

1. **Node.js** (versioon 16 või uuem)
   - Allalaadimine: https://nodejs.org/
   - Kontroll: `node --version`

2. **npm** (tuleb Node.js-iga kaasa)
   - Kontroll: `npm --version`

3. **Git** (projektiga töötamiseks)
   - Allalaadimine: https://git-scm.com/
   - Kontroll: `git --version`

4. **Protocol Buffers Compiler (protoc)** (valikuline, valideerimiseks)
   - Allalaadimine: https://protobuf.dev/downloads/
   - Kontroll: `protoc --version`

## Kiire start

### 1. Projekti allalaadimine

```bash
git clone https://github.com/yourusername/cumraod-grpc-clone.git
cd cumraod-grpc-clone
```

### 2. Käivitamine

#### Linux/Mac:
```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

#### Windows:
```cmd
scripts\\run.bat
```

#### Docker abil:
```bash
docker-compose up --build
```

Server käivitub ja kuulab pordil 50051.

## Kasutamine

### Serveri käivitamine

1. **Otsene käivitamine:**
   ```bash
   npm install
   npm start
   ```

2. **Arendusrežiimis (automaatne taaskäivitamine):**
   ```bash
   npm run dev
   ```

3. **Docker abil:**
   ```bash
   docker-compose up
   ```

### Kliendi näite käivitamine

```bash
npm run client
```

või

```bash
node client/example.js
```

### Testide käivitamine

#### Linux/Mac:
```bash
chmod +x tests/test.sh
./tests/test.sh
```

#### Windows:
```cmd
tests\\test.bat
```

## gRPC teenused

### 1. AuthService (auth.proto)

**Endpoint-id:**
- `Login(LoginRequest) → LoginResponse`
- `Logout(LogoutRequest) → LogoutResponse`

**Näide kasutamisest:**
```javascript
const response = await authClient.Login({
  email: 'user@example.com',
  password: 'password123'
});
```

### 2. UserService (users.proto)

**Endpoint-id:**
- `GetUsers(GetUsersRequest) → GetUsersResponse`
- `CreateUser(CreateUserRequest) → CreateUserResponse`
- `GetUser(GetUserRequest) → GetUserResponse`
- `UpdateUser(UpdateUserRequest) → UpdateUserResponse`
- `DeleteUser(DeleteUserRequest) → DeleteUserResponse`

### 3. ProductService (products.proto)

**Endpoint-id:**
- `GetProducts(GetProductsRequest) → GetProductsResponse`
- `CreateProduct(CreateProductRequest) → CreateProductResponse`
- `GetProduct(GetProductRequest) → GetProductResponse`
- `UpdateProduct(UpdateProductRequest) → UpdateProductResponse`
- `DeleteProduct(DeleteProductRequest) → DeleteProductResponse`

### 4. OrderService (orders.proto)

**Endpoint-id:**
- `GetOrders(GetOrdersRequest) → GetOrdersResponse`
- `CreateOrder(CreateOrderRequest) → CreateOrderResponse`
- `GetOrder(GetOrderRequest) → GetOrderResponse`
- `UpdateOrder(UpdateOrderRequest) → UpdateOrderResponse`
- `DeleteOrder(DeleteOrderRequest) → DeleteOrderResponse`

## Konfiguratsioon

### Keskkonnamuutujad (.env fail)

```env
# gRPC serveri konfiguratsioon
GRPC_HOST=0.0.0.0
GRPC_PORT=50051

# JWT konfiguratsioon
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Andmebaasi konfiguratsioon
NODE_ENV=development
```

## Veahaldus

gRPC server kasutab standardseid gRPC status koode:

- `OK (0)` - Edukas vastus
- `INVALID_ARGUMENT (3)` - Vigased sisendparameetrid
- `NOT_FOUND (5)` - Resurssi ei leitud
- `ALREADY_EXISTS (6)` - Ressurss on juba olemas
- `UNAUTHENTICATED (16)` - Autentimine ebaõnnestus
- `INTERNAL (13)` - Serveri sisemine viga

## Testimine

### Automaattestid

Testid kontrollivad:
1. Proto failide kompileerimist
2. Serveri ühenduvust
3. Autentimise teenuse funktsionaalsust
4. Kliendi integratsiooniteste

### Manuaalne testimine

1. Käivita server:
   ```bash
   npm start
   ```

2. Teises terminalis käivita klient:
   ```bash
   npm run client
   ```

3. Kontrolli väljundit - kõik RPC kutsed peaksid õnnestuma.

## REST vs gRPC vastavus

| REST Endpoint | HTTP Meetod | gRPC RPC | Proto fail |
|---------------|-------------|----------|-----------|
| `/sessions` | POST | AuthService.Login | auth.proto |
| `/sessions` | DELETE | AuthService.Logout | auth.proto |
| `/users` | GET | UserService.GetUsers | users.proto |
| `/users` | POST | UserService.CreateUser | users.proto |
| `/users/:id` | GET | UserService.GetUser | users.proto |
| `/users/:id` | PATCH | UserService.UpdateUser | users.proto |
| `/users/:id` | DELETE | UserService.DeleteUser | users.proto |
| `/products` | GET | ProductService.GetProducts | products.proto |
| `/products` | POST | ProductService.CreateProduct | products.proto |
| `/products/:id` | GET | ProductService.GetProduct | products.proto |
| `/products/:id` | PATCH | ProductService.UpdateProduct | products.proto |
| `/products/:id` | DELETE | ProductService.DeleteProduct | products.proto |
| `/orders` | GET | OrderService.GetOrders | orders.proto |
| `/orders` | POST | OrderService.CreateOrder | orders.proto |
| `/orders/:id` | GET | OrderService.GetOrder | orders.proto |
| `/orders/:id` | PATCH | OrderService.UpdateOrder | orders.proto |
| `/orders/:id` | DELETE | OrderService.DeleteOrder | orders.proto |

## Troubleshooting

### Levinud probleemid

1. **Port 50051 on juba kasutusel:**
   ```bash
   # Kontrolli, mis protsess kasutab porti
   netstat -tulpn | grep 50051
   # Või muuda pordi .env failis
   echo "GRPC_PORT=50052" >> .env
   ```

2. **Proto failide kompileerimine ebaõnnestub:**
   ```bash
   # Paigalda protoc
   # Ubuntu/Debian:
   sudo apt-get install protobuf-compiler
   # macOS:
   brew install protobuf
   # Windows: allalaadimine protobuf.dev lehelt
   ```

3. **Andmebaasi vead:**
   ```bash
   # Kustuta andmebaas ja käivita uuesti
   rm database.sqlite
   npm start
   ```

4. **Node.js versioon liiga vana:**
   ```bash
   # Värskenda Node.js versioon 16 või uuemaks
   node --version
   # Paigalda nvm ja kasuta uuemat versiooni
   ```

## Arendamine

### Uue teenuse lisamine

1. Loo uus `.proto` fail `proto/` kaustas
2. Defineeri teenus ja sõnumid
3. Loo teenuse implementatsioon `src/` kaustas
4. Lisa teenus `src/server.js` faili
5. Uuenda kliendi näidet
6. Lisa testid

### Koodi stiil

- Kasuta ESLint konfiguratsiooni
- Järgi Protocol Buffers nimetamiskonventsioone
- Kommenteeri keerulised äriloogika osad
- Kasuta async/await Promise-de asemel

## Autorid

**TAK24 Grupp**

## Litsents

MIT

## Lisainfo

Rohkem teavet gRPC kohta: https://grpc.io/
Protocol Buffers dokumentatsioon: https://protobuf.dev/
