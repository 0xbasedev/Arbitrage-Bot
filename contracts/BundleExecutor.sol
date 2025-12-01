// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function balanceOf(address owner) external view returns (uint);
}
interface IWNATIVE is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}

contract FlashBotsMultiCall {
    address private immutable owner;
    address private immutable executor;
    IWNATIVE public immutable WNATIVE;

    modifier onlyExecutor() {
        require(msg.sender == executor, "Not executor");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _executor, address _wnative) payable {
        owner = msg.sender;
        executor = _executor;
        WNATIVE = IWNATIVE(_wnative);
        if (msg.value > 0) {
            WNATIVE.deposit{value: msg.value}();
        }
    }

    receive() external payable {}

    /// @notice Batch call DEXes
    function omnichainWNative(
        uint256 _wnativeAmountToFirstMarket,
        uint256 _ethAmountToCoinbase,
        address[] calldata _targets,
        bytes[] calldata _payloads
    ) external onlyExecutor payable {
        require(_targets.length == _payloads.length, "Targets/payloads mismatch");
        uint256 _wnativeBalanceBefore = WNATIVE.balanceOf(address(this));
        WNATIVE.transfer(_targets[0], _wnativeAmountToFirstMarket);

        for (uint256 i = 0; i < _targets.length; i++) {
            (bool _success, ) = _targets[i].call(_payloads[i]);
            require(_success, "Call failed");
        }

        uint256 _wnativeBalanceAfter = WNATIVE.balanceOf(address(this));
        require(_wnativeBalanceAfter > _wnativeBalanceBefore + _ethAmountToCoinbase, "Balance check failed");

        if (_ethAmountToCoinbase == 0) return;

        uint256 _ethBalance = address(this).balance;
        if (_ethBalance < _ethAmountToCoinbase) {
            WNATIVE.withdraw(_ethAmountToCoinbase - _ethBalance);
        }
        (bool sent, ) = block.coinbase.call{value: _ethAmountToCoinbase}("");
        require(sent, "Coinbase payment failed");
    }

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
