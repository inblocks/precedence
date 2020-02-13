[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# What's this software for?

**_precedence_ brings secure blockchain-powered traceability features to your already existing legacy information system!**

**_precedence_** is the first open source ledger allowing non blockchain specialist to put in place a transparent, immutable, and cryptographically verifiable transaction log with a minimum effort and fully integrated to their existing database or file system.

**_precedence_** is compliant with multiple data sources:
- file system
- SQL databases
- noSQL databases
- stream processing

By connecting your data source to **_precedence_** you automatically get:
- proof-of-existence on every data connected;
- proof-of-ownership compliant with your PKI;
- automatic versioning system for every pieces of information.

All these features allow you bring secure blockchain-powered traceability features to your legacy information system.

**_precedence_** is agnostic to the data type considered and can be use to bring immutable and undeniable traceability to every data that you already operate in your information system. Your system is most likely already compliant and there is no need to apply modification to it to start using **_precedence_**.

**_precedence_** is edited by [**_inBlocks_**](https://precedence.inblocks.io) so you can rely on us for hosting the solution for you, supporting you during the deployment and providing you a very strong SLA.

In the following:
- "fingerprint" means "hexadecimal string format for the hash computed with SHA-256 algorithm";
- "obfuscated fingerprint of <VALUE>" means fingerprint of "<SEED> <VALUE>".

# Quick Start

## Prerequisites

- a [Redis](https://redis.io) version 5+ instance. If you don't have one, you can launch a container that will host a redis instance (not part of a cluster, not replicated, not scalable so not production-compliant). To do so you can run one of the following ways:

    - without persistence
    ```bash
    docker run --rm --name redis -p 6379:6379 \
        redis:alpine redis-server --appendonly no --save ""
    ```

    - with persistence, detached in background
    ```bash
    docker run -d --name redis -p 6379:6379 \
        -v $HOME/precedence-redis:/data \
        redis:alpine redis-server --appendonly yes --appendfsync always
    # remove container
    docker rm -f redis
    # remove data
    rm -rf $HOME/precedence-redis
    ```

- If you don't use [Docker](https://docs.docker.com): [Node.js](https://nodejs.org) version 10.18.1+ and [npm](https://www.npmjs.com) version 6.13.4+.

## Run the REST API

- From npm (coming soon)

- From [Docker](https://hub.docker.com/r/inblocks/precedence)
  ```bash
  # usage
  docker run --rm inblocks/precedence --help
  # run
  docker run --rm --name precedence \
      --link redis -p 9000:9000 \
      -e PRECEDENCE_PRIVATE_KEY=5962a8486b88c88d14e16a18fd1bbc0207603d84f9cd6434b477baa88da40200 \
      inblocks/precedence --redis redis:6379
  ```

- From [GitHub sources](https://github.com/inblocks/precedence)
  ```bash
  git clone https://github.com/inblocks/precedence.git
  cd precedence
  for module in api cli common core; do
      echo "$module"
      (cd "$module" && npm i)
  done
  for module in api cli; do
    (cd "$module" && npm link)
  done
  # usage
  precedence-api --help
  # run
  export PRECEDENCE_PRIVATE_KEY=5962a8486b88c88d14e16a18fd1bbc0207603d84f9cd6434b477baa88da40200
  precedence-api
  ```

# First commands

Make sure the `api` environment variable is the API endpoint you want to use.

```bash
api="http://localhost:9000"
```

## Record API calls

To create a first record you can use the following command. By default the original data is not stored in **_precedence_**, the only data-related information stored is its fingerprint.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true" -d "value 1"
```

You will find below a response example.

```json
{
  "took": 26,
  "status": 201,
  "data": {
    "provable": {
      "id": "9baf839fcc73972d21807f43a25b98d8c82b8a3f63070e8b27cddb94919404bc",
      "seed": "804fdac23d95593295a211708247385480aefc47e315e1d0d8f72d986ec62aca",
      "hash": "34c1272bbdfafadebd18f6bc3facf4713a8f1f06b12f55de259a22b3c793a3ba",
      "address": "3d7ad827af7a335b26fcceaf9e70bdbdb9f5abdc5b8af6fb6c09f74eb23d61e4",
      "signature": "7371af2bddeb9dbf18ab24bad486c301790e0d5bc6c6d623dd87352f1b63d6dd",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603111361,
    "seed": "c2cfd7589f71bd5a4236f6cabdbba9223a3523f2b126553ae266a4a8a1a0f88d",
    "hash": "65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xcc8bfb566fe89bdc2b6bfce1e35886cda7cf790492b117f12696eeb8ce5bcd3278c7c43cdfcda56e82c70064d7fd02ecbdc3c73caad0a7371136b491c8b44a201b",
    "chains": {}
  }
}
```

For sure you need some explanation about the returned JSON response:
- `took` is the number of millisecond this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the original data you provided;
  - `provable` contains the information that you will be able to prove using **_precedence_**;
    - `id` is the record identifier;
    - `seed` is the obfuscated fingerprint of the root `seed`;
    - `hash` is the obfuscated fingerprint of the root `hash`;
    - `address` is the obfuscated fingerprint of root `address`;
    - `signature` is the obfuscated fingerprint of root `signature`;
    - `chains` is the root `chains` but where keys and values are the obfuscated fingerprint of their original value;
    - `previous` is the list of the record identifiers that are directly linked to this record;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `seed` is the random data used for obfuscation;
  - `hash` is the fingerprint of the original data;
  - `address` is used for proof-of-ownership, corresponding to the public key of ECDSA key pair used to sign the root `hash`;
  - `signature` is the Ethereum signature of the root `hash`;
  - `chains` is the map of relation between a chain and its last record identifier;

We can check that:
- the fingerprint of `seed` value is equal to `provable.seed` value:
```bash
echo -n 'c2cfd7589f71bd5a4236f6cabdbba9223a3523f2b126553ae266a4a8a1a0f88d c2cfd7589f71bd5a4236f6cabdbba9223a3523f2b126553ae266a4a8a1a0f88d' | sha256sum
# -> 804fdac23d95593295a211708247385480aefc47e315e1d0d8f72d986ec62aca
```
- the obfuscated fingerprint of the hash is equal to `provable.hash` value:
```bash
echo -n "c2cfd7589f71bd5a4236f6cabdbba9223a3523f2b126553ae266a4a8a1a0f88d $(echo -n 'value 1' | sha256sum | cut -d' ' -f1)" | sha256sum
# -> 34c1272bbdfafadebd18f6bc3facf4713a8f1f06b12f55de259a22b3c793a3ba
```
- the signature is valid with [https://etherscan.io/verifySig](https://etherscan.io/verifySig):
  - [Step 1] Address: `0x4592350babefcc849943db091b6c49f8b86f8aaa`;
  - [Step 2] Message Signature Hash: `0xcc8bfb566fe89bdc2b6bfce1e35886cda7cf790492b117f12696eeb8ce5bcd3278c7c43cdfcda56e82c70064d7fd02ecbdc3c73caad0a7371136b491c8b44a201b`;
  - [Step 3] Enter the original message that was signed: `65da867639080176b5998c77219e2745474aa518a04268522467322f06fbd9d9`;
  - Verify: `Message Signature Verified`.
---

Let's create another record with the `store=true` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```

```json
{
  "took": 20,
  "status": 201,
  "data": {
    "provable": {
      "id": "379ccc9a492f599a5a58d903b9abc5f1fa8b9ab726ce4a1739913d09026d50df",
      "seed": "bf86c22cf6e6f95a2ee2331154084ec4987af07b03b7c915c4f3f391ff929a75",
      "hash": "e60eeb289466f30ddf884e2268d1a173331508ff8d9c24dcf80101efb855d1e1",
      "address": "90ed5ffab3172239924795160e9e9b51b86651d167743b6448352889aa4b72bb",
      "signature": "21dd33005f4f7425cdcbfe793997dc42496d8377272b76ea159215d64246bf91",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603187941,
    "seed": "28249a823b0e0054fa2fb65d7b11f4d51f3a6fced6b5d617be9f12b4400945a9",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

You can see that you have persisted 7 bytes in **_precedence_** (`data.bytes` field).

To retrieve the original data you can run: 

```bash
curl -XGET "$api/records/379ccc9a492f599a5a58d903b9abc5f1fa8b9ab726ce4a1739913d09026d50df?data=true"
```

---

Let's create the same original data again.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
```
```json
{
  "took": 22,
  "status": 201,
  "data": {
    "provable": {
      "id": "def79a8bc561159f63cbb3bbf69c3dede64dd54ba0702f9c3659b8718f254e86",
      "seed": "0a1e15291ad9f1383c498a5582ef27e3a13162bfaa9eeba8de95c0417ecf3018",
      "hash": "48c6840f4ff19b41918a9b8dd368bf3ba5c860e4a3009c9c9bdd9416915c4533",
      "address": "5664dbe8b047529461c8777ef93fe70999d215bc40badab2b00faf956357dd8d",
      "signature": "cf7f2e87b80affde07bd7435ce9f1ccd987e143ee9f635949a555aba586f997d",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603237215,
    "seed": "233a28d4499d772136d356d6dd1626c09b88c903bd00d98ad88823391ef7fa00",
    "hash": "e0a44d3c544c8895dacc7c32952766ee4db44122af955826e45c9486639ef5e4",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xbcb94922257b69fb5bf7bee76be9110100b569290e234b580f6ca8a96af477c37708eaf951ad2032bd3f9c453dc4d74e0db03cd554356ef95baccf4ea0ea0d801b",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

All the values of the `provable` object are different from the previous one, even with the same original data. This is made possible by using the `seed` in the hashing process. This way the `provable` fields are 100% obfuscated and can not lead to data leaking.

---

It is also possible to provide the fingerprint of the original data with the `hash` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&hash=085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9" -d "value 4"
```

```json
{
  "took": 23,
  "status": 201,
  "data": {
    "provable": {
      "id": "c74b5cb9df676eeea0eb4eb4231d728d01db08a425f875813d32862554ceb8a5",
      "seed": "6e6c265aeb7abad0f427f33b041670003e5f3b3e9da40723a29b10eb623c53b3",
      "hash": "af6bf6af537704d86774a34562f1d06492ad6fa550ed5cc0e21a9005afdceb03",
      "address": "eb3b87ede8b32df0704518d8d78f82b3d78812a47aa726f421e652961efc01d3",
      "signature": "bb5d2f6cd2e6da726a925d9cc4de1a74163d99a301e315bf5aad8be437d27ccb",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603250667,
    "seed": "649066a2b9e0e97ecfc98cba6d59f466404360604f449a1f97597ea3407adcde",
    "hash": "085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x0335865798e357d8dbe4a851f387e2f091be6eca16d3909711a0450eb030323a12cf602f31b1635add36f2bd67a4bd5a49e175ac86c828b811a06c30c49b3fc21c",
    "chains": {}
  }
}
```

By doing so the received data fingerprint is compared to the provided one to make sure that the received data has not be altered by the network.

---

You can specify an identifier for your record. This identifier must be unique and so can not be attached to any other record.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&store=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5"
```

```json
{
  "took": 22,
  "status": 201,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "5ddddb5bac7af05cc4b3e47c3b058bd46f3fca3bb7007887a41a43df285a19da",
      "hash": "bb4ae4119a99c11ef46319dd34f8c75d4f8b905784f3885de63c7155e2da29ee",
      "address": "597126bf1738c0b77f11351272c89eaa4dee586cba3c15c374449a8bbf52d71f",
      "signature": "950e834799d7af63f6326c4df1d7cd0eedaad2bfc10fee37a782a4c6116a0800",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603268065,
    "seed": "546cc35f1c40b8215dcabdeeccf2eb7bbf2a772228351c897891e6147fe2e1ee",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

The returned identifier is the fingerprint of the identifier you provided.

If you try to create a new record with the same identifier you will get an error.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 6"
```

```json
{
  "took": 21,
  "status": 409,
  "error": 3,
  "message": "Record \"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4\" already exists"
}
```

---

To read a record you can use its identifier.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 4,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "5ddddb5bac7af05cc4b3e47c3b058bd46f3fca3bb7007887a41a43df285a19da",
      "hash": "bb4ae4119a99c11ef46319dd34f8c75d4f8b905784f3885de63c7155e2da29ee",
      "address": "597126bf1738c0b77f11351272c89eaa4dee586cba3c15c374449a8bbf52d71f",
      "signature": "950e834799d7af63f6326c4df1d7cd0eedaad2bfc10fee37a782a4c6116a0800",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603268065,
    "seed": "546cc35f1c40b8215dcabdeeccf2eb7bbf2a772228351c897891e6147fe2e1ee",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

To create a new block you can run the following command. To know more about block management check the dedicated `block` documentation section below.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 136,
  "status": 201,
  "data": {
    "root": "492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca",
    "index": 0,
    "timestamp": 1581603314203,
    "count": 5,
    "previous": null
  }
}
```

The block is created, you can now get the record again and retrieve additional information.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 20,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "5ddddb5bac7af05cc4b3e47c3b058bd46f3fca3bb7007887a41a43df285a19da",
      "hash": "bb4ae4119a99c11ef46319dd34f8c75d4f8b905784f3885de63c7155e2da29ee",
      "address": "597126bf1738c0b77f11351272c89eaa4dee586cba3c15c374449a8bbf52d71f",
      "signature": "950e834799d7af63f6326c4df1d7cd0eedaad2bfc10fee37a782a4c6116a0800",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603268065,
    "seed": "546cc35f1c40b8215dcabdeeccf2eb7bbf2a772228351c897891e6147fe2e1ee",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "data": {
      "bytes": 7
    },
    "block": {
      "root": "492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca",
      "proof": [
        "f8b1808080a00c1056b897b4640e06ad680f87d7047b30dfa52101f2d0153cfd97472d096298808080a09b5a1ac370a7bf87c32b11531335b0295447cee935d1c57082f846f0971cbb4580a07b02273010bf63b05771d076d013a7897c3113285337318f8f3c699ad44ecbe28080a0a1f492527a48e66733a1e3f4e174144c2e8f09240ef957fd7450379f0c47477aa0f3768543968ef1807702923f32a2728b3d008bbe5a9bc5a7256c5ffa740c7399808080",
        "f85180808080808080a0bb5a098d26973f368c317051bc206a88d00ca89a17931a6633ac7af69781bb3a8080a0ffdd3002866ee61e09c0746c65ed3018a1672cb79f76ee3f402ac92ac194f452808080808080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a05f02808fad2130649a54e6fd65750279e36aca184f3f18037a04f2bdf813a5cc"
      ]
    }
  }
}
```

The returned document contains information related to the block the record belongs to:
- `root` is the block root hash that contains this record;
- `proof` is an array that contains the agnostic proof-of-existence of this record in the block.

To check the proof, see the dedicated open-source project [precedence-proof](https://github.com/inblocks/precedence-proof).

---

You can delete the data that is stored in the record. The record itself can not be deleted because it would cause chain inconsistency, same thing for the hash of the data, but the data itself is not required to keep the chain consistent.

```bash
curl -XDELETE "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 12,
  "status": 200,
  "data": {
    "bytes": 7
  }
}
```

The record data has been deleted releasing `7` bytes, let's retrieve this record again.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
```

```json
{
  "took": 23,
  "status": 200,
  "data": {
    "provable": {
      "id": "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4",
      "seed": "5ddddb5bac7af05cc4b3e47c3b058bd46f3fca3bb7007887a41a43df285a19da",
      "hash": "bb4ae4119a99c11ef46319dd34f8c75d4f8b905784f3885de63c7155e2da29ee",
      "address": "597126bf1738c0b77f11351272c89eaa4dee586cba3c15c374449a8bbf52d71f",
      "signature": "950e834799d7af63f6326c4df1d7cd0eedaad2bfc10fee37a782a4c6116a0800",
      "chains": {},
      "previous": []
    },
    "timestamp": 1581603268065,
    "seed": "546cc35f1c40b8215dcabdeeccf2eb7bbf2a772228351c897891e6147fe2e1ee",
    "hash": "3db104a9dc47163e43226d0b25c4cabf082d1813a80d4d217b75a9c2b1e49ae8",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x7c6d80cf86f8c5b096d1761eaedb9835896c0ccd839722d4197b268ba8e7c568154bf8bf701ba689dd68e5d8f3f7528d721c35ca87e79021a447587f2966d0c61b",
    "chains": {},
    "block": {
      "root": "492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca",
      "proof": [
        "f8b1808080a00c1056b897b4640e06ad680f87d7047b30dfa52101f2d0153cfd97472d096298808080a09b5a1ac370a7bf87c32b11531335b0295447cee935d1c57082f846f0971cbb4580a07b02273010bf63b05771d076d013a7897c3113285337318f8f3c699ad44ecbe28080a0a1f492527a48e66733a1e3f4e174144c2e8f09240ef957fd7450379f0c47477aa0f3768543968ef1807702923f32a2728b3d008bbe5a9bc5a7256c5ffa740c7399808080",
        "f85180808080808080a0bb5a098d26973f368c317051bc206a88d00ca89a17931a6633ac7af69781bb3a8080a0ffdd3002866ee61e09c0746c65ed3018a1672cb79f76ee3f402ac92ac194f452808080808080",
        "f842a02031d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4a05f02808fad2130649a54e6fd65750279e36aca184f3f18037a04f2bdf813a5cc"
      ]
    }
  }
}
```

The `data` field has been removed from the response and if you try to get the original data, you'll get an error.

```bash
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true&data=true"
```

```json
{
  "took": 2,
  "status": 404,
  "error": 5,
  "message": "Record \"3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4\" data not found"
}
```

---

To create a record as a new state of an existing record you should use the `previous` parameter. It allows you to link you records with each other.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=61E51581-7763-4486-BF04-35045DC7A0D3&store=true&previous=3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" -d "value 6"
```

```json
{
  "took": 26,
  "status": 201,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "3f3b5a7587f65e41568da013b1be5eb88a3c2a3de2262d5e26370360d1bb3040",
      "hash": "e6251a3cac5199bae9b15a40d7fa6f8a7f67a146453780fe155d320b75747a7c",
      "address": "2c8aa725ff05cf07c944aa4353fbd24c3233445e937fd98fcfbb85ae24772199",
      "signature": "54b19c2cb49d1692e08a1d59a643f390258f063e132ae7762358a9c0d8642a37",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1581603403048,
    "seed": "a2e03df0ca1b39409efac8d080b5c27905d7cf6d4f71c85dd98ec18b298ce4da",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

The `previous` field contains the parameter you provided. This parameter must be the identifier that was returned at creation time, you can not use your own identifier to link your records. If you want to link your record based on a label that you control, use the chain parameter (this is explain in the [chain](#chain-api-calls) section below).

## Chain API calls

The chain API calls have been designed to facilitate the record insertion and the creation of links (using the `previous` field) between those records.

To insert a record in the **_precedence_** system by using the chain method you need to use the `chain` parameter.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=4FF6B617-F1CF-4F10-A314-4C7733A9DB7F&chain=chain1" -d "value 7"
```

```json
{
  "took": 33,
  "status": 201,
  "data": {
    "provable": {
      "id": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951",
      "seed": "939703f6ac98fcf363abb2b64372cccbc511c765213d66e5853469175560f05a",
      "hash": "4840c2316a647ac967cb8f042984540249d12d87755019d738e072a737f9448f",
      "address": "060746bf4ad970f4df35cc32a6a4cc933395fad281c408b1b0d68000400e7d9d",
      "signature": "677d1a583002e2d82f45003b89a80ed00d6b1ba6703b667039d6a2f8466c281c",
      "chains": {
        "768ec6a3601806769dcd92fdbb02dd49996dec75ac00f5e8dacc1092678013d5": null
      },
      "previous": []
    },
    "timestamp": 1581603418428,
    "seed": "a8f49360c0795d9f3461df2c93d21ddd5cd3e393329c29ea153013f0d0d78b2a",
    "hash": "ed914881e913845413125b682876d976b9eab7335980726ddc59f785beb4d5ad",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa1d9b27cb9cbcdda4172a373ef4e82f13f193d837e2e21b760685d099354ef7a7e3250470af7e33ffe6b77aa27b0d509b00e311917249a022abf4cc8469506751b",
    "chains": {
      "chain1": null
    }
  }
}
```

The field `chains` contains information about the chain state at insertion time. In this scenario the chain `chain1` was never used before so this newly created record is the first and the last record of this chain. Because there was no record in this chain the value set in `chain.chain1` is `null`. When the chain exists, the inserted record is appended behind the last record of the chain specified in the parameter `chain`. In the same time, and in a atomic way, the newly inserted record become the last record of the chain and can be refered to using the `chain1` label.

Let's insert a second record using this `chain1` label.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&id=2B6C83EF-474D-4A15-B1D5-A1EC7E8226CF&chain=chain1&store=true" -d "value 8"
```

```json
{
  "took": 48,
  "status": 201,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "6707e7ed8518526c44a7cbd89be41b1d76b42fa2ee1cf31e5642450359c00f02",
      "hash": "596bd376dcb2a0cedc7f566c11219ca7c4292067b7da54aaf078126b0924f4c2",
      "address": "dae8fe34f9c31c16e4e0d71edbf144cb24286b673e40cc32c370ca49d4246ced",
      "signature": "3bdb5b99a714fa2dc16e441de8029faa83e03fe21787733675939ad11bec2656",
      "chains": {
        "844997abe2fd49b63ba43093a8efb02b4f5b13c7b0e31c3cd5146b0fa2f22b60": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1581603431733,
    "seed": "3de1e276b7dfdea38ce0c356fcc30e97fbbd3b3f57f48c7d9a9852207d1f8705",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": {
      "bytes": 7
    }
  }
}
```

The field `chains` contains the key `chain1` whose value is the record identifier of the previously inserted record. The record has been appended at the end of the chain and the label `chain1` now refers to the newly inserted record. This information is provable because it is part of the record definition. The key stored in `provable.chains` has been obfuscated to avoid any data leak. `chains.chain1` can be removed by deleting the entire chain.

We can check that:
- the obfuscated fingerprint of `chain1` is equal to `844997abe2fd49b63ba43093a8efb02b4f5b13c7b0e31c3cd5146b0fa2f22b60`:
```bash
echo -n "3de1e276b7dfdea38ce0c356fcc30e97fbbd3b3f57f48c7d9a9852207d1f8705 chain1" | sha256sum
```
- the `chains.chain1` value is equal to the `provable.chains.844997abe2fd49b63ba43093a8efb02b4f5b13c7b0e31c3cd5146b0fa2f22b60` value: `893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951`.

---

To retrieve the record currently refered by a chain name (i.e. the last record of the chain), you can use the following API call:

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "id": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "seed": "6707e7ed8518526c44a7cbd89be41b1d76b42fa2ee1cf31e5642450359c00f02",
      "hash": "596bd376dcb2a0cedc7f566c11219ca7c4292067b7da54aaf078126b0924f4c2",
      "address": "dae8fe34f9c31c16e4e0d71edbf144cb24286b673e40cc32c370ca49d4246ced",
      "signature": "3bdb5b99a714fa2dc16e441de8029faa83e03fe21787733675939ad11bec2656",
      "chains": {
        "844997abe2fd49b63ba43093a8efb02b4f5b13c7b0e31c3cd5146b0fa2f22b60": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      },
      "previous": [
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1581603431733,
    "seed": "3de1e276b7dfdea38ce0c356fcc30e97fbbd3b3f57f48c7d9a9852207d1f8705",
    "hash": "1bb1c73103ef6ae888ab45afa617f8ec63f21bf959a284363d7a83055ac4f87d",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x13f6c3fbc6513cd9dbeca59878613ea10f2356bf5fcc75d15b8993ceb5cb56156b11668c316505ba817f8ab2a0edb24b555de3442865ee336f0b9f3cad8634ae1b",
    "chains": {
      "chain1": "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
    },
    "data": {
      "bytes": 7
    }
  }
}
```

---

You can insert a record by setting multiple `chain` and `previous` parameters.

```bash
curl -XPOST -H "Content-Type: application/octet-stream" "$api/records?pretty=true&chain=chain1&chain=chain2&previous=893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951&previous=75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6&store=true" -d "value 9"
```

```json
{
  "took": 51,
  "status": 201,
  "data": {
    "provable": {
      "id": "86dfff5fb903bfbe8001e559b2f507b6572d885f97c20a0d3f45f3fcf6ffddd4",
      "seed": "7a40a269e654c1a1336cfdea45616ba2a19be7f46849a4c58d8c29a1707d00ca",
      "hash": "2e3d364cdbfdf81e01a476b6f3300a71506ca649229f98bcf536dbbd54f5ed8b",
      "address": "7e4d994fd3360a1f3a0438d292a47cf3eed069f8a042217d32d0704fb25da3c8",
      "signature": "efef2a8d2c42089bcdafabe31391d5f54b828dc82b3e36d6279121854845f79e",
      "chains": {
        "6371d71c19fdbc7b7176582ee03c3fe0343c6a40ec813871977bc95700873529": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "68692e91fbf50945c50e319f3f06ac1b20db9b0536d167c8f5d91a8762a98c1b": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1581604162861,
    "seed": "3d75a9de0d1f5fa2eb1ebaa68fe5c4e0f69734872d49d4b2423fb57f927eb249",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": {
      "bytes": 7
    }
  }
}
```

In this case the **_precedence_** server computes at insertion time and in a atomic way the previous record(s) of this newly inserted record. It uses the chain parameters to get the list of the previous records, it merges this set to the set defined using the `previous` parameter. This atomic operation also make sure that this record is considered as the last record of the chains that have been set as parameter.

---

The previous inserted record is the last records on both `chain1` and `chain2`. Let's try to retrieve the records refered by chain `chain1` and chain `chain2` to compare the result.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 6,
  "status": 200,
  "data": {
    "provable": {
      "id": "86dfff5fb903bfbe8001e559b2f507b6572d885f97c20a0d3f45f3fcf6ffddd4",
      "seed": "7a40a269e654c1a1336cfdea45616ba2a19be7f46849a4c58d8c29a1707d00ca",
      "hash": "2e3d364cdbfdf81e01a476b6f3300a71506ca649229f98bcf536dbbd54f5ed8b",
      "address": "7e4d994fd3360a1f3a0438d292a47cf3eed069f8a042217d32d0704fb25da3c8",
      "signature": "efef2a8d2c42089bcdafabe31391d5f54b828dc82b3e36d6279121854845f79e",
      "chains": {
        "6371d71c19fdbc7b7176582ee03c3fe0343c6a40ec813871977bc95700873529": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "68692e91fbf50945c50e319f3f06ac1b20db9b0536d167c8f5d91a8762a98c1b": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1581604162861,
    "seed": "3d75a9de0d1f5fa2eb1ebaa68fe5c4e0f69734872d49d4b2423fb57f927eb249",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": {
      "bytes": 7
    }
  }
}
```

```bash
curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 7,
  "status": 200,
  "data": {
    "provable": {
      "id": "86dfff5fb903bfbe8001e559b2f507b6572d885f97c20a0d3f45f3fcf6ffddd4",
      "seed": "7a40a269e654c1a1336cfdea45616ba2a19be7f46849a4c58d8c29a1707d00ca",
      "hash": "2e3d364cdbfdf81e01a476b6f3300a71506ca649229f98bcf536dbbd54f5ed8b",
      "address": "7e4d994fd3360a1f3a0438d292a47cf3eed069f8a042217d32d0704fb25da3c8",
      "signature": "efef2a8d2c42089bcdafabe31391d5f54b828dc82b3e36d6279121854845f79e",
      "chains": {
        "6371d71c19fdbc7b7176582ee03c3fe0343c6a40ec813871977bc95700873529": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "68692e91fbf50945c50e319f3f06ac1b20db9b0536d167c8f5d91a8762a98c1b": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1581604162861,
    "seed": "3d75a9de0d1f5fa2eb1ebaa68fe5c4e0f69734872d49d4b2423fb57f927eb249",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain1": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
      "chain2": null
    },
    "data": {
      "bytes": 7
    }
  }
}
```

We can see that both requests return the same result, both chains have the same the last record.

---

To delete an entire chain, not the blockchain itself but all records that belong to a chain, you can run the following command:

```bash
curl -XDELETE "$api/chains/chain1?pretty=true&data=true"
```

```json
{
  "took": 14,
  "status": 200,
  "data": {
    "records": 3,
    "data": {
      "records": 2,
      "bytes": 14
    }
  }
}
```

The response gives you:
- the number of records of the chain;
- the number of records whose data have been deleted;
- the total bytes released.

```bash
curl -XGET "$api/chains/chain1?pretty=true"
```

```json
{
  "took": 6,
  "status": 404,
  "error": 7,
  "message": "Chain \"chain1\" not found"
}
```

```bash
curl -XGET "$api/chains/chain2?pretty=true"
```

```json
{
  "took": 8,
  "status": 200,
  "data": {
    "provable": {
      "id": "86dfff5fb903bfbe8001e559b2f507b6572d885f97c20a0d3f45f3fcf6ffddd4",
      "seed": "7a40a269e654c1a1336cfdea45616ba2a19be7f46849a4c58d8c29a1707d00ca",
      "hash": "2e3d364cdbfdf81e01a476b6f3300a71506ca649229f98bcf536dbbd54f5ed8b",
      "address": "7e4d994fd3360a1f3a0438d292a47cf3eed069f8a042217d32d0704fb25da3c8",
      "signature": "efef2a8d2c42089bcdafabe31391d5f54b828dc82b3e36d6279121854845f79e",
      "chains": {
        "6371d71c19fdbc7b7176582ee03c3fe0343c6a40ec813871977bc95700873529": "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "68692e91fbf50945c50e319f3f06ac1b20db9b0536d167c8f5d91a8762a98c1b": null
      },
      "previous": [
        "44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3",
        "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
        "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951"
      ]
    },
    "timestamp": 1581604162861,
    "seed": "3d75a9de0d1f5fa2eb1ebaa68fe5c4e0f69734872d49d4b2423fb57f927eb249",
    "hash": "52d11cc7df0271d87bdd6c70e17a8a1ea878ac96dd9c0a8d5860df87cefbdb8e",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0x9512cf941a081db411960054d00a204e0cde97f34c477576b50aa21be15d43c04ac1f514babd0be4b7f39123e8594da32caf527e5a4aeed316e65ad570c9a1b41b",
    "chains": {
      "chain2": null
    }
  }
}
```

```bash
curl -XGET "$api/records/75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6?pretty=true"
```

```json
{
  "took": 11,
  "status": 200,
  "data": {
    "provable": {
      "id": "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6",
      "seed": "3f3b5a7587f65e41568da013b1be5eb88a3c2a3de2262d5e26370360d1bb3040",
      "hash": "e6251a3cac5199bae9b15a40d7fa6f8a7f67a146453780fe155d320b75747a7c",
      "address": "2c8aa725ff05cf07c944aa4353fbd24c3233445e937fd98fcfbb85ae24772199",
      "signature": "54b19c2cb49d1692e08a1d59a643f390258f063e132ae7762358a9c0d8642a37",
      "chains": {},
      "previous": [
        "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4"
      ]
    },
    "timestamp": 1581603403048,
    "seed": "a2e03df0ca1b39409efac8d080b5c27905d7cf6d4f71c85dd98ec18b298ce4da",
    "hash": "5b193ff1cf8ac2f1aabe5fe7de85debb29e8f337bc89b135a590c1073800cf80",
    "address": "0x4592350babefcc849943db091b6c49f8b86f8aaa",
    "signature": "0xa6bbc4cc1e50088492dc482801c4d4695d14f367b3b10e34f93a962e1a8213b634b7bfa6a95edc6bbc25a359cf9a4554d6dee72078a671f401b6aa667dcb1ab31c",
    "chains": {},
    "data": {
      "bytes": 7
    }
  }
}
```

`chain1` has been deleted as a chain label but the record that was referred to by this chain label is still available (without any data) and can be accessed using the `chain2` label. The data of record `75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6` hasn't been deleted because this record was not part of `chain1`.

### Block API calls

You can create a block by running:

```bash
curl -XPOST "$api/blocks?pretty=true&max=1"
```

```json
{
  "took": 96,
  "status": 201,
  "data": {
    "root": "11a6c4cca99fbb0f55dbbb9c53c217167e43dc91d28e0538e51d8e4d8d41bcd0",
    "index": 1,
    "timestamp": 1581604277882,
    "count": 1,
    "previous": {
      "root": "492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca",
      "proof": [
        "e217a0d807718f9cae760e829d73f9bc5810d9dcd0539b3838952e6163912ef03b2b4d",
        "f871a0f6b13d955c6fedced811631479415a47462430c6a278c7b621d52d0387ad6f038080a0bb887e8125a44dcbc5865e803cf62721059284d8b4f2b8d65893b9bb90ed4bbc80a0ce18fff64748b3eec28dcd4197a533fac9241244690b658959e2c0cb628beeb18080808080808080808080",
        "ea8820726576696f7573a0492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca"
      ]
    }
  }
}
```

The block creation API method returns the following informations:
- `took` is the number of milliseconds this request needed to be processed at server-side;
- `status` is the HTTP status code;
- `data` contains every piece of information related to the block you created;
  - `root` is the root hash of the block;
  - `index` is the block number, starting at 0;
  - `timestamp` is the record creation time (EPOCH millisecond);
  - `count` is the number of record contained in the block;
  - `previous` is `null` if `index` is `0`;
    - `root` is the root hash of the previous block;
    - `proof` is the associated proof in this block.

To create a block without any limit on the number of record that it will contain you can run the same API call without the `max` parameter.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 118,
  "status": 201,
  "data": {
    "root": "0f59e004bebe847a665bc7df3941b7168ee0f0bfa2b2ea77b383c58324979e6e",
    "index": 2,
    "timestamp": 1581604292300,
    "count": 3,
    "previous": {
      "root": "11a6c4cca99fbb0f55dbbb9c53c217167e43dc91d28e0538e51d8e4d8d41bcd0",
      "proof": [
        "f87180808080a03a429eb76c9ced59100e36684d23b970cbb4ebffbb35938bcd944d2af3cf040a8080a0d6c27167f232aedc5b4e22176644637fb3a87dbf2cec4d91221a9efb3f54d187a0805b5e1f9512b182dc1753cc9160948927d46cd18a2e08d06de35b04be65ad9a8080808080808080",
        "f851a0dc2c7aee8546bdd1440add2b409bfee565da419994ecfd554e90d9cba32570468080a0ec8f94e9af29ad98e0b01bb9c6519d8a75502d9d7bb576ba88c753240d7f87e180808080808080808080808080",
        "ea8820726576696f7573a011a6c4cca99fbb0f55dbbb9c53c217167e43dc91d28e0538e51d8e4d8d41bcd0"
      ]
    }
  }
}
```

You can run the block creation again even if you do not have sent any new records.

```bash
curl -XPOST "$api/blocks?pretty=true"
```

```json
{
  "took": 57,
  "status": 201,
  "data": {
    "root": "a51b7c0996c8162593dd81424ad57372ff1b8880e28e77ab5d11c9fa430cf2cc",
    "index": 3,
    "timestamp": 1581604302793,
    "count": 0,
    "previous": {
      "root": "0f59e004bebe847a665bc7df3941b7168ee0f0bfa2b2ea77b383c58324979e6e",
      "proof": [
        "e217a01412dedc9a5241c780eb2d40e399481dbc8ecfb44b1623a082563e0e9ae83c02",
        "f851a0fb902557bae622be5e393878a08e8ce69aa1736c9c868ddf8b0bcb634900b8d58080a06cd4228392d61441d7bf6cf544098c85ed5007bd02833ba92d9df2f59dfc749c80808080808080808080808080",
        "ea8820726576696f7573a00f59e004bebe847a665bc7df3941b7168ee0f0bfa2b2ea77b383c58324979e6e"
      ]
    }
  }
}
```

A empty block is created.

If you want to avoid block creation with 0 record you can use the `no-empty` option.

```bash
curl -XPOST "$api/blocks?pretty=true&no-empty=true"
```

```json
{
  "took": 24,
  "status": 200,
  "data": null
}
```

There was no record to put in the block so the API call returned no error and did not create any new block.

---

To retrieve the pending block information you can run the following:

```bash
curl -XGET "$api/blocks?pretty=true"
```

```json
{
  "took": 12,
  "status": 200,
  "data": {
    "count": 0,
    "previous": {
      "root": "a51b7c0996c8162593dd81424ad57372ff1b8880e28e77ab5d11c9fa430cf2cc",
      "index": 3,
      "timestamp": 1581604302793,
      "count": 0,
      "previous": {
        "root": "0f59e004bebe847a665bc7df3941b7168ee0f0bfa2b2ea77b383c58324979e6e",
        "proof": [
          "e217a01412dedc9a5241c780eb2d40e399481dbc8ecfb44b1623a082563e0e9ae83c02",
          "f851a0fb902557bae622be5e393878a08e8ce69aa1736c9c868ddf8b0bcb634900b8d58080a06cd4228392d61441d7bf6cf544098c85ed5007bd02833ba92d9df2f59dfc749c80808080808080808080808080",
          "ea8820726576696f7573a00f59e004bebe847a665bc7df3941b7168ee0f0bfa2b2ea77b383c58324979e6e"
        ]
      }
    }
  }
}
```

You can retrieve a block by specifying its index in the path.

```bash
curl -XGET "$api/blocks/1?pretty=true"
```

```json
{
  "took": 11,
  "status": 200,
  "data": {
    "root": "11a6c4cca99fbb0f55dbbb9c53c217167e43dc91d28e0538e51d8e4d8d41bcd0",
    "index": 1,
    "timestamp": 1581604277882,
    "count": 1,
    "previous": {
      "root": "492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca",
      "proof": [
        "e217a0d807718f9cae760e829d73f9bc5810d9dcd0539b3838952e6163912ef03b2b4d",
        "f871a0f6b13d955c6fedced811631479415a47462430c6a278c7b621d52d0387ad6f038080a0bb887e8125a44dcbc5865e803cf62721059284d8b4f2b8d65893b9bb90ed4bbc80a0ce18fff64748b3eec28dcd4197a533fac9241244690b658959e2c0cb628beeb18080808080808080808080",
        "ea8820726576696f7573a0492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca"
      ]
    }
  }
}
```

You can also retrieve it using its hash.

```bash
root=$(curl -sS -XGET "$api/blocks/1?pretty=true" | sed -En 's/.*"root": "([^"]*).*/\1/p' | head -n 1)
curl -XGET "$api/blocks/$root?pretty=true"
```

```json
{
  "took": 5,
  "status": 200,
  "data": {
    "root": "11a6c4cca99fbb0f55dbbb9c53c217167e43dc91d28e0538e51d8e4d8d41bcd0",
    "index": 1,
    "timestamp": 1581604277882,
    "count": 1,
    "previous": {
      "root": "492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca",
      "proof": [
        "e217a0d807718f9cae760e829d73f9bc5810d9dcd0539b3838952e6163912ef03b2b4d",
        "f871a0f6b13d955c6fedced811631479415a47462430c6a278c7b621d52d0387ad6f038080a0bb887e8125a44dcbc5865e803cf62721059284d8b4f2b8d65893b9bb90ed4bbc80a0ce18fff64748b3eec28dcd4197a533fac9241244690b658959e2c0cb628beeb18080808080808080808080",
        "ea8820726576696f7573a0492afc4b335a2ec63ee03ca8f9e38cf05142eb865a30518a6a33d36e75b9d4ca"
      ]
    }
  }
}
```

## Tips

```bash
# create a block with a file
cat FILE | curl -XPOST -H "Content-Type: application/octet-stream" "$api/records" --data-binary @-

# redis interactive client
docker run --rm -it --network host redis redis-cli

# redis client command
docker run --rm -i --network host redis redis-cli info
docker run --rm -i --network host redis redis-cli eval "return #redis.call('keys', 'precedence.*')" 0
```

## Ongoing developments

- ECMAScript 6 or Typescript with unit/integration tests, code coverage, code documentation, loggers with log level
- split modules into dedicated projects?
- NPM publication
- Redis auto-reconnection (bad gateway error)

# Change Data Capture

**precedence** can be easily plugged to an open source project that provides a low latency data streaming platform for change data capture (CDC) named [Debezium](https://github.com/debezium/debezium). We implemented a connector compliant with both Debezium and **precedence** and we have released it in the GitHub project [inblocks/precedence-debezium](https://github.com/inblocks/precedence-debezium). You should refer to this other project documentation to know more about the way **precedence** and Debezium can be plugged to each other.

If you want to run a demo by yourself you can check [this page](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo).
