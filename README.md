# ADAMANT Notification Service (ANS)

## How it works

To deliver notifcations privately and secure, 4 parties are involved:

1. User's device (Android or iOS)
2. ADAMANT node
3. Apple Push Notification Service (APNS), for iOS, or Firebase Cloud Messaging (FCM), for Android
4. This application, ADAMANT Notification Service (ANS)

A workflow runs as:

- User's device requests a unique token from APNS or FCM
- User encrypts that token into a special transaction type ([AIP-6: Signal Messages](https://aips.adamant.im/AIPS/aip-6)) and sends it to an ADAMANT blockchain node
- Meanwhile, the ANS polls the ADAMANT node continuously to find Signal Messages. After it saves the token (alongside the ADM address) or updates the old one into a local DB
- ANS polls the ADAMANT node and filters transactions where the user is the recipient. ANS asks APNS/FCM to deliver these transactions to the user's device
- APNS or FCM notifies the user's device
- The user's device receives a notification and decrypts the transaction using a private key

```mermaid
sequenceDiagram
    participant UserDevice as User's Device
    participant APNS_FCM as APNS/FCM
    participant ANS as ADAMANT Notification Service (ANS)
    participant ADAMANT as ADAMANT Node

    UserDevice->>APNS_FCM: Request unique token
    APNS_FCM-->>UserDevice: Return unique token
    UserDevice->>UserDevice: Encrypt token into special transaction (AIP-6)
    UserDevice->>ADAMANT: Send encrypted token to ADAMANT node

    loop Continuously
        ANS->>ADAMANT: Poll for Signal Messages
        ADAMANT-->>ANS: Return Signal Messages
        ANS->>ANS: Save or update token in local DB
    end

    loop Continuously
        ANS->>ADAMANT: Poll for transactions where user is recipient
        ADAMANT-->>ANS: Return transactions with encrypted messages
        ANS->>APNS_FCM: Ask to deliver transaction to user's device using token
    end

    APNS_FCM-->>UserDevice: Notify user's device
    UserDevice->>UserDevice: Decrypt transaction using private key
```
