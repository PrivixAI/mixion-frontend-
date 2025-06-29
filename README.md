# MixionLocker DApp

A production-ready, privacy-focused decentralized application for locking and unlocking funds across multiple EVM-compatible blockchains.

## Features

- **Multichain Support**: Works on Privix Chain Mainnet and BNB Smart Chain
- **Privacy-First**: Uses commitment-nullifier cryptographic proofs for anonymous transactions
- **Modern UI**: Glassmorphism design with beautiful animations and responsive layout
- **Real-time Updates**: WebSocket integration for live balance updates
- **Custom Tokens**: Add and manage custom ERC20 tokens
- **Transaction History**: Local storage of transaction history with filtering
- **Secure**: Client-side secret generation and management

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Blockchain**: ethers.js v5 for EVM interactions
- **Styling**: Tailwind CSS with glassmorphism effects
- **Animations**: Framer Motion for smooth transitions
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Access to Privix Chain Mainnet or BNB Smart Chain

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd mixion-locker-dapp
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Configuration

The DApp configuration is stored in `config.json` and includes:

- Supported blockchain networks
- Contract addresses
- RPC and WebSocket URLs
- Default token lists

To add a new chain, update the `config.json` file with the chain details.

## Smart Contract Integration

The DApp integrates with the MixionLocker smart contract deployed on:

- **Privix Chain Mainnet**: `0x1AD6c4918f38041433109E0C9b71Ba84F8EDBE89`
- **BNB Smart Chain**: `0x689b4C14AE9bEe1A0Ab4e306925AB7b5A29c1a55`

### Contract Functions

- `lockNative(bytes32 commitment)`: Lock native coins
- `lockERC20(bytes32 commitment, address tokenAddress, uint256 amount)`: Lock ERC20 tokens
- `withdraw(bytes32 nullifier)`: Unlock funds
- `getLockedDetails(bytes32 commitment)`: Query locked fund details
- `isNullifierUsed(bytes32 nullifier)`: Check if nullifier is used

## Privacy & Security

- **Client-side Secret Generation**: Secrets are generated locally using cryptographically secure random number generation
- **Commitment-Nullifier Scheme**: Uses keccak256 hashing for commitment and nullifier generation
- **Local Storage**: Transaction history and custom tokens are stored locally
- **No External Dependencies**: All cryptographic operations are performed client-side

## Usage

### Locking Funds

1. Connect your wallet
2. Navigate to "Lock Funds"
3. Select the token and amount
4. Choose to use a custom secret or generate one automatically
5. Approve token transfer (for ERC20 tokens)
6. Confirm the lock transaction
7. Save the generated secret securely

### Unlocking Funds

1. Navigate to "Unlock Funds"
2. Enter your secret
3. Verify the fund details
4. Confirm the unlock transaction

### Managing Tokens

- Add custom ERC20 tokens by contract address
- View token balances in real-time
- Remove custom tokens from settings

## File Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── connect-wallet/    # Wallet connection
│   ├── dashboard/         # Main dashboard
│   ├── lock-funds/        # Lock funds interface
│   ├── unlock-funds/      # Unlock funds interface
│   ├── history/           # Transaction history
│   ├── settings/          # Settings page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── blockchain.ts      # Blockchain interactions
│   └── storage.ts         # Local storage management
├── config.json           # Chain and token configuration
└── README.md
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security Considerations

- Always verify contract addresses before interacting
- Keep your secrets secure and backed up
- Use hardware wallets for large amounts
- Verify transactions before signing

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Contact the development team

---

**Disclaimer**: This software is provided as-is. Users are responsible for their own security and should audit the code before using with significant funds.
