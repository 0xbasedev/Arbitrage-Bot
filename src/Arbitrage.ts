import * as _ from "lodash";
import { BigNumber, Contract, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { WNATIVE_ADDRESS } from "./addresses";
import { EthMarket } from "./EthMarket";
import { ETHER, bigNumberToDecimal } from "./utils";

export interface CrossedMarketDetails {
  profit: BigNumber,
  volume: BigNumber,
  tokenAddress: string,
  buyFromMarket: EthMarket,
  sellToMarket: EthMarket,
}

export type MarketsByToken = { [tokenAddress: string]: Array<EthMarket> }

export function getBestCrossedMarket(crossedMarkets: Array<EthMarket>[], tokenAddress: string): CrossedMarketDetails | undefined {
  let bestCrossedMarket: CrossedMarketDetails | undefined = undefined;
  for (const crossedMarket of crossedMarkets) {
    const sellToMarket = crossedMarket[0]
    const buyFromMarket = crossedMarket[1]
    for (const size of [
      ETHER.div(100),
      ETHER.div(10),
      ETHER.div(4),
      ETHER.div(2),
      ETHER.div(1),
      ETHER.mul(2),
    ]) {
      const tokensOutFromBuyingSize = buyFromMarket.getTokensOut(WNATIVE_ADDRESS, tokenAddress, size);
      const proceedsFromSellingTokens = sellToMarket.getTokensOut(tokenAddress, WNATIVE_ADDRESS, tokensOutFromBuyingSize)
      const profit = proceedsFromSellingTokens.sub(size);
      if (bestCrossedMarket && profit.lt(bestCrossedMarket.profit)) break;
      bestCrossedMarket = {
        volume: size,
        profit: profit,
        tokenAddress,
        sellToMarket,
        buyFromMarket
      }
    }
  }
  return bestCrossedMarket;
}

export class Arbitrage {
  private flashbotsProvider: FlashbotsBundleProvider;
  private bundleExecutorContract: Contract;
  private executorWallet: Wallet;

  constructor(
    executorWallet: Wallet,
    flashbotsProvider: FlashbotsBundleProvider,
    bundleExecutorContract: Contract
  ) {
    this.executorWallet = executorWallet;
    this.flashbotsProvider = flashbotsProvider;
    this.bundleExecutorContract = bundleExecutorContract;
  }

  static printCrossedMarket(crossedMarket: CrossedMarketDetails): void {
    console.log(
      `Profit: ${bigNumberToDecimal(crossedMarket.profit)}, Volume: ${bigNumberToDecimal(crossedMarket.volume)}\n`
      + `${crossedMarket.buyFromMarket.protocol}: ${crossedMarket.buyFromMarket.marketAddress}\n`
      + `${crossedMarket.sellToMarket.protocol}: ${crossedMarket.sellToMarket.marketAddress}\n`
    );
  }

  async evaluateMarkets(marketsByToken: Record<string, EthMarket[]>): Promise<CrossedMarketDetails[]> {
    const bestCrossedMarkets = new Array<CrossedMarketDetails>();
    for (const tokenAddress in marketsByToken) {
      const markets = marketsByToken[tokenAddress];
      const crossedMarkets: Array<Array<EthMarket>> = [];
      for (const m1 of markets) {
        for (const m2 of markets) {
          if (m2 !== m1 && m2.getTokensOut(WNATIVE_ADDRESS, tokenAddress, ETHER.div(100)).gt(
              m1.getTokensIn(tokenAddress, WNATIVE_ADDRESS, ETHER.div(100))
            )) {
            crossedMarkets.push([m1, m2]);
          }
        }
      }
      const bestCrossedMarket = getBestCrossedMarket(crossedMarkets, tokenAddress);
      if (bestCrossedMarket && bestCrossedMarket.profit.gt(ETHER.div(1000))) {
        bestCrossedMarkets.push(bestCrossedMarket);
      }
    }
    bestCrossedMarkets.sort((a, b) => b.profit.sub(a.profit).toNumber());
    return bestCrossedMarkets;
  }

  async takeCrossedMarkets(
    bestCrossedMarkets: CrossedMarketDetails[],
    blockNumber: number,
    minerRewardPercentage: number
  ): Promise<void> {
    for (const bestCrossedMarket of bestCrossedMarkets) {
      console.log("Send", bestCrossedMarket.volume.toString(), "WNATIVE for profit", bestCrossedMarket.profit.toString());
      const buyCalls = await bestCrossedMarket.buyFromMarket.sellTokensToNextMarket(
        WNATIVE_ADDRESS, bestCrossedMarket.volume, bestCrossedMarket.sellToMarket);
      const inter = bestCrossedMarket.buyFromMarket.getTokensOut(
        WNATIVE_ADDRESS, bestCrossedMarket.tokenAddress, bestCrossedMarket.volume);
      const sellCallData = await bestCrossedMarket.sellToMarket.sellTokens(
        bestCrossedMarket.tokenAddress, inter, this.bundleExecutorContract.address);

      const targets = [...buyCalls.targets, bestCrossedMarket.sellToMarket.marketAddress];
      const payloads = [...buyCalls.data, sellCallData];
      const minerReward = bestCrossedMarket.profit.mul(minerRewardPercentage).div(100);
      const transaction = await this.bundleExecutorContract.populateTransaction.omnichainWNative(
        bestCrossedMarket.volume, minerReward, targets, payloads,
        {
          gasPrice: BigNumber.from(0),
          gasLimit: BigNumber.from(1000000),
        }
      );
      try {
        const estimateGas = await this.bundleExecutorContract.provider.estimateGas({
          ...transaction,
          from: this.executorWallet.address,
        });
        transaction.gasLimit = estimateGas.mul(2);
      } catch (e) {
        console.warn(`EstimateGas failed for ${bestCrossedMarket.tokenAddress}`);
        continue;
      }

      const bundle = [{
        signer: this.executorWallet,
        transaction,
      }];
      const signedBundle = await this.flashbotsProvider.signBundle(bundle);
      const simulation = await this.flashbotsProvider.simulate(signedBundle, blockNumber + 1);
      if ("error" in simulation || simulation.firstRevert !== undefined) {
        console.log(`Simulation Error: ${bestCrossedMarket.tokenAddress}, skipping`);
        continue;
      }
      console.log(`Submitting bundle, profit to miner: ${bigNumberToDecimal(simulation.coinbaseDiff)}`);
      await Promise.all([blockNumber + 1, blockNumber + 2].map(
        bn => this.flashbotsProvider.sendRawBundle(signedBundle, bn)));
      return;
    }
    throw new Error("No arbitrage submitted to relay");
  }
}
