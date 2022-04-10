import { CasperClient, CasperServiceByJsonRPC, CLPublicKey, DeployUtil } from "casper-js-sdk";
import {
  Contracts, Keys, RuntimeArgs, CLValueBuilder
} from 'casper-js-sdk';
import { createSuccessInfo, createErrorInfo } from "./helpers";
import { CEP47Client, CEP47Events, CEP47EventParser } from "./cep47.ts";

const { Contract, toCLMap, fromCLMap } = Contracts;

export function csprToMote(cspr) {
  return cspr * 1e9;
}

const PAYMENT_COUNTER_INC = csprToMote(0.1);
const MINT_ONE_PAYMENT_AMOUNT=2000000000; 
const NETWORK_NAME = 'casper-test';

const CONTRACT_WASM_HASH = 'hash-6db37be05d9f42c7fdb4cdf146aec26562ba88bbfc918cbd5d4798fa76464eed';
const CONTRACT_HIGH_SCORE = 'hash-6b37fbcbf02a66d5a2f893f479044df33c28abc0c1895f763f258dfe8b78f45b';
const CONTRACT_NFT_PRA = 'hash-09766a2ccc20f5a4a24442bf5ef83a58f7a145593e78c84437f91e906873a2a7';
const CONTRACT_CASPOOKIES001 = 'hash-b0fecb42a40e963f40b53a7081d0865624b5a052ab91f4d97271a23303af66f4';

//Create Casper client and service to interact with Casper node.
const apiUrl = "http://localhost:7777/rpc/";
const casperService = new CasperServiceByJsonRPC(apiUrl);
const casperClient = new CasperClient(apiUrl);
const contractClient = new Contract(casperClient);
const contractHighScore = new Contract(casperClient);
const contractNFT = new Contract(casperClient);

contractClient.setContractHash(CONTRACT_WASM_HASH);
contractHighScore.setContractHash(CONTRACT_HIGH_SCORE);
contractNFT.setContractHash(CONTRACT_NFT_PRA);

const cep47 = new CEP47Client(apiUrl, NETWORK_NAME);
cep47.setContractHash(CONTRACT_NFT_PRA);

const cep47Cas = new CEP47Client(apiUrl, NETWORK_NAME);
cep47Cas.setContractHash(CONTRACT_CASPOOKIES001);

async function counter_get() {
  return contractClient.queryContractData(['count']);
}

export async function getHighScore(publicKeyHex) {
  let res = createSuccessInfo();
  let publicKey = CLPublicKey.fromHex(publicKeyHex);
  let accountHash = publicKey.toAccountHashStr().substring(13); // Remove account-hash- from the account hash str
  try {
    let response = await contractHighScore.queryContractDictionary("highscore_dictionary", accountHash); 
    res.data.highScore = response?.data?.toString();
    console.log(JSON.stringify(['casper getHighScore', response]));
  }
  catch(e) {
    res = createErrorInfo('error_reading_highscore', { error: e });
  }

  return res;
}

export async function addHighScore(score, publicKeyHex, networkName, paymentAmount) {
  let res = createSuccessInfo();

  try {
    const runtimeArgs = RuntimeArgs.fromMap({ 'score': CLValueBuilder.u512(score) });

    const publicKey = CLPublicKey.fromHex(publicKeyHex);

    let result = contractHighScore.callEntrypoint(
      'add_highscore',
      runtimeArgs,
      publicKey,
      networkName,
      paymentAmount,
    );

    console.log(JSON.stringify(['res', result]));
    
    const deployJSON = DeployUtil.deployToJson(result);
    let sig = await window.casperlabsHelper.sign(deployJSON, publicKeyHex);
    res = await sendDeploy(sig);
  }
  catch(e) {
    console.log(JSON.stringify(['send deploy failed', e]));
    res = createErrorInfo('error_sending_tx', { error: e })
  }

  return res;
}

export async function getNFTName() {
  let name = 'error';
  try {
    name = await cep47.name();
    name = await contractNFT.queryContractData(['owners']);
  }
  catch(e) {
    console.log(JSON.stringify(['nft name error', e]));
  }
  return name;
}

export async function getNFTsForAccount(publicKeyHex) {
  let tokens = [];

  try {
    let publicKey = CLPublicKey.fromHex(publicKeyHex);
    let balanceOf = await cep47.balanceOf(publicKey);
    for(let i = 0; i < balanceOf; i++) {
      let token = await cep47.getTokenByIndex(publicKey, i);
      let meta = await cep47.getTokenMeta(token);
      let color = '0x000000';
      meta.forEach((v, k) => {
        console.log(JSON.stringify(['tokmeta', token, v, k]));

        if(k === 'color') {
          color = v;
        }
      });
      
      tokens.push({token, color});
    }
  }
  catch(e) {
    console.log(JSON.stringify(['nfts for account error', e]));
  }

  return tokens;
}

export async function getCaspookiesForAccount(publicKeyHex) {
  let tokens = [];

  try {
    let publicKey = CLPublicKey.fromHex(publicKeyHex);
    let balanceOf = await cep47Cas.balanceOf(publicKey);
    for(let i = 0; i < balanceOf; i++) {
      let token = await cep47Cas.getTokenByIndex(publicKey, i);
      let meta = await cep47Cas.getTokenMeta(token);
      let metaMap = {};

      meta.forEach((v, k) => {
        metaMap[k] = v;
        console.log(JSON.stringify(['tokmeta', token, v, k]));
      });
      
      tokens.push({token, metaMap});
    }
  }
  catch(e) {
    console.log(JSON.stringify(['nfts for account error', e]));
  }

  return tokens;
}

export async function mintNFT(publicKeyHex) {
  let publicKey = CLPublicKey.fromHex(publicKeyHex);
  const result = await cep47.mint(
    publicKey,
    ["19"],
    [new Map([['color', '#00ff00']])],
    MINT_ONE_PAYMENT_AMOUNT,
    publicKey 
  );

  const deployJSON = DeployUtil.deployToJson(result);
  let sig = await window.casperlabsHelper.sign(deployJSON, publicKeyHex);
  let res = await sendDeploy(sig);
  return res;
}

export async function mintCaspookie(publicKeyHex) {

  let res = createSuccessInfo();

  try {
    let publicKey = CLPublicKey.fromHex(publicKeyHex);

    const result = await cep47Cas.simpleMint(publicKey, MINT_ONE_PAYMENT_AMOUNT, publicKey);

    const deployJSON = DeployUtil.deployToJson(result);
    let sig = await window.casperlabsHelper.sign(deployJSON, publicKeyHex);
    res = await sendDeploy(sig);
  }
  catch(e) {
    console.log(JSON.stringify(['mint caspookie failed', e]));
    res = createErrorInfo('error_sending_tx', { error: e })
  }

  return res;
}

export async function listNFTs(publicKeyHex) {
  let res = createSuccessInfo();
  let publicKey = CLPublicKey.fromHex(publicKeyHex);
  let accountHash = publicKey.toAccountHashStr().substring(13); // Remove account-hash- from the account hash str
  try {
    let response = await contractHighScore.queryContractDictionary("highscore_dictionary", accountHash); 
    res.data.highScore = response?.data?.toString();
    console.log(JSON.stringify(['casper getHighScore', response]));
  }
  catch(e) {
    res = createErrorInfo('error_reading_highscore', { error: e });
  }

  return res;
}

/*
export async function mintNFT(name, publicKeyHex, networkName, paymentAmount) {
  let res = createSuccessInfo();

  try {
    const runtimeArgs = RuntimeArgs.fromMap({ 'name': CLValueBuilder.string(name) });

    const publicKey = CLPublicKey.fromHex(publicKeyHex);

    let result = contractNFT.callEntrypoint(
      'mint',
      runtimeArgs,
      publicKey,
      networkName,
      paymentAmount,
    );

    const deployJSON = DeployUtil.deployToJson(result);
    let sig = await window.casperlabsHelper.sign(deployJSON, publicKeyHex);
    res = await sendDeploy(sig);
  }
  catch(e) {
    console.log(JSON.stringify(['send deploy failed', e]));
    res = createErrorInfo('error_sending_tx', { error: e })
  }

  return res;
}
*/

export async function requestAddHighScore(score) {
  try {
    let res = await casperAttemptConnect();
    
    if(res.success) {
      await addHighScore(score, res.data.activePublicKey, NETWORK_NAME, PAYMENT_COUNTER_INC);
    }
    else {
      console.log(res.reason);
    }
  }
  catch(e) {
    console.log('Error', e);
  }
}

async function sendDeploy(sig) {
  let success = true;
  let reason = 'ok';
  let data = {};

  try {
    // Sign transcation using casper-signer.
    const deployObject = DeployUtil.deployFromJson(sig);

    // Here we are sending the signed deploy.
    const deploy = await casperClient.putDeploy(deployObject.val);

    console.log(JSON.stringify(['tx deployed', deploy]));
    data.deploy = deploy;
  }
  catch(e) {
    success = false;
    reason = 'error_deploy'
    data.error = e;
  }

  return { success, reason, data }
}

export async function requestCounterGet() {
  let res = await counter_get();
  return res.toString();
}

export async function getDeploy(deployHash) {
  let res = createErrorInfo();

  console.log(JSON.stringify(['gd', deployHash]));
  
  try {
    let response = await casperClient.getDeploy(deployHash);

    if (response.length === 0) { 
      res.reason = 'error_deploy_no_return_data'
    }
    else {
      const resultInfo = response[1];

      if (!resultInfo?.execution_results?.length) { //If executionResults doesn't contain the result key the deployment hasn't been executed by the node
        console.log("Doesnt have result yet");
        res.reason = 'error_deploy_no_result_yet';
      }
      else {
        const result = resultInfo.execution_results[0].result;
        res.data = result;

        if (result && result.hasOwnProperty("Success")) { //Deployment succeeded!
          res.success = true;
          res.reason = 'ok';
          console.log("Execution Successful");
        } else if (result.hasOwnProperty("Failure")) {
          res.reason = 'error_deploy_failure';
        } else {
          res.reason = 'error_deploy_failure';
        }
      }
    }
  } catch(e) {
    res.reason = 'error_deploy_failure';
    res.data.error = e;
  };

  return res;
}

export async function requestAccountInfo() {
    window.casperlabsHelper.requestConnection();
    await AccountInformation();
}

export async function casperAttemptConnect() {
  let success = false;
  let reason = 'error_no_casper_signer';
  let activePublicKey;
  
  if(window.casperlabsHelper) {
    try {
      activePublicKey = await window.casperlabsHelper.getActivePublicKey();

      if(activePublicKey) {
        success = true;
        reason = 'ok';
      }
    }
    catch(e) { 
      reason = 'error_casper_signer_no_account';
    }
    
    if(!activePublicKey) {
      await window.casperlabsHelper.requestConnection();

    }

    if(!activePublicKey) {
      reason = 'error_casper_signer_no_account';
    }
  }

  return { success, reason, data: { activePublicKey } }
}

async function AccountInformation() {
  const isConnected = await window.casperlabsHelper.isConnected();
  if (isConnected) {
      const publicKey = await window.casperlabsHelper.getActivePublicKey();

      const latestBlock = await casperService.getLatestBlockInfo();
      const root = await casperService.getStateRootHash(latestBlock.block.hash);

      const balanceUref = await casperService.getAccountBalanceUrefByPublicKey(root, CLPublicKey.fromHex(publicKey));

      //account balance from the last block
      const balance = await casperService.getAccountBalance(latestBlock.block.header.state_root_hash, balanceUref);

      let res = await counter_get();
      console.log(['Counter', res]);
  }
}

async function sendTransaction() {
  
  // get address to send from input.
  const to = document.getElementById("Recipient").value;
  // get amount to send from input.
  const amount = document.getElementById("Amount").value;
  // For native-transfers the payment price is fixed.
  const paymentAmount = 10000000000;

  // transfer_id field in the request to tag the transaction and to correlate it to your back-end storage.
  const id = 287821;

  // gasPrice for native transfers can be set to 1.
  const gasPrice = 1;

  // Time that the deploy will remain valid for, in milliseconds
  // The default value is 1800000 ms (30 minutes).
  const ttl = 1800000;
  const publicKeyHex = await window.casperlabsHelper.getActivePublicKey();
  const publicKey = CLPublicKey.fromHex(publicKeyHex);

  let deployParams = new DeployUtil.DeployParams(publicKey, "casper-test", gasPrice, ttl);

  // We create a public key from account-address (it is the hex representation of the public-key with an added prefix).
  const toPublicKey = CLPublicKey.fromHex(to);

  const session = DeployUtil.ExecutableDeployItem.newTransfer(amount, toPublicKey, null, id);

  const payment = DeployUtil.standardPayment(paymentAmount);
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

  // Turn your transaction data to format JSON
  const json = DeployUtil.deployToJson(deploy);

  // Sign transcation using casper-signer.
  const signature = await window.casperlabsHelper.sign(json, publicKeyHex, to);
  const deployObject = DeployUtil.deployFromJson(signature);

  // Here we are sending the signed deploy.
  const signed = await casperClient.putDeploy(deployObject.val);

  // Display transaction address
  const tx = document.getElementById("tx");
  tx.textContent = `tx: ${signed}`;
}

export async function getAccountInfo(publicKeyHex) {
  let publicKey = CLPublicKey.fromHex(publicKeyHex);
  const stateRootHash = await casperService.getStateRootHash();
  const accountHash = publicKey.toAccountHashStr();
  const blockState = await casperService.getBlockState(stateRootHash, accountHash, []);
  return blockState.Account;
};

/**
 * Returns a value under an on-chain account's storage.
 * @param accountInfo - On-chain account's info.
 * @param namedKey - A named key associated with an on-chain account.
 */
export async function getAccountNamedKeyValue(accountInfo, namedKey) {
  const found = accountInfo.namedKeys.find(i => i.name === namedKey);
  if (found) {
    return found.key;
  }
  return undefined;
};
