# TSNN-Service-Node

This project is building a relayer able to execute signed transactions on behalf of other parties allowing them
interacting with the blockchain without the need to have any ether.

POST request to `/execute/:personalWallet` with the following body format:

```
{
  "v":"0x1b",
  "r":"0x2a061c04485a307802d76f3e4c7fda40ec4d3390df3c6df28fd6c3165ca1fb59",
  "s":"0x5dd8b1d92512baa9ce7e49cad004a45c4bdabf8b852c99f522740f62b955a6c6",
  "from":"0x9E48c4A74D618a567CD657579B728774f35B82C5",
  "to":"0xf74694642a81a226771981cd38df9105a133c111",
  "value":"0",
  "data":"0x947aca55000000000000000000000000f938bfdc53f72cb7a4b1946969ba0cce05c902c6",
  "rewardType":"0x0000000000000000000000000000000000000000",
  "rewardAmount":"0"
}
```

where:
* personalWallet - is the addres of deployed personal wallet smart contract to which the message originator has access
* v, r, s - components of the signature of the message
* from - source address that signed the message
* to - target address if sending ether, or token contract address for token transfer
* value - amount of ether to send
* data - function payload like token transfer data or any other function call
* rewardType - address(0) for ether, and token contract address for tokens payable as fee
* rewardAmount - how much of ether/token should be paid as the fee
