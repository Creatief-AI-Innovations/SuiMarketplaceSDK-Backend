# SUI Marketplace SDK API (Backend)
Welcome to the SUI Market API documentation. This repository contains the backend source code for the **SUI Marketplace SDK **. The API is designed to handle core functionalities such as authentication,list all available nfts in collection, buy and list nft for sale operations.

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


Base URL
All requests should be made to the following base 
URL:http://localhost:3000.

Authentication
The SUI market API uses API keys for authentication. Include your API key in the header of every request:
makefile
Copy code
Authorization: Bearer <your_api_key>

Endpoints
1. Authentication
1.1 login
Endpoint:
POST api/v1/login
Description:
Login / Create user if not exist. 
Headers:
Key
Value
Authorization
Bearer <TOKEN>
x-api-key
<API_KEY>

Request body:
{
  "username": "user",
  "password": "******"
}
Response:
{
	"success": true,
	"token": "ey****************************I",
	"message": "User logged in successfully!",
	"data": {
		"username": "user",
		"wallet": "0x23b51………fa66234"
	}
}


2. Products
2.1 Get All Products
Endpoint:
GET /api/v1/market/products

Description:
Retrieve a list of all products.
Headers:
Key
Value
Authorization
Bearer <API_KEY>

Query Parameters:
Parameter
Type
Required
Description
limit
integer
No
Number of results to return.
page
integer
No
Page number for pagination.

Response:
json
{
"success": true,
	"data": [
{
"id": "4eb363a9-e862-4943-8de6-628dfe903664”,
"price": 7500000,
"price_str": "7500000",
"name": "WORM - BIRDS GameFi Asset",
"media_url": "https://asset.birds.dog/img/1/0.png",
“listings” : [ { id : “7b2452e0-e4be-4159-be40-a81ecf613f30”, price: 70000}],
“attributes”: []
“owned” : false
},
{
"id": "4eb363a9-e862-4943-8de6-628dfe903664”,
"price": 7500000,
"price_str": "7500000",
"name": "WORM - BIRDS GameFi Asset",
"media_url": "https://asset.birds.dog/img/1/0.png",
“listings” : [ { id : “7b2452e0-e4be-4159-be40-a81ecf613f30”, price: 70000}]
“attributes”: []
“owned” : false

},
]
}





Error Codes
Code
Description
200
Request was successful.
400
Bad request.
401
Unauthorized.
404
Resource not found.
500
Internal server error.



App error code
2004  : Not enough balance in wallet

