import * as nearApi from "near-api-js";
import { PublicKey } from "near-api-js/lib/utils";

export const createTransaction = async (
  receiverId,
  wallet,
  actions,
  nonceOffset = 1
) => {
  const account = wallet.account();
  const connection = wallet.account().connection;

  const localKey = await connection.signer.getPublicKey(
    account.accountId,
    connection.networkId
  );

  const accessKey = await account.accessKeyForTransaction(
    receiverId,
    actions,
    localKey
  );

  if (!accessKey) {
    throw new Error(
      `Cannot find matching key for transaction sent to ${receiverId}`
    );
  }

  const block = await connection.provider.block({ finality: "final" });
  const blockHash = nearApi.utils.serialize.base_decode(block.header.hash);

  const publicKey = PublicKey.from(accessKey.public_key);
  const nonce = accessKey.access_key.nonce + nonceOffset;
  
  return nearApi.transactions.createTransaction(
    account.accountId,
    publicKey,
    receiverId,
    nonce,
    actions,
    blockHash
  );
};

export const actionsToTransaction = async (receiverId, wallet, actions) => {
  return await createTransaction(
    receiverId,
    wallet,
    actions.map((action) =>
      nearApi.transactions.functionCall(
        action.methodName,
        action.args,
        action.gas,
        action.deposit
      )
    )
  );
};
