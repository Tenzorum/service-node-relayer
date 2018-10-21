const Web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');
const Tx = require('ethereumjs-tx');
const ethUtils = require('ethereumjs-util');
const cors = require('cors')
const app = express();
app.use(bodyParser.json());
app.use(cors());

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER));
const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'hex');
const publicAddress = ethUtils.bufferToHex(ethUtils.privateToAddress(privateKey));
const PORT = 8080;
const HOST = '0.0.0.0';

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

const executeCall = async function(personalWallet, payload) {
    //check if from is master account
    //let personalWallet = new web3.eth.Contract(ABI, req.params.personalWallet);
    //TODO: check gas estimates
    const gasLimit = web3.utils.toHex("211000");
    const gasPrice = web3.utils.toHex(web3.utils.toWei("15","gwei"));
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

//test enpoint
app.get('/ping', async (req, res) => {
    res.status(200);
    res.json({res: 'pong'});
});

app.listen(PORT, HOST, function () {
    console.log(`TSN is up and running using account: ${publicAddress} and web3 provider: ${process.env.WEB3_PROVIDER}...`);
});
