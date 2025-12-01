import { UniswappyV2EthPair } from "../src/UniswappyV2EthPair" 
import { WNATIVE_ADDRESS } from "../src/addresses"
import { BigNumber } from "ethers";
import { ETHER } from "../src/utils";

const MARKET_ADDRESS = "0x0000000000000000000000000000000000000001"
const TOKEN_ADDRESS = "0x000000000000000000000000000000000000000a"
const PROTOCOL_NAME = "TEST";

describe('UniswappyV2EthPair', function() {
  let wnativePair: UniswappyV2EthPair
  beforeEach(() => {
    wnativePair = new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS, WNATIVE_ADDRESS], PROTOCOL_NAME);
    wnativePair.setReservesViaOrderedBalances([ETHER, ETHER.mul(2)])
  })
  it('fetch balances by token address', function() {
    expect(wnativePair.getBalance(TOKEN_ADDRESS)).toEqual(ETHER);
    expect(wnativePair.getBalance(WNATIVE_ADDRESS)).toEqual(ETHER.mul(2));
  });
  it('get token input required for output', function() {
    expect(wnativePair.getTokensIn(TOKEN_ADDRESS, WNATIVE_ADDRESS, ETHER.div(10))).toEqual(BigNumber.from("52789948793749671"));
    expect(wnativePair.getTokensIn(WNATIVE_ADDRESS, TOKEN_ADDRESS, ETHER.div(10))).toEqual(BigNumber.from("222890894906943052"));
  });
  it('get token output from input', function() {
    expect(wnativePair.getTokensOut(TOKEN_ADDRESS, WNATIVE_ADDRESS, BigNumber.from("52789948793749671"))).toEqual(ETHER.div(10).add(1));
    expect(wnativePair.getTokensOut(WNATIVE_ADDRESS, TOKEN_ADDRESS, BigNumber.from("222890894906943052"))).toEqual(ETHER.div(10));
  });
});
