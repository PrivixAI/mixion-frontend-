// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title MixionLocker - A privacy-focused smart contract for locking and unlocking funds with computational anonymity
/// @notice Allows users to lock/unlock native coins or ERC20 tokens with commitments, nullifiers, and fees
/// @dev Uses keccak256-based commitment/nullifier with chain-specific salt, 2% unlock fee, and admin fee withdrawal
contract MixionLocker is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Mappings to track commitments, nullifiers, amounts, and token addresses
    mapping(bytes32 => bool) public usedCommitments;
    mapping(bytes32 => uint256) public lockedAmounts;
    mapping(bytes32 => address) public lockedTokenAddresses;
    mapping(bytes32 => bool) public usedNullifiers;

    // Fee-related storage
    mapping(address => uint256) public collectedFees; // Tracks fees per token (address(0) for native)
    uint256 public constant FEE_PERCENTAGE = 2; // 2% fee
    uint256 public constant FEE_DENOMINATOR = 100;

    // Events for transparency and debugging
    event FundsLocked(
        address indexed user,
        bytes32 commitment,
        uint256 amount,
        address tokenAddress,
        bool isNative
    );
    event FundsWithdrawn(
        address indexed recipient,
        bytes32 nullifier,
        uint256 amount,
        uint256 fee,
        address tokenAddress,
        bool isNative
    );
    event FeesWithdrawn(address indexed admin, address tokenAddress, uint256 amount, bool isNative);
    event EmergencyPause(address indexed owner, bool paused);
    event EmergencyUnpause(address indexed owner, bool paused);

    /// @notice Constructor to initialize the contract with the owner
    /// @param _owner The address that will own the contract
    constructor(address _owner) Ownable(_owner) {
        require(_owner != address(0), "Invalid owner address");
    }

    /// @notice Locks native coins (e.g., PRIVIX) with a commitment
    /// @param commitment The keccak256 hash of ("commitment", nullifier, chainid)
    /// @dev Validates amount, commitment, and stores data; emits FundsLocked event
    function lockNative(bytes32 commitment) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be greater than zero");
        require(!usedCommitments[commitment], "Commitment already used");
        require(commitment != bytes32(0), "Invalid commitment");

        // Mark commitment as used and store amount
        usedCommitments[commitment] = true;
        lockedAmounts[commitment] = msg.value;
        lockedTokenAddresses[commitment] = address(0); // address(0) indicates native coin

        // Emit event
        emit FundsLocked(msg.sender, commitment, msg.value, address(0), true);
    }

    /// @notice Locks ERC20 tokens with a commitment
    /// @param commitment The keccak256 hash of ("commitment", nullifier, chainid)
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount The amount of tokens to lock
    /// @dev Validates approval, transfers tokens, and stores data; emits FundsLocked event
    function lockERC20(bytes32 commitment, address tokenAddress, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(amount > 0, "Amount must be greater than zero");
        require(tokenAddress != address(0), "Invalid token address");
        require(!usedCommitments[commitment], "Commitment already used");
        require(commitment != bytes32(0), "Invalid commitment");

        // Validate token contract
        uint256 codeSize;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            codeSize := extcodesize(tokenAddress)
        }
        require(codeSize > 0, "Token address is not a contract");

        // Transfer tokens to the contract
        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Mark commitment as used and store data
        usedCommitments[commitment] = true;
        lockedAmounts[commitment] = amount;
        lockedTokenAddresses[commitment] = tokenAddress;

        // Emit event
        emit FundsLocked(msg.sender, commitment, amount, tokenAddress, false);
    }

    /// @notice Unlocks funds (native coins or ERC20 tokens) using a nullifier
    /// @param nullifier The keccak256 hash of ("secret", secret, chainid)
    /// @dev Recomputes commitment with chainid, applies 2% fee, and transfers funds
    function withdraw(bytes32 nullifier) external nonReentrant whenNotPaused {
        require(nullifier != bytes32(0), "Invalid nullifier");
        require(!usedNullifiers[nullifier], "Nullifier already used");

        // Recompute commitment: keccak256("commitment", nullifier, chainid)
        bytes32 commitment = keccak256(abi.encode("commitment", nullifier, block.chainid));
        require(usedCommitments[commitment], "Invalid commitment");
        uint256 amount = lockedAmounts[commitment];
        require(amount > 0, "No funds locked for commitment");

        // Mark nullifier as used to prevent double-spending
        usedNullifiers[nullifier] = true;

        // Get token address (address(0) for native coins)
        address tokenAddress = lockedTokenAddresses[commitment];
        bool isNative = tokenAddress == address(0);

        // Calculate fee (2% of amount)
        uint256 fee = (amount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;
        require(netAmount > 0, "Net amount must be greater than zero");

        // Update collected fees
        collectedFees[tokenAddress] += fee;

        // Clear storage to save gas
        delete lockedAmounts[commitment];
        delete lockedTokenAddresses[commitment];

        // Transfer funds
        if (isNative) {
            // Transfer native coins
            (bool success, ) = payable(msg.sender).call{value: netAmount}("");
            require(success, "Native coin transfer failed");
        } else {
            // Transfer ERC20 tokens
            IERC20(tokenAddress).safeTransfer(msg.sender, netAmount);
        }

        // Emit event
        emit FundsWithdrawn(msg.sender, nullifier, netAmount, fee, tokenAddress, isNative);
    }

    /// @notice Admin function to withdraw all collected fees
    /// @param tokenAddresses Array of token addresses to withdraw fees for (include address(0) for native)
    /// @dev Only owner can call; transfers all collected fees to owner
    function withdrawFees(address[] calldata tokenAddresses) external onlyOwner nonReentrant {
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            address tokenAddress = tokenAddresses[i];
            uint256 feeAmount = collectedFees[tokenAddress];
            if (feeAmount == 0) continue;

            // Reset collected fees
            collectedFees[tokenAddress] = 0;

            // Transfer fees
            if (tokenAddress == address(0)) {
                // Native coin transfer
                (bool success, ) = payable(owner()).call{value: feeAmount}("");
                require(success, "Native fee withdrawal failed");
                emit FeesWithdrawn(owner(), tokenAddress, feeAmount, true);
            } else {
                // ERC20 token transfer
                IERC20(tokenAddress).safeTransfer(owner(), feeAmount);
                emit FeesWithdrawn(owner(), tokenAddress, feeAmount, false);
            }
        }
    }

    /// @notice Checks if a nullifier has been used
    /// @param nullifier The nullifier to check
    /// @return True if the nullifier has been used, false otherwise
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }

    /// @notice Queries the locked amount, token address, fee, and net amount for a commitment
    /// @param commitment The commitment to query
    /// @return amount The locked amount
    /// @return tokenAddress The token address (address(0) for native coins)
    /// @return fee The 2% fee that will be charged on unlock
    /// @return netAmount The amount the user will receive after fee
    function getLockedDetails(bytes32 commitment)
        external
        view
        returns (
            uint256 amount,
            address tokenAddress,
            uint256 fee,
            uint256 netAmount
        )
    {
        amount = lockedAmounts[commitment];
        tokenAddress = lockedTokenAddresses[commitment];

        if (amount == 0) {
            return (0, tokenAddress, 0, 0);
        }

        // Calculate fee (2% of amount)
        fee = (amount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        netAmount = amount - fee;
    }

    /// @notice Pauses the contract in case of emergency
    /// @dev Only callable by the owner; emits EmergencyPause event
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPause(msg.sender, true);
    }

    /// @notice Unpauses the contract
    /// @dev Only callable by the owner; emits EmergencyUnpause event
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpause(msg.sender, false);
    }

    /// @notice Fallback function to prevent accidental ETH sends
    receive() external payable {
        revert("Use lockNative to lock funds");
    }

    /// @notice Explicit fallback to prevent unintended calls
    fallback() external payable {
        revert("Invalid function call");
    }
}