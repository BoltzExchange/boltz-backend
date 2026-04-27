// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStateView {
    /// @notice Retrieves the total liquidity of a pool.
    /// @dev Corresponds to pools[poolId].liquidity
    /// @param poolId The ID of the pool.
    /// @return liquidity The liquidity of the pool.
    function getLiquidity(bytes32 poolId) external view returns (uint128 liquidity);
}
