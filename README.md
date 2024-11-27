# SUI Marketplace SDK API (Backend)
Welcome to the SUI Market API documentation. This repository contains the backend source code for the **SUI Marketplace SDK **. The API is designed to handle core functionalities such as authentication,list all available nfts in a collection, buy and list nft for sale operations from tradeport marketplace.

## Features
- RESTful API architecture
- User authentication and authorization
- Scalable and modular design
- Integrated error handling
- Secure data storage with encryption
---

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+)
- [MySQL](https://www.mysql.com/) 
- A package manager like `npm`
- [Tradeport](https://www.tradeport.xyz/docs/nft-trading-sdk/sui-sdk/getting-started) api keys : [request api](https://form.asana.com/?k=ClRNDmKRUMlBEYDWbxR_Mw&d=1203273737616767) set your user and api in TRADEPORT_USER and TRADEPORT_KEY fields in your .env file mentioned in step3
---



## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Creatief-AI-Innovations/SuiMarketplaceSDK-Backend.git
cd SuiMarketplaceSDK-Backend
```

### 2. Install dependencies
```bash
npm install
```
### 3. Set up environment variables
Create a .env file in the root directory with the following keys:
```
DB_HOST="127.0.0.1"
DB_USER="root"
DB_PASSWORD="YOUR_DB_PASSWORD"
DB_NAME="YOUR_DB_NAME"
JWT_SECRET_TOKEN="YOUR_JWT_SECRET_TOKEN"
NODEJS_ENCRYPTION_KEY="YOUR_ENCRYPTION_KEY"
TRADEPORT_USER="YOUR_TRADEPORT_USER"
TRADEPORT_KEY="YOUR_TRADEPORT_KEY"
RPC_URL="https://fullnode.mainnet.sui.io:443"
```

### 4. Run the server for development with hot-reloading
```
npm run dev
```

The server will start at http://localhost:3000.


### 5. Use this api with SUI Market SDKs
Clone the sui market place sdk and update the baseUrl with backend server url (eg :  http://localhost:3000).

-1. [SUI Market SDK for Javascript](https://github.com/Creatief-AI-Innovations/SuiMarketplaceSDK)
-2. [SUI Market SDK for Unreal](https://github.com/Creatief-AI-Innovations/SuiMarketplaceSDK-Unreal)


--------------------------------------------------------------------------------------------------------------------------------------------------------