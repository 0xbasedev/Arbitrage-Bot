// SPDX-License-Identifier: MIT
// Edited by msg.sender
pragma solidity ^0.8.30;

/// @title Uniswap V2 Pair interface
interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

/// @title Uniswap V2 Factory interface
interface IUniswapV2Factory {
    function allPairsLength() external view returns (uint);
    function allPairs(uint) external view returns (address);
    function getPair(address tokenA, address tokenB) external view returns (address);
}

/// @title FlashBotsUniswapQuery
/// @notice Enables batch querying of Uniswap V2 pairs and reserves for analytics, bots, and monitoring
contract FlashBotsUniswapQuery {
    /// @notice Batch retrieve reserves data for multiple pairs
    /// @param _pairs Array of Uniswap V2 pairs
    /// @return Array of [reserve0, reserve1, blockTimestampLast] for each pair as uint256[3]
    function getReservesByPairs(IUniswapV2Pair[] calldata _pairs)
        external
        view
        returns (uint256[3][] memory)
    {
        uint256[3][] memory result = new uint256[3][](_pairs.length);
        for (uint256 i = 0; i < _pairs.length; i++) {
            (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) = _pairs[i].getReserves();
            result[i][0] = reserve0;
            result[i][1] = reserve1;
            result[i][2] = blockTimestampLast;
        }
        return result;
    }

    /// @notice Batch retrieve pair token addresses and contract addresses by range
    /// @param _uniswapFactory Uniswap V2 factory contract address
    /// @param _start Start index (inclusive)
    /// @param _stop Stop index (exclusive)
    /// @return Array of [token0, token1, pairAddress] for each pair as address[3]
    function getPairsByIndexRange(
        IUniswapV2Factory _uniswapFactory,
        uint256 _start,
        uint256 _stop
    ) external view returns (address[3][] memory) {
        uint256 _allPairsLength = _uniswapFactory.allPairsLength();
        if (_stop > _allPairsLength) {
            _stop = _allPairsLength;
        }
        require(_stop >= _start, "start cannot be higher than stop");
        uint256 _qty = _stop - _start;
        address[3][] memory result = new address[3][](_qty);
        for (uint256 i = 0; i < _qty; i++) {
            IUniswapV2Pair _uniswapPair = IUniswapV2Pair(_uniswapFactory.allPairs(_start + i));
            result[i][0] = _uniswapPair.token0();
            result[i][1] = _uniswapPair.token1();
            result[i][2] = address(_uniswapPair);
        }
        return result;
    }
}
