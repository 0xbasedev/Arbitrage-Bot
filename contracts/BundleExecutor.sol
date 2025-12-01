// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function balanceOf(address owner) external view returns (uint);
}
interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}

contract FlashBotsMultiCall {
    address private immutable owner;
    address private immutable executor;
    IWETH public immutable WETH;

    modifier onlyExecutor() {
        require(msg.sender == executor, "Not executor");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _executor, address _weth) payable {
        owner = msg.sender;
        executor = _executor;
        WETH = IWETH(_weth);
        if (msg.value > 0) {
            WETH.deposit{value: msg.value}();
        }
    }

    receive() external payable {}

    /**
     * Optionally, you can add a flashloan entrypoint here in future
     * Take care to use correct params and callback for flashloan provider.
     */

    /// @notice Batch call DEXes
    function uniswapWeth(
        uint256 _wethAmountToFirstMarket,
        uint256 _ethAmountToCoinbase,
        address[] calldata _targets,
        bytes[] calldata _payloads
    ) external onlyExecutor payable {
        require(_targets.length == _payloads.length, "Targets/payloads mismatch");
        uint256 _wethBalanceBefore = WETH.balanceOf(address(this));
        WETH.transfer(_targets[0], _wethAmountToFirstMarket);

        for (uint256 i = 0; i < _targets.length; i++) {
            (bool _success, ) = _targets[i].call(_payloads[i]);
            require(_success, "Call failed");
        }

        uint256 _wethBalanceAfter = WETH.balanceOf(address(this));
        require(_wethBalanceAfter > _wethBalanceBefore + _ethAmountToCoinbase, "Balance check failed");

        if (_ethAmountToCoinbase == 0) return;

        uint256 _ethBalance = address(this).balance;
        if (_ethBalance < _ethAmountToCoinbase) {
            WETH.withdraw(_ethAmountToCoinbase - _ethBalance);
        }
        (bool sent, ) = block.coinbase.call{value: _ethAmountToCoinbase}("");
        require(sent, "Coinbase payment failed");
    }

    /// @notice Owner utility - proxy call
    function call(
        address payable _to,
        uint256 _value,
        bytes calldata _data
    ) external onlyOwner payable returns (bytes memory) {
        require(_to != address(0), "Bad target");
        (bool _success, bytes memory _result) = _to.call{value: _value}(_data);
        require(_success, "Call failed");
        return _result;
    }
}
        for (uint256 i = 0; i < _targets.length; i++) {
            (bool _success, bytes memory _response) = _targets[i].call(_payloads[i]);
            require(_success, "Call failed");
        }

        uint256 _wethBalanceAfter = WETH.balanceOf(address(this));
        require(_wethBalanceAfter > _wethBalanceBefore + _ethAmountToCoinbase, "Balance check failed");

        if (_ethAmountToCoinbase == 0) return;

        uint256 _ethBalance = address(this).balance;
        if (_ethBalance < _ethAmountToCoinbase) {
            WETH.withdraw(_ethAmountToCoinbase - _ethBalance);
        }
        // solhint-disable-next-line avoid-low-level-calls
        (bool sent, ) = block.coinbase.call{value: _ethAmountToCoinbase}("");
        require(sent, "Coinbase payment failed");
    }

    /// @notice Generic proxy call (owner only)
    /// @param _to Target address to call
    /// @param _value ETH value to send
    /// @param _data Call data
    function call(
        address payable _to,
        uint256 _value,
        bytes calldata _data
    )
        external
        onlyOwner
        payable
        returns (bytes memory)
    {
        require(_to != address(0), "Bad target");
        (bool _success, bytes memory _result) = _to.call{value: _value}(_data);
        require(_success, "Call failed");
        return _result;
    }
