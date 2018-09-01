var Web3 = require('web3');
var express = require('express');
var bodyParser = require('body-parser');
var Tx = require('ethereumjs-tx');

var app = express();
app.use(bodyParser.json());

//ropsten
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/vCE9q890Is08T4xq5qKm'));

var publicAddress = '0x3A64B72aa106a55b2F012620f89086C2DFC68673';
var privateKey = Buffer.from('095a72e243de4d89142eb2596127674588e17b21b02fd3a0afaa5b83224fb398', 'hex');

const ABI = [{"constant":false,"inputs":[{"name":"_v","type":"uint8"},{"name":"_r","type":"bytes32"},{"name":"_s","type":"bytes32"},{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"},{"name":"_rewardType","type":"address"},{"name":"_rewardAmount","type":"uint256"}],"name":"execute","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"isActionAccount","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"nonces","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"isMasterAccount","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"roles","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"login","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"masterAccount","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"}];

//empty wallet to use:
//master key - 2e5a537948b5d4dd63f690f5a82f8591cb5c41a562c9cce850adfb29a99a8cc5
//master address - 0x9E48c4A74D618a567CD657579B728774f35B82C5
//personal wallet created at: https://ropsten.etherscan.io/address/0xd1c3d54255536cd50c88baed4972a127acc942a1

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

    console.log("encoded ", encoded);
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

    console.log("data", data);

    var rawTx = {
        nonce: nonce,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        to: personalWallet,
        value: '0x00',
        data: data
    }

    var tx = new Tx(rawTx);
    tx.sign(privateKey);
    var serializedTx = tx.serialize();

    console.log('0x' + serializedTx.toString('hex'));

    let receipt = web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));

    return receipt;
}

var validateCall = function() {
    //TODO
}

app.post('/execute/:personalWallet', async (req, res) => {
    console.log(req.params.personalWallet);
    console.log(req.body);

    let tx = await executeCall(req.params.personalWallet, req.body);

    res.status(202);
    res.set('Content-Type', 'application/json');
    res.end(tx);

})

var server = app.listen(7777, function () {
    console.log("Example app listening at http://localhost:7777");
})
