// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import assert from "assert";
import fs from "fs";
import { NODE_URL, FAUCET_URL, accountBalance } from "./first_transaction";
import { AptosAccountObject, AptosAccount, TxnBuilderTypes, BCS, MaybeHexString, HexString, AptosClient, FaucetClient } from "aptos";

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const Sleep = (ms: number)=> {
  return new Promise(resolve=>setTimeout(resolve, ms))
}

const aptosAccountObject: AptosAccountObject = {
  address: "0x173d51b1d50614b03d0c18ffcd958309042a9c0579b6b21fc9efeb48cdf6e0b0",
  privateKeyHex:
    // eslint-disable-next-line max-len
    "0x01D4B8E9481CDF71916B7A384D46D0E208BA5221D1527DE21F62FCCD9DB6E688",
  publicKeyHex: "0x3831D6691A96CBD298C2F0DC713AD79F56DE452DAD06982D890D33AB907B66D1",
};

//:!:>section_1
const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

/** Publish a new module to the blockchain within the specified account */
export async function publishModule(accountFrom: AptosAccount, moduleHex: string): Promise<string> {
  const moudleBundlePayload = new TxnBuilderTypes.TransactionPayloadModuleBundle(
    new TxnBuilderTypes.ModuleBundle([new TxnBuilderTypes.Module(new HexString(moduleHex).toUint8Array())]),
  );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(accountFrom.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(accountFrom.address()),
    BigInt(sequenceNumber),
    moudleBundlePayload,
    1000n,
    1n,
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );

  const bcsTxn = AptosClient.generateBCSTransaction(accountFrom, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  return transactionRes.hash;
}

//<:!:section_1
//:!:>section_2
/** Retrieve the resource MyCounter::Counter::value */
async function getCounter(contractAddress: string, accountAddress: MaybeHexString): Promise<string> {
  try {
    const resource = await client.getAccountResource(
      accountAddress.toString(),
      `${contractAddress}::MyCounter::Counter`,
    );

    return (resource as any).data["value"];
  } catch (_) {
    return "";
  }
}

//<:!:section_2
//:!:>section_3
/**  Potentially initialize and set the resource Message::MessageHolder::message */
async function initCounter(contractAddress: string, accountFrom: AptosAccount): Promise<string> {
  const scriptFunctionPayload = new TxnBuilderTypes.TransactionPayloadScriptFunction(
    TxnBuilderTypes.ScriptFunction.natural(
      `${contractAddress}::MyCounter`,
      "init_counter",
      [],
      [],
    ),
  );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(accountFrom.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(accountFrom.address()),
    BigInt(sequenceNumber),
    scriptFunctionPayload,
    1000n,
    1n,
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );

  const bcsTxn = AptosClient.generateBCSTransaction(accountFrom, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  return transactionRes.hash;
}


//<:!:section_2
//:!:>section_3
/**  Potentially initialize and set the resource Message::MessageHolder::message */
async function incrCounter(contractAddress: string, accountFrom: AptosAccount): Promise<string> {
  const scriptFunctionPayload = new TxnBuilderTypes.TransactionPayloadScriptFunction(
    TxnBuilderTypes.ScriptFunction.natural(
      `${contractAddress}::MyCounter`,
      "incr_counter",
      [],
      [],
    ),
  );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(accountFrom.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(accountFrom.address()),
    BigInt(sequenceNumber),
    scriptFunctionPayload,
    1000n,
    1n,
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );

  const bcsTxn = AptosClient.generateBCSTransaction(accountFrom, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  return transactionRes.hash;
}


//<:!:section_3

/** run our demo! */
async function main() {

  assert(process.argv.length == 3, "Expecting an argument that points to the helloblockchain module");

  // Create two accounts, Alice and Bob, and fund Alice but not Bob
  // const alice = new AptosAccount();
  const contractAddress = "0x173d51b1d50614b03d0c18ffcd958309042a9c0579b6b21fc9efeb48cdf6e0b0";
  const bob = AptosAccount.fromAptosAccountObject(aptosAccountObject);
  // const bob = new AptosAccount();

  console.log("\n=== Addresses ===");
  console.log(`Bob: ${bob.address()}`);

  await faucetClient.fundAccount(bob.address(), 5_000);

  console.log("\n=== Initial Balances ===");
  
  console.log(`Bob: ${await accountBalance(bob.address())}`);

  await new Promise<void>((resolve) => {
    readline.question(
      "Update the module with Alice's address, build, copy to the provided path, and press enter.",
      () => {
        resolve();
        readline.close();
      },
    );
  });
  const modulePath = process.argv[2];
  const moduleHex = fs.readFileSync(modulePath).toString("hex");



  console.log('Init Counter Moudle.');
  let txHash = await initCounter(contractAddress, bob);
  await client.waitForTransaction(txHash);
  console.log("\n=== Testing Bob Get Counter Value ===");

  console.log(`Initial value: ${await getCounter(contractAddress, bob.address())}`);
  console.log('========== Incr Counter Value, 1th ==========');
  txHash = await incrCounter(contractAddress, bob);
  console.log(txHash);
  await client.waitForTransaction(txHash);
  await Sleep(100);
  console.log(`New value: ${await getCounter(contractAddress, bob.address())}`);


  console.log('========== Incr Counter Value, 2th ==========');
  txHash = await incrCounter(contractAddress, bob);
  console.log(txHash);
  await client.waitForTransaction(txHash);
  await Sleep(100);
  console.log(`New value: ${await getCounter(contractAddress, bob.address())}`);


  console.log('========== Incr Counter Value, 3th ==========');
  txHash = await incrCounter(contractAddress, bob);
  console.log(txHash);
  await client.waitForTransaction(txHash);
  await Sleep(100);
  console.log(`New value: ${await getCounter(contractAddress, bob.address())}`);


  // assert(process.argv.length == 3, "Expecting an argument that points to the helloblockchain module");

  // // Create two accounts, Alice and Bob, and fund Alice but not Bob
  // const alice = new AptosAccount();
  // const bob = new AptosAccount();

  // console.log("\n=== Addresses ===");
  // console.log(`Alice: ${alice.address()}`);
  // console.log(`Bob: ${bob.address()}`);

  // await faucetClient.fundAccount(alice.address(), 5_000);
  // await faucetClient.fundAccount(bob.address(), 5_000);

  // console.log("\n=== Initial Balances ===");
  // console.log(`Alice: ${await accountBalance(alice.address())}`);
  // console.log(`Bob: ${await accountBalance(bob.address())}`);

  // await new Promise<void>((resolve) => {
  //   readline.question(
  //     "Update the module with Alice's address, build, copy to the provided path, and press enter.",
  //     () => {
  //       resolve();
  //       readline.close();
  //     },
  //   );
  // });
  // const modulePath = process.argv[2];
  // const moduleHex = fs.readFileSync(modulePath).toString("hex");

  // console.log("\n=== Testing Alice ===");
  // console.log("Publishing...");

  // let txHash = await publishModule(alice, moduleHex);
  // await client.waitForTransaction(txHash);



  // console.log('Init Counter Moudle.');
  // txHash = await initCounter(alice.address(), alice);
  // await client.waitForTransaction(txHash);

  // console.log(`Initial value: ${await getCounter(alice.address(), alice.address())}`);

  // console.log("\n=== Testing Bob Get Counter Value ===");
  // console.log(`Initial value: ${await getCounter(alice.address(), bob.address())}`);
  // console.log('Incr Counter Value!!!!!!');
  // txHash = await incrCounter(alice.address(), bob, );
  // await client.waitForTransaction(txHash);
  // console.log(`New value: ${await getCounter(alice.address(), bob.address())}`);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
