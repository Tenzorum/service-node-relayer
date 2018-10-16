const Web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');
const Tx = require('ethereumjs-tx');
const ethUtils = require('ethereumjs-util');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const privKey = new Buffer('cf06f0b35515af10b5dfef470e3a1e743470bf9033d06f198b4e829cb2e7ef05', 'hex');
const pubKey = "0x37386A1c592Ad2f1CafFdc929805aF78C71b1CE7";

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER));
const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'hex');
const publicAddress = ethUtils.bufferToHex(ethUtils.privateToAddress(privateKey));
const PORT = 8080;
const HOST = '0.0.0.0';

const factoryAbi = [{"anonymous":false,"inputs":[],"name":"DomainTransfersLocked","type":"event"},{"constant":false,"inputs":[],"name":"lockDomainOwnershipTransfers","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_subdomain","type":"string"},{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"},{"name":"_owner","type":"address"},{"name":"_target","type":"address"}],"name":"newSubdomain","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousRegistry","type":"address"},{"indexed":true,"name":"newRegistry","type":"address"}],"name":"RegistryUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"creator","type":"address"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"subdomain","type":"string"},{"indexed":false,"name":"domain","type":"string"},{"indexed":false,"name":"topdomain","type":"string"}],"name":"SubdomainCreated","type":"event"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"transferContractOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousResolver","type":"address"},{"indexed":true,"name":"newResolver","type":"address"}],"name":"ResolverUpdated","type":"event"},{"constant":false,"inputs":[{"name":"_node","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"transferDomainOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_registry","type":"address"}],"name":"updateRegistry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_resolver","type":"address"}],"name":"updateResolver","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_registry","type":"address"},{"name":"_resolver","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"}],"name":"domainOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"locked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registry","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_subdomain","type":"string"},{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"}],"name":"subdomainOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_subdomain","type":"string"},{"name":"_domain","type":"string"},{"name":"_topdomain","type":"string"}],"name":"subdomainTarget","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
// const factoryAddress = "0xe47405AF3c470e91a02BFC46921C3632776F9C6b"; //mainnet
const factoryAddress = "0x62d6C93DF120FCa09a08258f3a644B5059aa12f0"; //ropsten

const personalWallet = require('./contracts/PersonalWallet.json');
let contract = new web3.eth.Contract(personalWallet.abi);
const factoryContract = new web3.eth.Contract(factoryAbi, factoryAddress);


function prepareData(input) {
    let encoded = web3.eth.abi.encodeFunctionCall({
        name: 'execute',
        type: 'function',
        inputs: [{
            type: 'uint8',
            name: 'v'
        },{
            type: 'bytes32',
            name: 'r'
        },{
            type: 'bytes32',
            name: 's'
        },{
            type: 'address',
            name: 'from'
        },{
            type: 'address',
            name: 'to'
        },{
            type: 'uint256',
            name: 'value'
        },{
            type: 'bytes',
            name: 'data'
        },{
            type: 'address',
            name: 'rewardType'
        },{
            type: 'uint256',
            name: 'rewardAmount'
        }]
    }, [input.v, input.r, input.s, input.from, input.to, input.value, input.data, input.rewardType, input.rewardAmount]);

    return encoded;
}

const _registerENS = async (ensName, address) => {

  const data = await factoryContract.methods.newSubdomain(ensName, 'tenz-id', 'xyz', address, "0x37386A1c592Ad2f1CafFdc929805aF78C71b1CE7",).encodeABI();
  const nonce = await web3.eth.getTransactionCount(pubKey);
  const chainId = await web3.eth.net.getId();
  const rawTx = {
    "nonce": nonce,
    "from": pubKey,
    "to": address,
    "gas": 40000,
    "gasPrice": 500000000000, // converts the gwei price to wei
    "chainId": chainId,
    "data": data
  };
  const tx = new Tx(rawTx);
  tx.sign(privKey);
  const serializedTx = tx.serialize();
  web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('transactionHash', (txHash) => {
      console.log('Subdomain transferred:' , txHash);
    })
    .on('confirmation', (conf, msg) => {
      //after account gets money
      if (conf === 0) {
        console.log('& Confirmed:' , conf);
      }
    })
}

const executeCall = async function(personalWallet, payload) {
    //check if from is master account
    //let personalWallet = new web3.eth.Contract(ABI, req.params.personalWallet);
    //TODO: check gas estimates
    const gasLimit = web3.utils.toHex("211000");
    const gasPrice = web3.utils.toHex(web3.utils.toWei("10","gwei"));
    const nonce = web3.utils.toHex(await web3.eth.getTransactionCount(publicAddress));

    let data = prepareData(payload);

    let rawTx = {
        nonce: nonce,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        to: personalWallet,
        value: '0x00',
        data: data
    };

    let tx = new Tx(rawTx);
    tx.sign(privateKey);
    let serializedTx = tx.serialize();

    let txPromise = new Promise(function(resolve, reject){
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .once('transactionHash', function(hash){
                console.log("hash", hash);
                resolve(hash);
            })
            .once('receipt', function(receipt){
                console.log(['transferToStaging Receipt:', receipt]);
            })
            .on('error', function(err) {
                console.log("err", err);
                reject(err);
            });
    });
    return txPromise;
};

app.post('/execute/:personalWallet', async (req, res) => {
    let hash = await executeCall(req.params.personalWallet, req.body);
    res.status(202);
    console.log("returning: " + hash);
    res.json({txHash: hash});
});

app.get('/deploy/:address/:ensName', async (req, res) => {
  console.log('ADDRESS: ', req.params.address)
  console.log('ENS_NAME: ', req.params.ensName)
  let txObject = {};
  try {
    const receipt = await contract.deploy({
      data: personalWallet.bytecode, arguments: [req.params.address]
    }).encodeABI();
    const nonce = await web3.eth.getTransactionCount(pubKey);
    const data = receipt || '';
    const chainId = await web3.eth.net.getId();
    const rawTx = {
      nonce: nonce,
      from: pubKey,
      gasPrice: 20000000000,
      gasLimit: 3000000,
      data,
      chainId,
    };

    const tx = new Tx(rawTx);
    tx.sign(privKey);
    const serializedTx = tx.serialize();
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('transactionHash', (txHash) => {
        console.log('TransactionHash:' , txHash);
        txObject.transactionHash = txHash;
      })
      .on('receipt', (rec) => {
        console.log('Receipt:' , rec);
        console.log('Receipt CA:' , rec.contractAddress);
        txObject.contractAddress = rec.contractAddress;
        _registerENS(req.params.ensName, rec.contractAddress);
        res.status(200);
        res.json({res: JSON.stringify(txObject)});
      })

  } catch(e) {
    console.log("ERROR: ", e)
  }
})

//test enpoint
app.get('/ping', async (req, res) => {
    res.status(200);
    res.json({res: 'pong'});
});

app.listen(PORT, HOST, function () {
    console.log(`TSN is up and running using account: ${publicAddress} and web3 provider: ${process.env.WEB3_PROVIDER}...`);
});
