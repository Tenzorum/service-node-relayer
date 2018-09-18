const Web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');
const Tx = require('ethereumjs-tx');
const BN = require('bn.js');

const app = express();
app.use(bodyParser.json());

//ropsten
const web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/{add-your-infura-code-here}}'));

const publicAddress = '';
const privateKey = Buffer.from('', 'hex');

const ABI = [{"constant":false,"inputs":[{"name":"account","type":"address"}],"name":"addActionAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"}],"name":"addMasterAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_v","type":"uint8"},{"name":"_r","type":"bytes32"},{"name":"_s","type":"bytes32"},{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"},{"name":"_rewardType","type":"address"},{"name":"_rewardAmount","type":"uint256"}],"name":"execute","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"}],"name":"removeAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"inputs":[{"name":"masterAccount","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"canLogIn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"isActionAccount","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"isMasterAccount","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"nonces","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"roles","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"}];

const rewardTypeEther = "0x0000000000000000000000000000000000000000";

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
    }, [input.v, input.r, input.s, input.from, input.to, input.value, input.data, input.rewardType, input.rewardType]);

    return encoded;
}

const executeCall = async function(personalWallet, payload) {
    //check if from is master account
    //let personalWallet = new web3.eth.Contract(ABI, req.params.personalWallet);
    //TODO: check gas estimates
    const gasLimit = web3.utils.toHex("211000");
    const gasPrice = web3.utils.toHex(web3.utils.toWei("10","gwei"));
    const nonce = web3.utils.toHex(await web3.eth.getTransactionCount(publicAddress));

    //prepare data object
    let data = prepareData(payload);

    // console.log("data", data);

    let rawTx = {
        nonce: nonce,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        to: personalWallet,
        value: '0x00',
        data: data
    }

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

}

var validateCall = function() {
    //TODO
}

var quoteInTokens = async function(tokenAddress, valueInEther) {
    //this function should check the price of the token and return an amount
    // for the corresponding value in ether
    //need to query some exchange or feed internal price
}

var quote = async function(personalWallet, payload) {
    let walletInstance = new web3.eth.Contract(ABI, personalWallet);
    let gasEstimate = await walletInstance.methods.execute(
        payload.v, payload.r, payload.s,
        payload.from, payload.to,
        payload.value, payload.data,
        payload.rewardType, payload.rewardType
    ).estimateGas({from: payload.from});
    console.log("gasEstimate", gasEstimate);
    gasEstimate = new BN(gasEstimate);
    let gasPrice = new BN(await web3.eth.getGasPrice());
    console.log(gasEstimate.toString(10), BN.isBN(gasEstimate));
    console.log(gasPrice.toString(10), BN.isBN(gasPrice));

    let quoteInEther = gasEstimate.mul(gasPrice);//gasEstimate*standardGasPrice + 20%;
    console.log("quoteInEther", quoteInEther.toString(10));
    if(payload.rewardType === rewardTypeEther) {
        return quoteInEther.toString(10);
    }
    return quoteInTokens(payload.rewardType, quoteInEther);
    //maybe also give a quote number and TTL for this quote
    //like quote number and the number signed
    //if quote number is then provided it can be checked
    //and must be honoured
}

app.post('/execute/:personalWallet', async (req, res) => {
    let hash = await executeCall(req.params.personalWallet, req.body);
    //res.status(202);
    //res.set('Content-Type', 'application/json');
    console.log("returning: " + hash);
    //res.end('{"txHash": "' + hash + '"}');
    res.json({txHash: hash});
})

app.post('/quote/:personalWallet', async (req, res) => {
    let q = await quote(req.params.personalWallet, req.body);
    res.status(200);
    res.set('Content-Type', 'application/json');
    let response = {};
    console.log("q", q);
    //response.quote = q;
    res.end(q);
})

let server = app.listen(80, function () {
    console.log("Example app listening at port 80");
})
