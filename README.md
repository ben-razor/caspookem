# Caspookem

A spooky game on [Casper Blockchain](https://casperlabs.io/).  

<img src="https://github.com/ben-razor/caspookem/blob/main/artwork/render/game/screens/1-screenshot-demo-1.png" width="500"/>

**Video demo:** [View on YouTube](https://youtu.be/5f1jSMXxoNY)

Live App: (**No Casper Signer without whitelisting so live version is No-Casper demo mode**): [https://caspookem.web.app/](https://caspookem.web.app/)

Local App (**Token gating with Caspookie NFTs, Saving high scores with Casper Signer**):  
```
git@github.com:ben-razor/caspookem.git
cd web
npm install
npm run start
```

Built for the ReadyPlayerCasper hackathon tasks:

[Build A Single Player Game On Casper](https://gitcoin.co/issue/casper-network/ready-player-casper-gitcoin/1/100028589)  

[Build An NFT Holder-Exclusive Game On Casper](https://gitcoin.co/issue/casper-network/ready-player-casper-gitcoin/6/100028603)  


## Storyline

Virtuous ruler nCtl has protected the blockchain from harm for centuries.  
Now nCtl has been compromised by The CORS.  
The blockchain is being torn apart by sweet Irish melodies.  
Only a heroic **Caspookie** can reach nCtl's mind and save the blockchain.  
Are your the chosen one?  

## Caspookie NFTs

Caspookem starts with a one room demo mode that anybody can play. To progress further in the game, the player must possess one or more Caspookies.  

A very basic NFT collection has been created. In future more variations can be added to the NFTs. The NFT changes the appearance of the character. In future different Caspookies can have different powers in the game.  

Here are some example NFTs:

![15](https://github.com/ben-razor/caspookem/blob/main/artwork/render/nft/v1/img/15.png)
![71](https://github.com/ben-razor/caspookem/blob/main/artwork/render/nft/v1/img/71.png)
![72](https://github.com/ben-razor/caspookem/blob/main/artwork/render/nft/v1/img/72.png)

## Future Work

The game is at a very early stage. Only a few rooms are implemented to demonstrate the concept.  

The story line can be integrated into the game based on the outline in the [design outline](https://github.com/ben-razor/caspookem/blob/main/nctl-vs-cors.md).  

More rooms can be added to create a multiplayer battle mode.  

## Technology

Caspookem is built on Casper Blockchain.  Caspookie NFTs can be minted and high scores can be saved on chain.  

This feature is currently only available on localhost as live deployment requires Casper Wallet whitelisting.  

Connection to blockchain nodes required a proxy server to be deployed to work around CORS restrictions. There was no indication of which network nodes are reliable so it points at a randomly chosen node. This is extremely error prone. It would be beneficial if Casper could provide some reliable nodes with CORS disabled to use for testnet development.  

