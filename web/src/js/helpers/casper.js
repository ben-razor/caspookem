import { CasperClient, CasperServiceByJsonRPC, CLPublicKey, DeployUtil } from "casper-js-sdk";
import {
  Contracts, Keys, RuntimeArgs, CLValueBuilder
} from 'casper-js-sdk';

const { Contract, toCLMap, fromCLMap } = Contracts;

export function csprToMote(cspr) {
  return cspr * 1e9;
}

const PAYMENT_COUNTER_INC = csprToMote(0.1);

//Create Casper client and service to interact with Casper node.
const apiUrl = "http://localhost:7777/rpc/";
const casperService = new CasperServiceByJsonRPC(apiUrl);
const casperClient = new CasperClient(apiUrl);
const contractClient = new Contract(casperClient);
const contractHighScore = new Contract(casperClient);
const NETWORK_NAME = 'casper-test';
let getDeployInterval = 0;

const CONTRACT_WASM_HASH = 'hash-6db37be05d9f42c7fdb4cdf146aec26562ba88bbfc918cbd5d4798fa76464eed';
const CONTRACT_HIGH_SCORE = 'hash-6b37fbcbf02a66d5a2f893f479044df33c28abc0c1895f763f258dfe8b78f45b';

contractClient.setContractHash(CONTRACT_WASM_HASH);
contractHighScore.setContractHash(CONTRACT_HIGH_SCORE);

async function counter_get() {
  return contractClient.queryContractData(['count']);
}

async function counter_inc(publicKeyHex, networkName, paymentAmount) {
  const runtimeArgs = RuntimeArgs.fromMap({ });

  const publicKey = CLPublicKey.fromHex(publicKeyHex);

  let result = contractClient.callEntrypoint(
    'counter_inc',
    runtimeArgs,
    publicKey,
    networkName,
    paymentAmount,
  );

  console.log(JSON.stringify(['res', result]));
  
  const deployJSON = DeployUtil.deployToJson(result);

  let sig = await window.casperlabsHelper.sign(deployJSON, publicKeyHex);
  try {
    await sendDeploy(sig);
  }
  catch(e) {
    console.log(JSON.stringify(['send deploy failed', e]));
  }
}

export async function getHighScore(publicKeyHex) {
  let publicKey = CLPublicKey.fromHex(publicKeyHex);
  let accountHash = publicKey.toAccountHashStr().substring(13); // Remove account-hash- from the account hash str
  let response = await contractHighScore.queryContractDictionary("highscore_dictionary", accountHash);
  console.log(JSON.stringify(['getHighScore', response]));
  return response?.data?.toString();
}

export async function addHighScore(score, publicKeyHex, networkName, paymentAmount) {
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
  try {
    await sendDeploy(sig);
  }
  catch(e) {
    console.log(JSON.stringify(['send deploy failed', e]));
  }
}

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
    // Sign transcation using casper-signer.
    const deployObject = DeployUtil.deployFromJson(sig);

    // Here we are sending the signed deploy.
    const deploy = await casperClient.putDeploy(deployObject.val);
  
    try {
      console.log(JSON.stringify(['tx deployed', deploy]));
      initiateGetDeployProcedure(deploy); 
    }
    catch(e) {
      console.log(JSON.stringify(['igdp', e]));
    }
}

export async function requestCounterGet() {
  let res = await counter_get();
  return res.toString();
}

function initiateGetDeployProcedure(hash) {
  getDeploy(hash);
  getDeployInterval = setInterval(() => { //We call this every 5 seconds to check on the status of the deploy
    getDeploy(hash);
  }, 5000);
}

async function getDeploy(deployHash) {
  console.log(JSON.stringify(['gd', deployHash]));
  
  casperClient.getDeploy(deployHash).then((response) => {
    console.log(JSON.stringify(['gd 2', deployHash, response]));
    if (response.length === 0) { //See if there's return data yet
      console.log("No return data yet");
      return;
    }

    const resultInfo = response[1];

    if (!resultInfo?.execution_results?.length) { //If executionResults doesn't contain the result key the deployment hasn't been executed by the node
      console.log("Doesnt have result yet");
      return;
    }

    const result = resultInfo.execution_results[0].result; //Get the result
    console.log(response);

    if (result && result.hasOwnProperty("Success")) { //Deployment succeeded!
      (async () => {
        let res = await requestCounterGet();
        console.log(JSON.stringify(['counter', res]));
      })();
      console.log("Execution Successful");
    } else if (result.hasOwnProperty("Failure")) {
      console.log("Execution Failure");
    } else {
      console.log("Unknown Error");
    }
    clearInterval(getDeployInterval); //Stop polling getDeploy

  }).catch((error) => {
    console.log(JSON.stringify(['getDeployError', error]));
    clearInterval(getDeployInterval); //Stop polling getDeploy
  });
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

export async function requestCounterInc() {
  try {
    let res = await casperAttemptConnect();
    
    if(res.success) {
      await counter_inc(res.data.activePublicKey, NETWORK_NAME, PAYMENT_COUNTER_INC);
    }
    else {
      console.log(res.reason);
    }
  }
  catch(e) {
    console.log('Error', e);
  }
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