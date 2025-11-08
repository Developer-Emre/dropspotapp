# DropSpot API Documentation

## 🎯 Proje Genel Bakış

DropSpot, sınırlı stoklu ürünler için bekleme listesi ve claim sistemi sunan bir platform. Kullanıcılar ürünlere katılabilir, bekleme listesinde yer alabilir ve belirli claim penceresinde ürünü satın alabilir.

## 🏗️ Sistem Mimarisi

## 📊 Database Schema

### CUID Identifiers
Tüm entity'
```

### GET /my-waitlists
Kullanıcının katıldığı tüm bekleme listelerini görüntüle (Dashboard)

**Headers:**
```
Authorization: Bearer <user_token>
```

**Query Parameters:**
- `page` - Sayfa numarası (default: 1, optional)
- `limit` - Sayfa başına öğe sayısı (default: 20, max: 50, optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "waitlists": [
      {
        "id": "clvxxxxxxxxxxxxxx",
        "joinedAt": "2025-11-06T10:30:00.000Z",
        "position": 15,
        "status": "waiting", // "waiting" | "claimable" | "ended" | "sold_out" | "inactive"
        "canClaim": false,
        "estimatedClaimTime": "2025-11-07T14:00:00.000Z",
        "drop": {
          "id": "clvxxxxxxxxxxxxxx",
          "title": "Limited Edition Sneakers",
          "description": "Exclusive drop for premium members",
          "totalStock": 100,
          "claimedStock": 45,
          "startDate": "2025-11-06T14:00:00.000Z",
          "endDate": "2025-11-08T14:00:00.000Z",
          "claimWindowStart": "2025-11-07T14:00:00.000Z",
          "claimWindowEnd": "2025-11-09T14:00:00.000Z",
          "isActive": true
        }
      },
      {
        "id": "clvyyyyyyyyyyyyyy",
        "joinedAt": "2025-11-05T08:15:00.000Z",
        "position": 3,
        "status": "claimable",
        "canClaim": true,
        "estimatedClaimTime": "2025-11-06T12:00:00.000Z",
        "drop": {
          "id": "clvyyyyyyyyyyyyyy",
          "title": "Gaming Headset Pro",
          "description": "Professional gaming headset",
          "totalStock": 50,
          "claimedStock": 25,
          "startDate": "2025-11-05T12:00:00.000Z",
          "endDate": "2025-11-07T12:00:00.000Z",
          "claimWindowStart": "2025-11-06T12:00:00.000Z",
          "claimWindowEnd": "2025-11-08T12:00:00.000Z",
          "isActive": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "summary": {
      "totalActive": 8,     // Aktif bekleyen
      "totalClaimable": 3,  // Claim edilebilir
      "totalCompleted": 1   // Tamamlanan/bitmiş
    }
  }
}
```

**Status Açıklamaları:**
- `waiting`: Drop henüz claim aşamasına geçmemiş, bekleme listesinde
- `claimable`: Claim penceresi açık, claim edilebilir
- `ended`: Drop süresi dolmuş
- `sold_out`: Drop tamamen satıldı
- `inactive`: Drop admin tarafından devre dışı bırakıldı

## 🎯 Claim System Endpoints# 🎯 Claim System Endpointsgüvenlik için CUID (Collision-resistant Unique Identifier) kullanır:
- Format: `c` + 24 karakter base32 (toplam 25 karakter)
- Örnek: `cmhmh82a10000unse5a6nqq10`
- Avantajları: URL-safe, tahmin edilemez, collision-resistant, sortable
- Örnek Drop ID: `cmhmh82a10000unse5a6nqq10`
- Örnek User ID: `clxyz12345678901234567890`

### Ana Bileşenler

1. **Authentication System**: JWT tabanlı kimlik doğrulama
2. **Drop Management**: Ürün/drop yönetimi (admin)
3. **Waitlist System**: Bekleme listesi yönetimi (kullanıcı)
4. **Claim System**: 24 saatlik expiry ile ürün rezervasyon sistemi
5. **Seed Generation**: Priority scoring için benzersiz seed üretimi

### Teknoloji Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Security**: CUID identifiers, transaction-based operations
- **Git Workflow**: Feature branch strategy

## 📊 Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  waitlistEntries WaitlistEntry[]
  claims          Claim[]
}
```

### Drop Model
```prisma
model Drop {
  id               String   @id @default(cuid())
  name             String
  description      String?
  totalStock       Int
  claimedStock     Int      @default(0)
  startDate        DateTime
  claimWindowStart DateTime
  endDate          DateTime
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  waitlistEntries WaitlistEntry[]
  claims          Claim[]
}
```

### WaitlistEntry Model
```prisma
model WaitlistEntry {
  id           String   @id @default(cuid())
  userId       String
  dropId       String
  joinedAt     DateTime @default(now())
  priorityScore Int?
  
  user User @relation(fields: [userId], references: [id])
  drop Drop @relation(fields: [dropId], references: [id])
  
  @@unique([userId, dropId])
}
```

### Claim Model
```prisma
model Claim {
  id              String      @id @default(cuid())
  userId          String
  dropId          String
  claimCode       String      @unique
  status          ClaimStatus @default(PENDING)
  claimedAt       DateTime    @default(now())
  expiresAt       DateTime    // 24-hour expiry
  
  user            User        @relation(fields: [userId], references: [id])
  drop            Drop        @relation(fields: [dropId], references: [id])
  
  @@unique([userId, dropId])  // One claim per user per drop
}

enum ClaimStatus {
  PENDING
  COMPLETED
  EXPIRED
}
```

## 🔐 Authentication Endpoints

### POST /auth/signup
Yeni kullanıcı kaydı

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "clxxxx",
      "email": "user@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/login
Kullanıcı girişi

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clxxxx",
      "email": "user@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## 🎪 Drop Management Endpoints

### GET /drops
Aktif drop'ları listele (herkese açık)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "drops": [
      {
        "id": "clxxxx",
        "name": "Limited Edition Sneakers",
        "description": "Exclusive sneaker drop",
        "totalStock": 100,
        "claimedStock": 25,
        "startDate": "2025-11-10T10:00:00.000Z",
        "claimWindowStart": "2025-11-10T14:00:00.000Z",
        "endDate": "2025-11-10T18:00:00.000Z",
        "isActive": true,
        "waitlistCount": 150,
        "availableStock": 75,
        "phase": "waitlist" // "upcoming" | "waitlist" | "claiming" | "ended"
      }
    ],
    "total": 1
  }
}
```

### POST /admin/drops (Admin Only)
Yeni drop oluştur

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "name": "Limited Edition Sneakers",
  "description": "Exclusive sneaker drop",
  "totalStock": 100,
  "startDate": "2025-11-10T10:00:00.000Z",
  "claimWindowStart": "2025-11-10T14:00:00.000Z",
  "endDate": "2025-11-10T18:00:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Drop created successfully",
  "data": {
    "drop": {
      "id": "clxxxx",
      "name": "Limited Edition Sneakers",
      "description": "Exclusive sneaker drop",
      "totalStock": 100,
      "claimedStock": 0,
      "startDate": "2025-11-10T10:00:00.000Z",
      "claimWindowStart": "2025-11-10T14:00:00.000Z",
      "endDate": "2025-11-10T18:00:00.000Z",
      "isActive": true
    }
  }
}
```

## 📝 Waitlist Management Endpoints

### POST /drops/:id/join
Bekleme listesine katıl (İdempotent)

**URL Parameters:**
- `:id` - Drop CUID identifier (örnek: `clvxxxxxxxxxxxxxx`)

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200 - Already Joined):**
```json
{
  "success": true,
  "message": "Already in waitlist",
  "data": {
    "waitlistEntry": {
      "id": "clxxxx",
      "position": 45,
      "priorityScore": 1025.5,
      "joinedAt": "2025-11-06T10:30:00.000Z"
    },
    "drop": {
      "id": "clxxxx",
      "name": "Limited Edition Sneakers",
      "phase": "waitlist"
    }
  }
}
```

**Response (201 - New Entry):**
```json
{
  "success": true,
  "message": "Successfully joined waitlist",
  "data": {
    "waitlistEntry": {
      "id": "clxxxx",
      "position": 151,
      "priorityScore": 998.2,
      "joinedAt": "2025-11-06T11:00:00.000Z"
    },
    "drop": {
      "id": "clxxxx",
      "name": "Limited Edition Sneakers",
      "phase": "waitlist"
    }
  }
}
```

### POST /drops/:id/leave
Bekleme listesinden ayrıl (İdempotent)

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully left waitlist",
  "data": {
    "dropId": "clxxxx",
    "userId": "clxxxx"
  }
}
```

### GET /drops/:id/waitlist
Bekleme listesi durumunu kontrol et

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200 - In Waitlist):**
```json
{
  "success": true,
  "data": {
    "inWaitlist": true,
    "position": 45,
    "totalWaiting": 150,
    "priorityScore": 1025.5,
    "joinedAt": "2025-11-06T10:30:00.000Z",
    "estimatedClaimChance": "high" // "high" | "medium" | "low"
  }
}
```

**Response (200 - Not In Waitlist):**
```json
{
  "success": true,
  "data": {
    "inWaitlist": false,
    "totalWaiting": 150
  }
}
```

## � Claim System Endpoints

### POST /drops/:id/claim
Ürünü claim et (satın al/rezerve et)

**URL Parameters:**
- `:id` - Drop CUID identifier (örnek: `clvxxxxxxxxxxxxxx`)

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (201 - New Claim):**
```json
{
  "success": true,
  "message": "Successfully claimed drop",
  "data": {
    "claim": {
      "id": "clvxxxxxxxxxxxxxx",
      "claimCode": "CLAIM-AB12-CD34-EF56",
      "status": "PENDING",
      "claimedAt": "2025-11-06T14:00:00.000Z",
      "expiresAt": "2025-11-07T14:00:00.000Z"
    },
    "drop": {
      "id": "clvxxxxxxxxxxxxxx",
      "title": "Limited Edition Sneakers",
      "phase": "claiming"
    }
  }
}
```

**Response (200 - Already Claimed):**
```json
{
  "success": true,
  "message": "Drop already claimed",
  "data": {
    "claim": {
      "id": "clvxxxxxxxxxxxxxx",
      "claimCode": "CLAIM-AB12-CD34-EF56",
      "status": "PENDING",
      "claimedAt": "2025-11-06T14:00:00.000Z",
      "expiresAt": "2025-11-07T14:00:00.000Z"
    },
    "drop": {
      "id": "clvxxxxxxxxxxxxxx",
      "title": "Limited Edition Sneakers",
      "phase": "claiming"
    }
  }
}
```

### GET /drops/:id/claim/status
Claim durumunu kontrol et

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200 - Has Claim):**
```json
{
  "success": true,
  "data": {
    "hasClaim": true,
    "claim": {
      "id": "clvxxxxxxxxxxxxxx",
      "claimCode": "CLAIM-AB12-CD34-EF56",
      "status": "PENDING",
      "claimedAt": "2025-11-06T14:00:00.000Z",
      "expiresAt": "2025-11-07T14:00:00.000Z",
      "isExpired": false
    },
    "drop": {
      "id": "clvxxxxxxxxxxxxxx",
      "title": "Limited Edition Sneakers",
      "claimWindowStart": "2025-11-06T14:00:00.000Z",
      "claimWindowEnd": "2025-11-06T18:00:00.000Z"
    }
  }
}
```

### PUT /drops/:id/claim/complete
Claim'i tamamla (ödeme sonrası)

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Claim completed successfully",
  "data": {
    "claim": {
      "id": "clvxxxxxxxxxxxxxx",
      "claimCode": "CLAIM-AB12-CD34-EF56",
      "status": "COMPLETED",
      "claimedAt": "2025-11-06T14:00:00.000Z",
      "expiresAt": "2025-11-07T14:00:00.000Z"
    }
  }
}
```

### GET /my-claims
Kullanıcının tüm claim'lerini listele

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "claims": [
      {
        "id": "clvxxxxxxxxxxxxxx",
        "claimCode": "CLAIM-AB12-CD34-EF56",
        "status": "COMPLETED",
        "claimedAt": "2025-11-06T14:00:00.000Z",
        "expiresAt": "2025-11-07T14:00:00.000Z",
        "isExpired": false,
        "drop": {
          "id": "clvxxxxxxxxxxxxxx",
          "title": "Limited Edition Sneakers",
          "description": "Exclusive sneaker drop",
          "imageUrl": "https://example.com/image.jpg",
          "claimWindowStart": "2025-11-06T14:00:00.000Z",
          "claimWindowEnd": "2025-11-06T18:00:00.000Z"
        }
      }
    ],
    "total": 1
  }
}
```

---

## �🎲 Priority Scoring System

### Seed Generation
Sistem başlangıcında benzersiz seed üretilir:
- Project start time
- Git remote URL
- First commit timestamp
- Kriptografik hash fonksiyonları

### Priority Score Hesaplama
```javascript
priorityScore = BASE_SCORE + 
               (signupLatencyMs % COEFF_A) + 
               (accountAgeDays % COEFF_B) - 
               (rapidActions % COEFF_C)
```

**Faktörler:**
- `signupLatencyMs`: Drop başlangıcından katılım anına kadar geçen süre
- `accountAgeDays`: Kullanıcı hesabının yaşı (gün)
- `rapidActions`: Son 1 saat içindeki hızlı işlem sayısı
- `COEFF_A`, `COEFF_B`, `COEFF_C`: Seed'den türetilen katsayılar

## 🚨 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (admin required)
- `404`: Not Found
- `409`: Conflict (business logic error)
- `500`: Internal Server Error

### Business Logic Errors
```json
{
  "success": false,
  "error": {
    "code": "DROP_NOT_ACTIVE",
    "message": "Drop is not currently active"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "WAITLIST_PHASE_ENDED",
    "message": "Waitlist phase has ended, claim window is active"
  }
}
```

## 🔄 İdempotency

### Waitlist Operations
- **JOIN**: Aynı kullanıcı aynı drop'a tekrar katılırsa mevcut entry döner
- **LEAVE**: Kullanıcı zaten listede değilse success döner
- **Database Level**: Unique constraints ile garanti

### Transaction Handling
Tüm kritik operasyonlar Prisma transaction içinde:
```typescript
await prisma.$transaction(async (tx) => {
  // Atomic operations
});
```

## 📱 Front-End Integration Tips

### Authentication State Management
```javascript
// JWT token'ı localStorage'da sakla
const token = localStorage.getItem('dropspot_token');

// Her API çağrısında header'a ekle
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Drop Phase Management
```javascript
const getDropPhase = (drop) => {
  const now = new Date();
  const start = new Date(drop.startDate);
  const claimStart = new Date(drop.claimWindowStart);
  const end = new Date(drop.endDate);
  
  if (now < start) return 'upcoming';
  if (now >= start && now < claimStart) return 'waitlist';
  if (now >= claimStart && now < end) return 'claiming';
  return 'ended';
};
```

### Real-time Updates
```javascript
// Waitlist pozisyonu için polling
const checkWaitlistStatus = async (dropId) => {
  const response = await fetch(`/drops/${dropId}/waitlist`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Her 30 saniyede bir güncelle
setInterval(() => checkWaitlistStatus(dropId), 30000);
```

### Error Handling
```javascript
const handleApiError = (error) => {
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.code === 'DROP_NOT_ACTIVE') {
    // Show user-friendly message
    showToast('Bu drop şu anda aktif değil');
  }
};
```

## 🧪 Test Scenarios

### Happy Path
1. Kullanıcı kaydı → Login → Drop listesi → Waitlist'e katılım → Pozisyon kontrolü
2. Admin login → Drop oluşturma → Drop güncelleme
3. **Claim Flow:** Waitlist'e katılım → Claim window açılması → Drop claim → Claim completion

### Edge Cases
1. Aynı drop'a tekrar katılım (idempotency)
2. Bitmemiş drop'tan ayrılma
3. Claim window'da waitlist'e katılım denemesi
4. Sold out drop'a katılım denemesi
5. **Duplicate claim attempts** (idempotency)
6. **Claim expiry testing** (24-hour window)
7. **Multiple user claim competition**

### Error Cases
1. Geçersiz token ile API çağrısı
2. Admin olmayan kullanıcının admin endpoint'ine erişimi
3. Var olmayan drop ID'si ile işlem
4. **Claim without waitlist membership**
5. **Claim outside claim window**
6. **Complete expired claim**
7. **Claim with insufficient priority**

## 🚀 Deployment Considerations

### Environment Variables
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dropspot"
JWT_SECRET="your-super-secret-jwt-key"
NODE_ENV="production"
```

### Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

### Health Check Endpoint
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

## 🎯 Claim System Implementation Details

### Claim Lifecycle

**1. Eligibility Check**
- User must be in waitlist
- Drop must be in claim window
- Stock must be available
- User position ≤ available stock

**2. Claim Creation**
- Generates unique claim code (CLAIM-XXXX-XXXX-XXXX)
- Sets 24-hour expiry from claim time
- Increments drop claimed stock
- Removes user from waitlist

**3. Claim Completion**
- User completes payment/checkout
- Status changes from PENDING to COMPLETED
- Idempotent operation

**4. Claim Expiry**
- Automatic expiry after 24 hours
- Status changes to EXPIRED
- Can be cleaned up via background job

### Business Rules

**Priority-Based Claiming**
- Only users in waitlist can claim
- Position determined by priority score
- Higher priority = earlier claim eligibility
- Claims processed in priority order

**Stock Management**
- Real-time stock tracking
- Atomic stock decrement on claim
- Prevents overselling
- Transaction-safe operations

**Time-Based Windows**
- Waitlist phase: startDate → claimWindowStart
- Claim phase: claimWindowStart → claimWindowEnd
- Drop ends: claimWindowEnd → endDate

**Idempotency Guarantees**
- Multiple claim requests return same claim
- Database constraints prevent duplicates
- Consistent responses for all operations

### Error Scenarios

**Claim Errors (403/409)**
- `NOT_IN_WAITLIST`: User must join waitlist first
- `NOT_ELIGIBLE`: Position too low for available stock
- `CLAIM_WINDOW_NOT_STARTED`: Claiming not yet open
- `CLAIM_WINDOW_ENDED`: Claiming period finished
- `DROP_SOLD_OUT`: No stock remaining

**Completion Errors**
- `CLAIM_NOT_FOUND`: Invalid claim ID
- `CLAIM_EXPIRED`: Past 24-hour window
- `CLAIM_ALREADY_COMPLETED`: Already processed

### Integration Examples

**Frontend Claim Flow**
```javascript
// 1. Check claim eligibility
const checkEligibility = async (dropId) => {
  const waitlistStatus = await fetch(`/drops/${dropId}/waitlist`);
  const data = await waitlistStatus.json();
  return data.inWaitlist && data.position <= availableStock;
};

// 2. Attempt claim
const claimDrop = async (dropId) => {
  try {
    const response = await fetch(`/drops/${dropId}/claim`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const { data } = await response.json();
      // Show claim success with expiry time
      showClaimSuccess(data.claim.claimCode, data.claim.expiresAt);
      return data.claim;
    }
  } catch (error) {
    handleClaimError(error);
  }
};

// 3. Complete claim after payment
const completeClaim = async (dropId) => {
  const response = await fetch(`/drops/${dropId}/claim/complete`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};
```

**Claim Status Polling**
```javascript
// Monitor claim expiry
const monitorClaim = (claimId, expiresAt) => {
  const checkExpiry = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    
    if (now >= expires) {
      showClaimExpired();
      clearInterval(interval);
    } else {
      const timeLeft = expires - now;
      updateCountdown(timeLeft);
    }
  };
  
  const interval = setInterval(checkExpiry, 1000);
  return interval;
};
```

---

Bu API dokümantasyonu tam implement edilmiş DropSpot sistemini detaylandırır. Claim sistemi production-ready durumda ve tüm business logic ile error handling implement edilmiştir.