# Wallet PNL Tracker

A comprehensive cryptocurrency wallet PNL (Profit and Loss) tracking system that monitors wallet addresses, calculates PNL, assesses risk metrics, and tracks open positions through a web dashboard.

## Features

- Wallet address monitoring and validation
- Transaction history tracking
- Position detection and analysis
- PNL calculation (realized and unrealized)
- Risk metrics analysis (volatility, drawdown, VaR)
- Interactive dashboard with data visualization
- IP-based rate limiting for security

## Tech Stack

- **Frontend**: React, TypeScript, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase
- **APIs**: HyperLiquid API for blockchain data
- **Authentication**: IP-based rate limiting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/wallet-pnl-tracker.git
   cd wallet-pnl-tracker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3001
   NODE_ENV=development
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
   HYPERLIQUID_WS_URL=wss://api.hyperliquid.xyz/ws
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   CORS_ORIGIN=http://localhost:3000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
wallet-pnl-tracker/
├── src/
│   ├── backend/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration
│   │   ├── middleware/     # Express middleware
│   │   └── server.ts       # Entry point
│   ├── frontend/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client services
│   │   ├── utils/          # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context
│   │   └── index.tsx       # Entry point
│   └── shared/
│       ├── types/          # Shared TypeScript types
│       └── utils/          # Shared utility functions
├── dist/                   # Compiled output
├── node_modules/           # Dependencies
├── .env                    # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Project metadata
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Development

- **Backend**: `npm run dev:backend`
- **Frontend**: `npm run dev:frontend`
- **Both**: `npm run dev`
- **Build**: `npm run build`
- **Start production**: `npm start`
- **Lint**: `npm run lint`
- **Test**: `npm run test`

## Usage Guide

### Development Workflow

#### Setting Up Supabase

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project and note your project URL and API key
3. Set up the database tables by running the following SQL in the Supabase SQL editor:

```sql
-- Create wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  hash TEXT NOT NULL,
  block_number INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  value TEXT NOT NULL,
  asset TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  fee TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  entry_price TEXT NOT NULL,
  current_price TEXT NOT NULL,
  quantity TEXT NOT NULL,
  side TEXT NOT NULL,
  status TEXT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  realized_pnl TEXT,
  unrealized_pnl TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_metrics table
CREATE TABLE risk_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  volatility TEXT NOT NULL,
  drawdown TEXT NOT NULL,
  value_at_risk TEXT NOT NULL,
  sharpe_ratio TEXT NOT NULL,
  sortino_ratio TEXT NOT NULL,
  concentration TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create request_tracking table for rate limiting
CREATE TABLE request_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_positions_wallet_id ON positions(wallet_id);
CREATE INDEX idx_risk_metrics_wallet_id ON risk_metrics(wallet_id);
CREATE INDEX idx_request_tracking_ip_timestamp ON request_tracking(ip_address, timestamp);
```

#### Local Development

1. **Backend Development**:
   - Run `npm run dev:backend` to start the backend server
   - The server will be available at `http://localhost:3001`
   - API endpoints will be accessible at `http://localhost:3001/api`
   - Changes to backend code will automatically restart the server

2. **Frontend Development**:
   - Run `npm run dev:frontend` to start the frontend development server
   - The frontend will be available at `http://localhost:3000`
   - Changes to frontend code will automatically reload the page

3. **Full Stack Development**:
   - Run `npm run dev` to start both backend and frontend servers
   - This is useful for testing the full application

4. **Testing API Endpoints**:
   - Use tools like Postman or curl to test API endpoints
   - Example: `curl http://localhost:3001/api/health` should return a health check response

5. **Debugging**:
   - Backend: Use console.log or attach a debugger to the Node.js process
   - Frontend: Use browser developer tools and React DevTools

### Deployment

#### Preparing for Production

1. **Environment Configuration**:
   - Create a `.env.production` file with production settings
   - Ensure all sensitive information is properly secured
   - Set `NODE_ENV=production` to enable production optimizations

2. **Building the Application**:
   - Run `npm run build` to create production builds
   - This will compile TypeScript to JavaScript and optimize the code
   - The output will be in the `dist` directory

3. **Testing the Production Build**:
   - Run `npm start` to start the production server
   - Verify that everything works as expected

#### Deploying to Render

[Render](https://render.com) is a cloud platform that makes it easy to deploy web applications.

1. **Create a Render Account**:
   - Sign up at [https://render.com](https://render.com)

2. **Create a Web Service**:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - Name: `wallet-pnl-tracker`
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Plan: Select an appropriate plan based on your needs

3. **Environment Variables**:
   - Add all the environment variables from your `.env.production` file
   - Make sure to set `NODE_ENV=production`

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Your application will be available at `https://wallet-pnl-tracker.onrender.com` (or your custom domain)

#### Deploying to Other Platforms

The application can also be deployed to other platforms like Heroku, AWS, or Google Cloud Platform:

1. **Heroku**:
   - Install the Heroku CLI
   - Create a `Procfile` with: `web: npm start`
   - Run `heroku create wallet-pnl-tracker`
   - Set environment variables with `heroku config:set KEY=VALUE`
   - Deploy with `git push heroku main`

2. **AWS Elastic Beanstalk**:
   - Create an Elastic Beanstalk environment
   - Configure environment variables
   - Deploy using the AWS CLI or AWS Console

3. **Docker Deployment**:
   - Create a `Dockerfile` for containerization
   - Build the Docker image: `docker build -t wallet-pnl-tracker .`
   - Run the container: `docker run -p 3001:3001 wallet-pnl-tracker`
   - Deploy to container orchestration platforms like Kubernetes or AWS ECS

### Maintenance and Monitoring

1. **Logging**:
   - Use a logging service like Logtail, Papertrail, or AWS CloudWatch
   - Monitor application logs for errors and performance issues

2. **Performance Monitoring**:
   - Implement application performance monitoring (APM) with tools like New Relic or Datadog
   - Monitor API response times and error rates

3. **Database Maintenance**:
   - Regularly backup your Supabase database
   - Monitor database performance and optimize queries as needed

4. **Updates and Security**:
   - Regularly update dependencies to patch security vulnerabilities
   - Run `npm audit` to check for security issues
   - Implement security best practices like HTTPS, CORS, and rate limiting

### Scaling Considerations

1. **Database Scaling**:
   - Implement database caching for frequently accessed data
   - Consider sharding or read replicas for high-traffic applications

2. **API Scaling**:
   - Implement horizontal scaling by running multiple instances behind a load balancer
   - Use a CDN for static assets

3. **Rate Limiting**:
   - Adjust rate limiting parameters based on actual usage patterns
   - Implement more sophisticated rate limiting strategies if needed

## License

This project is licensed under the ISC License. 