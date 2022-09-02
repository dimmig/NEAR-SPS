import React, { createContext } from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import App from "./App";
import Big from "big.js";
import reportWebVitals from "./reportWebVitals";
import contractConfig from "./components/config/contractConfig";
import * as nearApi from "near-api-js";
import usnContractConfig from "./components/config/usnConfig";
window.Buffer = window.Buffer || require("buffer").Buffer;

export const ContextManager = createContext(null);

const viewFunction = async (contract, method, args = {}) => {
  const provider = new nearApi.providers.JsonRpcProvider({
    url: contractConfig(process.env.NEAR_ENV || "testnet").nodeUrl,
  });

  const rawResult = await provider.query({
    request_type: "call_function",
    account_id: contract,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });
  return JSON.parse(Buffer.from(rawResult.result).toString());
};

const fromPrecision = async (token, amount) => {
  const decimals = await viewFunction(token, "ft_metadata");
  return Big(amount).div(Big(10).pow(decimals.decimals)).round(6).toFixed(2);
};

const toPrecision = async (token, amount) => {
  const decimals = await viewFunction(token, "ft_metadata");
  return Big(amount).mul(Big(10).pow(decimals.decimals)).round(6).toFixed();
};

const initUsnContract = async () => {
  const config = usnContractConfig("testnet" || process.env.NEAR_ENV);

  const keyStore = new nearApi.keyStores.BrowserLocalStorageKeyStore();

  const near = await nearApi.connect({ keyStore, ...config });

  const wallet = new nearApi.WalletConnection(near);

  const usnContract = new nearApi.Contract(
    wallet.account(),
    config.contractName,
    {
      viewMethods: ["ft_balance_of"],
      changeMethods: ["ft_transfer_call"],
      sender: wallet.account(),
    }
  );

  return { contract: usnContract, config };
};

const initContract = async () => {
  const config = contractConfig(process.env.NEAR_ENV || "testnet");

  const keyStore = new nearApi.keyStores.BrowserLocalStorageKeyStore();

  const near = await nearApi.connect({ ...config, keyStore });

  const wallet = new nearApi.WalletConnection(near);

  let currentUser;
  if (wallet.getAccountId()) {
    currentUser = {
      accountId: wallet.getAccountId(),
      balance: (await wallet.account().state()).amount,
    };
  }

  const contract = new nearApi.Contract(wallet.account(), config.contractName, {
    viewMethods: ["get_games", "get_user_assets", "get_finished_games"],
    changeMethods: ["add_game", "transfer_tokens_to_winner"],
    sender: wallet.account(),
  });

  const usnContract = await initUsnContract();

  const vaule = {
    currentUser,
    contract,
    contractConfig: config,
    wallet,
    viewFunction,
    fromPrecision,
    toPrecision,
    usnContract,
  };
  return vaule;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

window.nearInitPromise = initContract().then((value) => {
  root.render(
    <ContextManager.Provider value={value}>
      <App />
    </ContextManager.Provider>
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
