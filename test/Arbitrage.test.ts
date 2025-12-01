import { Arbitrage, getBestCrossedMarket } from "../src/Arbitrage"
import { WNATIVE_ADDRESS } from "../src/addresses"
import { UniswappyV2EthPair } from "../src/UniswappyV2EthPair";
import { BigNumber } from "ethers";
import { ETHER } from "../src/utils";

const MARKET_ADDRESS = "0x0000000000000000000000000000000000000001"
const TOKEN_ADDRESS = "0x000000000000000000000000000000000000000a"
const PROTOCOL_NAME = "TEST";

describe('Arbitrage', function() {
  let groupedWnativeMarkets: Array<UniswappyV2EthPair>
  beforeEach(() => {
    groupedWnativeMarkets = [
      new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS, WNATIVE_ADDRESS], PROTOCOL_NAME),
      new UniswappyV2EthPair(MARKET_ADDRESS, [TOKEN_ADDRESS, WNATIVE_ADDRESS], PROTOCOL_NAME),
    ]
  })
  it('Calculate Crossed Markets', function() {
    groupedWnativeMarkets[0].setReservesViaOrderedBalances([ETHER, ETHER.mul(2)])
    groupedWnativeMarkets[1].setReservesViaOrderedBalances([ETHER, ETHER])

    const bestCrossedMarket = getBestCrossedMarket([groupedWnativeMarkets], TOKEN_ADDRESS);
    if (bestCrossedMarket === undefined) {
      fail("No crossed Market")
      return
    }
    expect(bestCrossedMarket.volume).toEqual(BigNumber.from("208333333333333333"))
    expect(bestCrossedMarket.profit).toEqual(BigNumber.from("0x012be1d487a428ce"))
  });
  it('Calculate markets that do not cross', function() {
    groupedWnativeMarkets[0].setReservesViaOrderedBalances([ETHER, ETHER])
    groupedWnativeMarkets[1].setReservesViaOrderedBalances([ETHER, ETHER])

    const bestCrossedMarket = getBestCrossedMarket([groupedWnativeMarkets], TOKEN_ADDRESS);
    if (bestCrossedMarket === undefined) {
      fail("No crossed Market")
      return
    }
    expect(bestCrossedMarket.profit.lt(0)).toBeTrue()
  });
});
