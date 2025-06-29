import { ethers } from "ethers"
import config from "@/config.json"

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

// Contract ABI for MixionLocker
const MIXION_LOCKER_ABI = [
  "function lockNative(bytes32 commitment) external payable",
  "function lockERC20(bytes32 commitment, address tokenAddress, uint256 amount) external",
  "function withdraw(bytes32 nullifier) external",
"function getLockedDetails(bytes32 commitment) external view returns (uint256 amount, address tokenAddress, uint256 fee, uint256 netAmount)",

  "function isNullifierUsed(bytes32 nullifier) external view returns (bool)",
]

// ERC20 ABI
const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
]

let provider: ethers.providers.Web3Provider | null = null

export function getProvider(): ethers.providers.Web3Provider {
  if (!provider && window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum)
  }
  if (!provider) {
    throw new Error("No Ethereum provider found")
  }
  return provider
}

export function getSigner(): ethers.Signer {
  const provider = getProvider()
  return provider.getSigner()
}

export function getChainConfig(chainId: number) {
  return config.chains.find((chain) => chain.chainId === chainId)
}

export async function connectWallet(): Promise<{ account: string; chainId: number }> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed")
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    if (accounts.length === 0) {
      throw new Error("No accounts found")
    }

    const provider = getProvider()
    const network = await provider.getNetwork()

    return {
      account: accounts[0],
      chainId: network.chainId,
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("User rejected the connection")
    }
    throw error
  }
}

export async function switchChain(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed")
  }

  const chainConfig = getChainConfig(chainId)
  if (!chainConfig) {
    throw new Error("Unsupported chain")
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })
  } catch (error: any) {
    if (error.code === 4902) {
      // Chain not added to MetaMask, add it
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: chainConfig.name,
            nativeCurrency: {
              name: chainConfig.symbol,
              symbol: chainConfig.symbol,
              decimals: 18,
            },
            rpcUrls: [chainConfig.rpcUrl],
            blockExplorerUrls: [chainConfig.blockExplorerUrl],
          },
        ],
      })
    } else {
      throw error
    }
  }
}

export async function getBalance(address: string): Promise<string> {
  const provider = getProvider()
  const balance = await provider.getBalance(address)
  return balance.toString()
}

export async function getERC20Balance(tokenAddress: string, userAddress: string): Promise<string> {
  const provider = getProvider()
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  const balance = await contract.balanceOf(userAddress)
  return balance.toString()
}

export async function fetchTokenDetails(tokenAddress: string): Promise<{
  name: string
  symbol: string
  decimals: number
}> {
  const provider = getProvider()
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

  try {
    const [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()])

    return { name, symbol, decimals }
  } catch (error) {
    throw new Error("Invalid token contract or network error")
  }
}

export async function checkERC20Allowance(
  tokenAddress: string,
  owner: string,
  spender: string,
): Promise<ethers.BigNumber> {
  const provider = getProvider()
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  return await contract.allowance(owner, spender)
}

export async function approveERC20(tokenAddress: string, spender: string, amount: ethers.BigNumber): Promise<string> {
  const signer = getSigner()
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

  const tx = await contract.approve(spender, amount)
  await tx.wait()
  return tx.hash
}

export function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return ethers.utils.hexlify(array);
}

export async function computeNullifier(secret: string): Promise<string> {
  const provider = getProvider()
  const network = await provider.getNetwork()
  const chainId = network.chainId
  // Match smart contract: keccak256(abi.encode("secret", secret, chainId))
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(["string", "string", "uint256"], ["secret", secret, chainId])
  )
}
export async function computeCommitment(secret: string): Promise<string> {
  const provider = getProvider()
  const network = await provider.getNetwork()
  const chainId = network.chainId
  const nullifier = await computeNullifier(secret)
  // Match smart contract: keccak256(abi.encode("commitment", nullifier, chainId))
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(["string", "bytes32", "uint256"], ["commitment", nullifier, chainId])
  )
}


export async function lockNativeFunds(commitment: string, amount: ethers.BigNumber): Promise<string> {
  const signer = getSigner()
  const network = await signer.provider!.getNetwork()
  const chainConfig = getChainConfig(network.chainId)

  if (!chainConfig) {
    throw new Error("Unsupported chain")
  }

  const contract = new ethers.Contract(chainConfig.contractAddress, MIXION_LOCKER_ABI, signer)

  const tx = await contract.lockNative(commitment, { value: amount })
  await tx.wait()
  return tx.hash
}

export async function lockERC20Funds(
  commitment: string,
  tokenAddress: string,
  amount: ethers.BigNumber,
): Promise<string> {
  const signer = getSigner()
  const network = await signer.provider!.getNetwork()
  const chainConfig = getChainConfig(network.chainId)

  if (!chainConfig) {
    throw new Error("Unsupported chain")
  }

  const contract = new ethers.Contract(chainConfig.contractAddress, MIXION_LOCKER_ABI, signer)

  const tx = await contract.lockERC20(commitment, tokenAddress, amount)
  await tx.wait()
  return tx.hash
}

export async function unlockFunds(nullifier: string): Promise<string> {
  const signer = getSigner()
  const network = await signer.provider!.getNetwork()
  const chainConfig = getChainConfig(network.chainId)

  if (!chainConfig) {
    throw new Error("Unsupported chain")
  }

  const contract = new ethers.Contract(chainConfig.contractAddress, MIXION_LOCKER_ABI, signer)

  const tx = await contract.withdraw(nullifier)
  await tx.wait()
  return tx.hash
}

// export async function getLockedDetails(commitment: string): Promise<{
//   amount: string
//   tokenAddress: string
// }> {
//   const provider = getProvider()
//   const network = await provider.getNetwork()
//   const chainConfig = getChainConfig(network.chainId)

//   if (!chainConfig) {
//     throw new Error("Unsupported chain")
//   }

//   const contract = new ethers.Contract(chainConfig.contractAddress, MIXION_LOCKER_ABI, provider)

//   const result = await contract.getLockedDetails(commitment)
//   return {
//     amount: result.amount.toString(),
//     tokenAddress: result.tokenAddress,
//   }
// }
export async function getLockedDetails(commitment: string): Promise<{
  amount: string;
  tokenAddress: string;
  fee: string;
  netAmount: string;
}> {
  const provider = getProvider();
  const network = await provider.getNetwork();
  const chainConfig = getChainConfig(network.chainId);

  if (!chainConfig) {
    throw new Error("Unsupported chain");
  }

  const contract = new ethers.Contract(chainConfig.contractAddress, MIXION_LOCKER_ABI, provider);

  const result = await contract.getLockedDetails(commitment);
  return {
    amount: result.amount.toString(),
    tokenAddress: result.tokenAddress,
    fee: result.fee.toString(),
    netAmount: result.netAmount.toString(),
  };
}

export async function isNullifierUsed(nullifier: string): Promise<boolean> {
  const provider = getProvider()
  const network = await provider.getNetwork()
  const chainConfig = getChainConfig(network.chainId)

  if (!chainConfig) {
    throw new Error("Unsupported chain")
  }

  const contract = new ethers.Contract(chainConfig.contractAddress, MIXION_LOCKER_ABI, provider)

  return await contract.isNullifierUsed(nullifier)
}

export function formatBalance(balance: string, decimals = 18): string {
  const formatted = ethers.utils.formatUnits(balance, decimals)
  const num = Number.parseFloat(formatted)

  if (num === 0) return "0"
  if (num < 0.0001) return "< 0.0001"
  if (num < 1) return num.toFixed(6)
  if (num < 1000) return num.toFixed(4)

  return num.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

export function parseBalance(balance: string, decimals = 18): ethers.BigNumber {
  return ethers.utils.parseUnits(balance, decimals)
}

export function formatAddress(address: string, length = 10): string {
  if (!address) return ""
  if (address.length <= length) return address

  const start = Math.floor((length - 3) / 2)
  const end = Math.ceil((length - 3) / 2)

  return `${address.slice(0, start + 2)}...${address.slice(-end)}`
}
