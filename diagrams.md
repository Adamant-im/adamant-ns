## Send a token flow

```mermaid
sequenceDiagram
    participant PushService as PushService FCM/APNs
    participant UserDevice as User's Device
    participant Node as ADAMANT Node
    participant ANS as ADAMANT Notification Service (ANS)

    UserDevice->>PushService: Request token fron Push Service
    PushService-->>UserDevice: Return token
    UserDevice->>Node: Send encrypted token

    loop Continuously
        ANS->>Node: Poll for Token Transactions
        Node-->>ANS: Return Token Transactions
    end

    ANS-->>ANS: Save token to DB
```

## New message flow

```mermaid
sequenceDiagram
    participant Node as ADAMANT Node
    participant ANS as ADAMANT Notification Service (ANS)
    participant PushService as PushService FCM/APNs
    participant UserDevice as User's Device


    loop Continuously
        ANS->>Node: Poll for Message Transactions
        Node-->>ANS: Return Message Transactions
    end

    ANS->>PushService: Ask to deliver a message
    PushService->>UserDevice: Notify user's device
```

## ANS

```mermaid
flowchart TD
    AdamantNode <--> | watch transactions | TransactionWatcher
    TransactionWatcher --> | emit new message | NotificationService
    NotificationService --> | ask to notify user's device | FCM/APNs
    FCM/APNs --> | send push notification | Device(User's Device)

    TransactionWatcher --> | emit token | Database
```

## Database

```mermaid
erDiagram
    DEVICES {
        int id PK
        string device_token
        string user_adm_address
        datetime created_at
        datetime updated_at
    }
```

## Stack

- TypeScript with ESM configuration (`type: "module"`)
- `prisma`: Postgres as a database
- `adamant-api`, for interacting with blockchain
- `firebase-admin` for sending Push Notifications via FCM
- `pino` for logging
- `json5` for configuration files
